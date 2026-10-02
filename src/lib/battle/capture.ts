import type { BallKind, Fighter } from './types.ts';
import type { Rng } from './rng.ts';

/**
 * 겟 타임.
 *
 * 3번째 턴이 끝나거나 보스를 쓰러뜨리면 발동한다. 볼 룰렛으로 볼이 정해지고,
 * 버튼을 눌러 던진다. 공식은 포획 확률을 밝히지 않는다. 본가와 같은 뼈대 —
 * 남은 HP 가 적을수록, 좋은 볼일수록 잘 잡힌다 — 를 쓰고 값은 아래에 모아둔다.
 */
export const BALL_RATE: Record<BallKind, number> = {
  몬스터볼: 1,
  슈퍼볼: 1.5,
  하이퍼볼: 2,
};

export const BALL_WHEEL: BallKind[] = ['몬스터볼', '몬스터볼', '슈퍼볼', '슈퍼볼', '하이퍼볼'];

/** 쓰러뜨렸으면 거의 잡히고, 체력이 꽉 차 있으면 하이퍼볼도 반반이다. */
export function captureChance(target: Fighter, ball: BallKind): number {
  const remaining = Math.max(0, target.hp) / target.maxHp;
  const base = 0.25 + 0.55 * (1 - remaining);
  return Math.min(0.95, base * BALL_RATE[ball]);
}

export function throwBall(target: Fighter, ball: BallKind, rng: Rng): boolean {
  return rng.chance(captureChance(target, ball));
}

export function spinBallWheel(rng: Rng): BallKind {
  return rng.pick(BALL_WHEEL);
}
