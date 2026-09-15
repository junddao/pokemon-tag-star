/**
 * 공식 사이트와 중고 시세를 하루 한 번 수집해 public/data/*.json 을 만든다.
 *
 * 남의 사이트에 의존하므로 "언젠가 깨진다"를 전제로 짰다.
 * 수집 결과가 비거나 급감하면 기존 파일을 건드리지 않고 실패로 끝낸다.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { parsePlacePage, parseStagePage, parseTagDetail } from '../src/lib/parse-official.ts';
import { summarizePrices } from '../src/lib/parse-prices.ts';
import { reuseLocalImages } from '../src/lib/images.ts';
import { buildScores } from '../src/lib/scoring.ts';
import type { Place, PriceStat, ScrapeRun, Tag } from '../src/lib/types.ts';

const ROOT = path.resolve(import.meta.dirname, '..');
const PUBLIC_DATA = path.join(ROOT, 'public', 'data');
const IMAGE_DIR = path.join(ROOT, 'public', 'tags');
const RUN_LOG = path.join(ROOT, 'data', 'scrape-runs.json');

const BASE = 'https://pokemontagstar.co.kr';
const STAGE_CATEGORIES = [1, 4];
// HTTP 헤더는 Latin-1 만 담을 수 있으므로 ASCII 로만 적는다.
const UA = 'pokestar-fansite/1.0 (non-commercial fan site; fetches once per day)';

const args = new Set(process.argv.slice(2));
const SKIP_PRICES = args.has('--no-prices');
const SKIP_IMAGES = args.has('--no-images');

const notes: string[] = [];
const startedAt = new Date().toISOString();

async function get(url: string, init?: RequestInit): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: { 'User-Agent': UA, ...(init?.headers ?? {}) },
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/** 동시 요청 수를 묶어 상대 서버를 두드리지 않는다. */
async function mapLimit<T, R>(items: T[], limit: number, fn: (item: T, i: number) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let cursor = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (cursor < items.length) {
        const i = cursor++;
        out[i] = await fn(items[i], i);
      }
    }),
  );
  return out;
}

async function collectTags(): Promise<Tag[]> {
  const byNo = new Map<string, Tag>();
  for (const cate of STAGE_CATEGORIES) {
    const html = await get(`${BASE}/kr/sub/stage.php?cate=${cate}`);
    const { stageLabel, tags } = parseStagePage(html);
    notes.push(`stage cate=${cate} "${stageLabel}" → ${tags.length}개`);
    for (const t of tags) if (!byNo.has(t.no)) byNo.set(t.no, t);
  }
  const tags = [...byNo.values()];

  // 상세 팝업에서 앞/뒷면을 채운다.
  await mapLimit(tags, 4, async (tag) => {
    try {
      const html = await get(`${BASE}/kr/sub/stage_pop_view.php?idx=${tag.sourceIdx}`, { method: 'POST' });
      const { front, back } = parseTagDetail(html);
      tag.images.front = front;
      tag.images.back = back;
    } catch {
      notes.push(`상세 실패: ${tag.no}`);
    }
  });

  return tags.sort(compareTags);
}

function compareTags(a: Tag, b: Tag): number {
  if (a.stage !== b.stage) return a.stage - b.stage;
  if (a.rarity !== b.rarity) return b.rarity - a.rarity;
  return a.no.localeCompare(b.no);
}

async function collectPlaces(): Promise<Place[]> {
  const html = await get(`${BASE}/kr/sub/place.php`);
  const places = parsePlacePage(html);
  notes.push(`place → ${places.length}곳`);
  return places;
}

async function collectPrices(tags: Tag[]): Promise<PriceStat[]> {
  const allNames = [...new Set(tags.map((t) => t.name))];
  return mapLimit(tags, 3, async (tag) => {
    const q = encodeURIComponent(`포켓몬 태그스타 ${tag.name}`);
    const url = `https://api.bunjang.co.kr/api/1/find_v2.json?q=${q}&order=score&page=0&n=100&stat_device=w`;
    try {
      const raw = await get(url);
      const json = JSON.parse(raw) as { list?: { name: string; price: string }[] };
      return summarizePrices(tag.no, json.list ?? [], { name: tag.name, otherNames: allNames });
    } catch {
      notes.push(`시세 실패: ${tag.no} ${tag.name}`);
      return { no: tag.no, median: null, samples: 0, min: null, max: null, observedAt: new Date().toISOString() };
    }
  });
}

/** 공식 이미지를 내려받아 보관한다. 이미 있으면 건너뛰므로 매일 돌려도 싸다. */
async function downloadImages(tags: Tag[]): Promise<void> {
  await fs.mkdir(IMAGE_DIR, { recursive: true });
  const jobs: { url: string; file: string; apply: (local: string) => void }[] = [];

  for (const tag of tags) {
    const safe = tag.no.replace(/[^\w-]/g, '_');
    for (const kind of ['thumb', 'front', 'back'] as const) {
      const url = tag.images[kind];
      if (!url) continue;
      const ext = path.extname(new URL(url).pathname) || '.png';
      const file = `${safe}-${kind}${ext}`;
      jobs.push({ url, file, apply: (local) => { tag.images[kind] = local; } });
    }
  }

  await mapLimit(jobs, 6, async (job) => {
    const dest = path.join(IMAGE_DIR, job.file);
    try {
      await fs.access(dest);
    } catch {
      try {
        const res = await fetch(job.url, { headers: { 'User-Agent': UA } });
        if (!res.ok) throw new Error(String(res.status));
        await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
      } catch {
        notes.push(`이미지 실패: ${job.file}`);
        return;
      }
    }
    job.apply(`/tags/${job.file}`);
  });
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await fs.readFile(file, 'utf8')) as T;
  } catch {
    return fallback;
  }
}

/**
 * 스냅샷 가드. 이게 없으면 공식 사이트 개편 하루 만에 도감이 빈 화면이 된다.
 */
function guard(label: string, incoming: number, previous: number): void {
  if (incoming === 0) throw new Error(`${label} 수집 0건 — 기존 데이터를 유지하고 중단한다`);
  if (previous > 0 && incoming < previous * 0.8) {
    throw new Error(`${label} 급감 (${previous} → ${incoming}) — 파서가 깨졌을 가능성이 높다`);
  }
}

async function main(): Promise<void> {
  await fs.mkdir(PUBLIC_DATA, { recursive: true });
  await fs.mkdir(path.dirname(RUN_LOG), { recursive: true });

  const prevTags = await readJson<Tag[]>(path.join(PUBLIC_DATA, 'tags.json'), []);
  const prevPlaces = await readJson<Place[]>(path.join(PUBLIC_DATA, 'places.json'), []);

  const [tags, places] = await Promise.all([collectTags(), collectPlaces()]);
  guard('태그', tags.length, prevTags.length);
  guard('설치장소', places.length, prevPlaces.length);

  if (SKIP_IMAGES) reuseLocalImages(tags, prevTags);
  else await downloadImages(tags);

  const prices = SKIP_PRICES
    ? await readJson<PriceStat[]>(path.join(PUBLIC_DATA, 'prices.json'), [])
    : await collectPrices(tags);

  const priceMap = new Map(prices.map((p) => [p.no, p]));
  const scores = buildScores(tags, priceMap);
  const priced = scores.filter((s) => s.confidence === 'market').length;

  await Promise.all([
    write('tags.json', tags),
    write('places.json', places),
    write('prices.json', prices),
    write('scores.json', scores),
    write('meta.json', {
      updatedAt: new Date().toISOString(),
      counts: { tags: tags.length, places: places.length, pricedTags: priced },
      source: BASE,
    }),
  ]);

  await appendRun({
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: true,
    tags: tags.length,
    places: places.length,
    pricedTags: priced,
    notes,
  });

  console.log(`완료 — 태그 ${tags.length} / 매장 ${places.length} / 실거래 시세 확보 ${priced}`);
}

async function write(name: string, data: unknown): Promise<void> {
  await fs.writeFile(path.join(PUBLIC_DATA, name), JSON.stringify(data, null, 2) + '\n');
}

async function appendRun(run: ScrapeRun): Promise<void> {
  const history = await readJson<ScrapeRun[]>(RUN_LOG, []);
  history.unshift(run);
  await fs.writeFile(RUN_LOG, JSON.stringify(history.slice(0, 30), null, 2) + '\n');
}

main().catch(async (err) => {
  const message = err instanceof Error ? err.message : String(err);
  notes.push(`중단: ${message}`);
  await appendRun({
    startedAt,
    finishedAt: new Date().toISOString(),
    ok: false,
    tags: 0,
    places: 0,
    pricedTags: 0,
    notes,
  });
  console.error('실패 —', message);
  process.exit(1);
});
