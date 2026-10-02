/**
 * data/tag-stats.jsonl → public/data/stats.json
 *
 * 전투 수치는 태그 뒷면·앞면 이미지에만 인쇄돼 있어 사람이 읽어 jsonl 에 받아적었다.
 * 그 원본을 그대로 두고 여기서 검증한 뒤 화면이 읽는 형태로 옮긴다.
 * 탄이 추가되면 새 태그 줄만 jsonl 에 덧붙이고 이 스크립트를 다시 돌리면 된다.
 *
 *     node scripts/build-stats.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { MOVES } from '../src/lib/battle/moves.ts';
import { SPECIES_TYPES } from '../src/lib/pokemon-types.ts';
import type { Tag } from '../src/lib/types.ts';
import type { TagStats } from '../src/lib/battle/types.ts';

const ROOT = process.cwd();
const SOURCE = path.join(ROOT, 'data', 'tag-stats.jsonl');
const TARGET = path.join(ROOT, 'public', 'data', 'stats.json');

function fail(message: string): never {
  console.error('빌드 중단:', message);
  process.exit(1);
}

const tags: Tag[] = JSON.parse(readFileSync(path.join(ROOT, 'public', 'data', 'tags.json'), 'utf8'));
const rows: TagStats[] = readFileSync(SOURCE, 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((line) => JSON.parse(line));

const byNo = new Map(rows.map((row) => [row.no, row]));

// 한 장이라도 빠지면 그 태그는 배틀에 못 나간다. 조용히 넘기면 화면에서야 드러난다.
const missing = tags.filter((tag) => !byNo.has(tag.no)).map((tag) => tag.no);
if (missing.length) fail(`수치 없는 태그 ${missing.length}장: ${missing.slice(0, 8).join(', ')}`);

for (const row of rows) {
  const stats = [row.hp, row.atk, row.def, row.spa, row.spd, row.spe, row.energy];
  if (stats.some((value) => !Number.isInteger(value) || value < 1 || value > 300)) {
    fail(`${row.no} 수치가 범위를 벗어났다: ${stats.join('/')}`);
  }
  if (!MOVES[row.move]) fail(`${row.no} 기술 «${row.move}» 이 moves.ts 에 없다`);
  if (row.gimmick && !MOVES[row.gimmick.move]) {
    fail(`${row.no} 기믹기술 «${row.gimmick.move}» 이 moves.ts 에 없다`);
  }
  if (!SPECIES_TYPES[row.name]) fail(`${row.no} «${row.name}» 이 SPECIES_TYPES 에 없다`);
}

writeFileSync(TARGET, JSON.stringify(rows, null, 2) + '\n');
console.log(`stats.json 기록 — ${rows.length}장, 기믹 ${rows.filter((r) => r.gimmick).length}장`);
