import type { Rarity } from './types.ts';

/**
 * 공식 사이트 등급 헤더를 숫자로 바꾼다.
 * 예) "슈퍼스타태그 (★6)" -> 6, "레귤러태그" -> 0
 * 태그 섹션이 아닌 헤더("이번 탄의 ...")는 null.
 */
export function parseRarity(header: string): Rarity | null {
  const star = header.match(/★\s*([1-6])/);
  if (star) return Number(star[1]) as Rarity;
  if (header.includes('레귤러')) return 0;
  return null;
}

export function rarityLabel(rarity: Rarity): string {
  if (rarity === 0) return '레귤러';
  if (rarity === 6) return '슈퍼스타 ★6';
  if (rarity === 5) return '스타 ★5';
  return `★${rarity}`;
}

/** 등급별 기본 거래점수. ★4 이하가 사실상 0인 것이 이 서비스의 전제다. */
export const RARITY_BASE_TP: Record<Rarity, number> = {
  0: 0.3,
  2: 0.3,
  3: 0.4,
  4: 0.5,
  5: 10,
  6: 80,
};

/** 등급 사다리에서 "수량으로 메울 수 없는" 경계. ★6은 ★5 뭉치로 대체되지 않는다. */
export const ANCHOR_RARITY: Rarity = 6;

/**
 * 실거래 시세를 믿기 위해 필요한 최소 표본 수.
 * 낮은 등급일수록 단품 매물이 드물어, 검색에 걸리는 소수는 예외이거나
 * 필터를 빠져나간 묶음일 가능성이 높다. 그래서 문턱을 더 높게 잡는다.
 */
export const MIN_SAMPLES_BY_RARITY: Record<Rarity, number> = {
  6: 3, 5: 5, 4: 8, 3: 8, 2: 8, 0: 6,
};

/**
 * 등급별로 거래점수가 들어갈 수 있는 범위.
 *
 * "★4 이하는 사실상 버리는 태그"는 이 게임의 사실이다.
 * 수집된 시세가 이 범위를 벗어나면 시세가 틀린 것으로 보고 잘라낸다.
 * 이 장치가 없으면 표본 3개짜리 ★3이 ★5보다 비싸게 평가된다.
 */
export const TP_BAND: Record<Rarity, [min: number, max: number]> = {
  6: [5, 400],
  5: [2, 40],
  4: [0.2, 2],
  3: [0.2, 2],
  2: [0.2, 2],
  0: [0.2, 3],
};

export function clampTp(rarity: Rarity, tp: number): number {
  const [min, max] = TP_BAND[rarity];
  return Math.min(Math.max(tp, min), max);
}
