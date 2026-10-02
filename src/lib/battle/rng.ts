/**
 * 주입식 난수.
 *
 * 배틀 결과가 재현되지 않으면 데미지 공식을 테스트할 방법이 없다. Math.random 을
 * 직접 부르는 대신 시드를 받는 생성기를 넘겨서, 같은 시드면 같은 배틀이 나오게 한다.
 */
export interface Rng {
  /** [0, 1) */
  next(): number;
  int(maxExclusive: number): number;
  pick<T>(items: readonly T[]): T;
  chance(probability: number): boolean;
}

/** mulberry32 — 32비트 시드 하나로 도는 작은 PRNG. 품질이 게임에 충분하고 구현이 짧다. */
export function seededRng(seed: number): Rng {
  let state = seed >>> 0;

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  return {
    next,
    int: (maxExclusive) => Math.floor(next() * maxExclusive),
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (probability) => next() < probability,
  };
}

export function randomRng(): Rng {
  return seededRng((Math.random() * 0xffffffff) >>> 0);
}
