import fs from 'node:fs';
import path from 'node:path';
import type { Place, PriceStat, Tag, TagScore } from './types.ts';
import { asset } from './site.ts';

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

/**
 * JSON 안의 이미지 경로는 basePath 를 모른다. 그 파일은 공개 API 로도 쓰이므로
 * 배포 위치에 오염되면 안 되기 때문이다. 화면에 넘길 때만 여기서 붙인다.
 *
 * next/image 는 unoptimized 모드에서 src 에 basePath 를 붙여주지 않는다.
 * 이 변환이 없으면 하위 경로 배포에서 태그 이미지가 전부 404 가 된다.
 */
function withBasePath(images: Tag['images']): Tag['images'] {
  const prefix = (src: string | null) => (src?.startsWith('/') ? asset(src) : src);
  return {
    thumb: prefix(images.thumb) as string,
    front: prefix(images.front),
    back: prefix(images.back),
  };
}

/** 화면에서 거의 항상 태그와 점수를 함께 쓰므로 미리 붙여둔다. */
export function getTagsWithScores(): TagWithScore[] {
  const scores = new Map(getScores().map((s) => [s.no, s]));
  return getTags().map((tag) => ({
    ...tag,
    images: withBasePath(tag.images),
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
