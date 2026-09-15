import type { Place, Rarity, Tag } from './types.ts';
import { parseRarity, rarityLabel } from './rarity.ts';

/**
 * 공식 사이트가 페이지 안에 심어둔 JS 배열 리터럴을 읽는다.
 * 주소에 콤마가 들어있으므로 따옴표를 존중하며 잘라야 한다.
 */
export function parseJsArray(html: string, name: string): string[] | null {
  const m = html.match(new RegExp('var\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\]\\s*;'));
  if (!m) return null;
  const body = m[1];
  const out: string[] = [];
  let buf = '';
  let quote: string | null = null;
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (quote) {
      if (c === '\\') { buf += body[++i] ?? ''; continue; }
      if (c === quote) { quote = null; continue; }
      buf += c;
    } else if (c === "'" || c === '"') {
      quote = c;
    } else if (c === ',') {
      out.push(buf.trim());
      buf = '';
    } else {
      buf += c;
    }
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** "1-2-001" 의 가운데 숫자가 탄. 레귤러("R-1-1")도 같은 자리를 쓴다. */
export function stageFromNo(no: string): number {
  const parts = no.split('-');
  const n = Number(parts[1]);
  return Number.isFinite(n) ? n : 0;
}

const TAG_ITEM = new RegExp(
  'stage_pop\\.php\\?idx=(\\d+)"' +      // 1: idx
  '[\\s\\S]*?<img src="([^"]+)" alt="[^"]*"' + // 2: 썸네일
  '[\\s\\S]*?tag-list-tit">([^<]*)<' +   // 3: 번호
  '[\\s\\S]*?tag-list-txt">([^<]*)<',    // 4: 이름
  'g',
);

/** stage.php 한 페이지에서 태그 목록을 뽑는다. */
export function parseStagePage(html: string): { stageLabel: string; tags: Tag[] } {
  const labelMatch = html.match(/<option value="\d+" selected>([^<]*)<\/option>/);
  const stageLabel = labelMatch ? labelMatch[1].trim() : '';

  // 등급 헤더를 기준으로 문서를 자르면 각 조각이 그 등급의 태그들이다.
  const parts = html.split(/<p class="cm-border-txt">([^<]*)<\/p>/);
  const tags: Tag[] = [];

  for (let i = 1; i < parts.length; i += 2) {
    const header = parts[i].trim();
    const rarity: Rarity | null = parseRarity(header);
    if (rarity === null) continue; // 태그 섹션이 아닌 헤더

    TAG_ITEM.lastIndex = 0;
    for (const m of parts[i + 1].matchAll(TAG_ITEM)) {
      const [, idx, thumb, no, name] = m;
      if (!no.trim()) continue;
      tags.push({
        no: no.trim(),
        name: name.trim(),
        stage: stageFromNo(no.trim()),
        stageLabel,
        rarity,
        rarityLabel: rarityLabel(rarity),
        sourceIdx: Number(idx),
        images: { thumb: absolute(thumb), front: null, back: null },
      });
    }
  }
  return { stageLabel, tags };
}

/** 상세 팝업에서 앞면/뒷면 이미지를 뽑는다. */
export function parseTagDetail(html: string): { front: string | null; back: string | null } {
  const imgs = [...html.matchAll(/<img src="([^"]+)" alt="(앞면|뒷면)">/g)];
  const pick = (alt: string) => {
    const hit = imgs.find((m) => m[2] === alt);
    return hit ? absolute(hit[1]) : null;
  };
  return { front: pick('앞면'), back: pick('뒷면') };
}

/**
 * place.php 는 372곳 전부를 JS 배열로 내려준다. 페이징을 따라갈 필요가 없다.
 * 주의: 공식 코드의 coordX 가 경도, coordY 가 위도다. 이름이 뒤집혀 있다.
 */
export function parsePlacePage(html: string): Place[] {
  const names = parseJsArray(html, 'listData2');
  const addrs = parseJsArray(html, 'listData');
  const lngs = parseJsArray(html, 'coordX');
  const lats = parseJsArray(html, 'coordY');
  const links = parseJsArray(html, 'listData3');
  if (!names || !addrs || !lngs || !lats || !links) return [];

  const n = Math.min(names.length, addrs.length, lngs.length, lats.length, links.length);
  const places: Place[] = [];
  for (let i = 0; i < n; i++) {
    const lat = Number(lats[i]);
    const lng = Number(lngs[i]);
    if (!isKoreaCoord(lat, lng)) continue;
    const idx = Number(links[i].match(/idx=(\d+)/)?.[1] ?? 0);
    const address = addrs[i].trim();
    places.push({
      idx,
      name: names[i].trim(),
      address,
      region: regionOf(address),
      lat,
      lng,
    });
  }
  return places;
}

/** 위경도가 뒤바뀐 행을 조용히 통과시키지 않기 위한 대한민국 경계 검사 */
export function isKoreaCoord(lat: number, lng: number): boolean {
  return Number.isFinite(lat) && Number.isFinite(lng)
    && lat > 32 && lat < 40 && lng > 124 && lng < 132;
}

const REGION_ALIASES: Record<string, string> = {
  서울: '서울', 부산: '부산', 대구: '대구', 인천: '인천', 광주: '광주',
  대전: '대전', 울산: '울산', 세종: '세종', 경기: '경기', 강원: '강원',
  충북: '충북', 충남: '충남', 전북: '전북', 전남: '전남',
  경북: '경북', 경남: '경남', 제주: '제주',
};

export function regionOf(address: string): string {
  const head = address.trim().split(/\s+/)[0] ?? '';
  for (const key of Object.keys(REGION_ALIASES)) {
    if (head.startsWith(key)) return REGION_ALIASES[key];
  }
  return '기타';
}

function absolute(src: string): string {
  if (src.startsWith('http')) return src;
  return 'https://pokemontagstar.co.kr' + (src.startsWith('/') ? src : '/' + src);
}
