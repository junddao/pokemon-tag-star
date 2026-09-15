import type { PriceStat } from './types.ts';

export interface RawListing {
  name: string;
  price: string | number;
}

/** 이 게임이 아니거나, 여러 장을 한 번에 파는 매물을 걸러내는 단어들 */
const BUNDLE_WORDS = ['일괄', '세트', '묶음', '벌크', '모음', '전부', '통째'];
const OTHER_GAME_WORDS = ['메자스타', '가오레', '트레타', '슬리브', '케이스', '바인더', '앨범'];

/** "5종", "3장", "10개" 처럼 수량이 붙은 제목 */
const QUANTITY = /\d+\s*(종|장|개|팩|세트)/;

export interface FilterContext {
  /** 지금 시세를 구하는 태그의 포켓몬 이름 */
  name: string;
  /** 다른 태그 이름 전부. 제목에 같이 등장하면 묶음 매물이다. */
  otherNames: string[];
}

export function isUsableListing(title: string, ctx: FilterContext): boolean {
  const t = title.replace(/\s+/g, ' ');

  if (!t.includes(ctx.name)) return false;
  if (OTHER_GAME_WORDS.some((w) => t.includes(w))) return false;
  if (BUNDLE_WORDS.some((w) => t.includes(w))) return false;
  if (QUANTITY.test(t)) return false;

  // 다른 포켓몬 이름이 함께 있으면 묶음. 자기 이름에 포함되는 이름은 무시한다.
  // (예: "이브이"와 "이브이즈" 같은 부분 일치)
  const others = ctx.otherNames.filter((n) => n !== ctx.name && !ctx.name.includes(n) && n.length >= 2);
  if (others.some((n) => t.includes(n))) return false;

  return true;
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : Math.round((s[mid - 1] + s[mid]) / 2);
}

/** 표본이 이보다 적으면 시세로 인정하지 않는다. */
export const MIN_SAMPLES = 3;

/** 명백한 오입력(1000원 미만 / 50만원 초과)을 자른다. */
const PRICE_MIN = 1000;
const PRICE_MAX = 500_000;

export function summarizePrices(
  no: string,
  listings: RawListing[],
  ctx: FilterContext,
  observedAt = new Date().toISOString(),
): PriceStat {
  const prices = listings
    .filter((l) => isUsableListing(String(l.name ?? ''), ctx))
    .map((l) => Number(l.price))
    .filter((p) => Number.isFinite(p) && p >= PRICE_MIN && p <= PRICE_MAX);

  if (prices.length < MIN_SAMPLES) {
    return { no, median: null, samples: prices.length, min: null, max: null, observedAt };
  }
  return {
    no,
    median: median(prices),
    samples: prices.length,
    min: Math.min(...prices),
    max: Math.max(...prices),
    observedAt,
  };
}
