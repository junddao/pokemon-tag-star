import { typeEffectiveness, type PokemonType } from '../pokemon-types.ts';
import { moveOf } from './moves.ts';
import type { Fighter, AttackOutcome, Verdict } from './types.ts';
import type { Rng } from './rng.ts';

/**
 * 데미지 공식.
 *
 * 기계는 데미지를 숫자로 보여주지 않는다. 아래 식은 shootdoy lab 이 플레이 화면의
 * HP 게이지를 픽셀 단위로 재서 8건을 맞춰본 결과를 그대로 가져온 것이다 (최악오차 13%).
 *
 *     데미지 = 위력 × (공격 + 룰렛보너스) ÷ 방어 × 타입배율
 *
 * 공식 자료가 아니므로 실제 기계와 완전히 같지는 않다. 다만 어느 태그로 때려야
 * 유리한지를 고르는 데 쓰기에는 충분하고, 공개된 것 중 유일하게 실측에 맞춰진 식이다.
 */

/** 급소 배율은 실측으로 2.0 에 가까웠다. 발동 확률은 관측된 바가 없어 본가 값을 쓴다. */
export const CRITICAL_MULTIPLIER = 2;
export const CRITICAL_CHANCE = 1 / 16;

/** 연타를 하나도 안 하면 0.75배, 무지개까지 채우면 1.0배로 둔다. */
const MASH_FLOOR = 0.75;

/** 다이맥스 레벨별 에너지 배율 — 실측 5건이 이 값으로 설명됐다. */
export const DYNAMAX_MULTIPLIER: Record<number, number> = {
  1: 1.051,
  5: 1.104,
  10: 1.154,
};

export function verdictOf(multiplier: number): Verdict {
  if (multiplier === 0) return 'none';
  if (multiplier > 1) return 'great';
  if (multiplier < 1) return 'weak';
  return 'normal';
}

export interface AttackContext {
  attacker: Fighter;
  defender: Fighter;
  /** 평소엔 태그의 기술, 기믹이 터진 턴에는 기믹 기술 */
  moveName: string;
  roulette: number;
  mash: number;
  /** 다이맥스 중이면 레벨, 아니면 undefined */
  dynamaxLevel?: number;
  rng: Rng;
}

export function resolveAttack(context: AttackContext): AttackOutcome {
  const { attacker, defender, moveName, roulette, mash, dynamaxLevel, rng } = context;
  const move = moveOf(moveName);

  // 표에 없는 기술이면 때릴 수 없다. 조용히 0 을 내면 원인을 못 찾는다.
  if (!move) throw new Error(`기술 «${moveName}» 이 moves.ts 에 없다`);

  const multiplier = typeEffectiveness(move.type, defender.types as readonly PokemonType[]);
  if (multiplier === 0) {
    return { damage: 0, multiplier: 0, critical: false, verdict: 'none', fainted: false };
  }

  const physical = move.category === 'physical';
  const attack = physical ? attacker.stats.atk : attacker.stats.spa;
  const guard = physical ? defender.stats.def : defender.stats.spd;

  const boost = dynamaxLevel ? (DYNAMAX_MULTIPLIER[dynamaxLevel] ?? 1) : 1;
  const critical = rng.chance(CRITICAL_CHANCE);
  const mashScale = MASH_FLOOR + (1 - MASH_FLOOR) * clamp01(mash);

  const raw = (move.power * (attack * boost + roulette)) / guard
    * multiplier
    * mashScale
    * (critical ? CRITICAL_MULTIPLIER : 1);

  // 상성이 0 이 아닌 한 최소 1 은 들어가야 한다. 0 이 뜨면 플레이어는 버그로 읽는다.
  const damage = Math.max(1, Math.round(raw));

  return {
    damage,
    multiplier,
    critical,
    verdict: verdictOf(multiplier),
    fainted: defender.hp - damage <= 0,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
