import fs from 'node:fs';
import path from 'node:path';
import type { Place, PriceStat, Tag, TagScore } from './types.ts';

export interface Meta {
  updatedAt: string;
  counts: { tags: number; places: number; pricedTags: number };
  source: string;
}

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

function load<T>(name: string, fallback: T): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf8')) as T;
  } catch {
    return fallback;
  }
}

export function getTags(): Tag[] {
  return load<Tag[]>('tags.json', []);
}

export function getPlaces(): Place[] {
  return load<Place[]>('places.json', []);
}

export function getPrices(): PriceStat[] {
  return load<PriceStat[]>('prices.json', []);
}

export function getScores(): TagScore[] {
  return load<TagScore[]>('scores.json', []);
}

export function getMeta(): Meta {
  return load<Meta>('meta.json', {
    updatedAt: '',
    counts: { tags: 0, places: 0, pricedTags: 0 },
    source: 'https://pokemontagstar.co.kr',
  });
}

export interface TagWithScore extends Tag {
  score: TagScore;
}

/** 화면에서 거의 항상 태그와 점수를 함께 쓰므로 미리 붙여둔다. */
export function getTagsWithScores(): TagWithScore[] {
  const scores = new Map(getScores().map((s) => [s.no, s]));
  return getTags().map((tag) => ({
    ...tag,
    score: scores.get(tag.no) ?? {
      no: tag.no, tp: 0, confidence: 'estimated' as const, priceKrw: null, samples: 0,
    },
  }));
}

export function formatKrw(krw: number | null): string {
  if (krw == null) return '—';
  return krw.toLocaleString('ko-KR') + '원';
}

export function formatUpdatedAt(iso: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleString('ko-KR', {
    timeZone: 'Asia/Seoul', year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
