/**
 * 공격 룰렛의 휠 구성.
 *
 * 휠 숫자는 태그에 인쇄돼 있지 않고 공개된 표도 없다. 실물 관측치는 둘뿐이다.
 *
 *     짜랑고우거(에너지 158) → 10 / 20 / 50
 *     에브이(에너지 112)     → 10 / 20 / 35
 *
 * 두 관측 모두 낮은 두 칸이 10·20 으로 같고 최고 칸만 달랐다. 그래서 최고 칸만
 * 에너지에 비례시키고 나머지는 고정한다. 아래 식은 두 관측값을 모두 맞춘다.
 * 실측이 더 쌓이면 이 파일만 표로 갈아끼우면 된다.
 */
const LOW = 10;
const MID = 20;
const ENERGY_PER_POINT = 3.2;

/** 다이맥스는 최고 칸을 끌어올린다 — 짜랑고우거가 레벨 1에서 50 → 60 으로 올랐다. */
const DYNAMAX_BONUS = 10;

function roundToFive(value: number): number {
  return Math.round(value / 5) * 5;
}

export function wheelFor(energy: number, dynamaxed = false): number[] {
  const raw = roundToFive(energy / ENERGY_PER_POINT);
  // 25 아래로 내려가면 최고 칸이 가운데 칸과 뒤집혀 룰렛이 말이 안 된다.
  const high = Math.min(60, Math.max(25, raw)) + (dynamaxed ? DYNAMAX_BONUS : 0);
  return [LOW, MID, high];
}

export function maxOf(wheel: number[]): number {
  return Math.max(...wheel);
}
