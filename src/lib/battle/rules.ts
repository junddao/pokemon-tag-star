import type { Basket } from '../store.ts';
import type { Fighter, GimmickKind, Side, TagStats } from './types.ts';

/**
 * 기계에서 관측된 배틀 규칙. 공식 문서에 적힌 것과 플레이로 확인된 것이 섞여 있다.
 * 출처가 다르면 주석에 밝혀 둔다.
 */

/** 스피드가 높은 쪽이 먼저 친다. 공식 「포켓몬을 선택하는 포인트」 2번. */
export function firstMover(mine: Fighter, foe: Fighter): Side {
  if (mine.stats.spe === foe.stats.spe) return 'foe'; // 동속이면 기계가 상대를 먼저 낸다
  return mine.stats.spe > foe.stats.spe ? 'mine' : 'foe';
}

/**
 * 「선공 찬스」 — 후공일 때만 발동할 수 있고, 연타로 경계선을 밀어올리면 선공을 뺏는다.
 * 공식 설명에 확률은 없어서, 스피드 차가 적을수록 잘 붙게 둔다.
 */
export function preemptChance(mine: Fighter, foe: Fighter): number {
  const gap = foe.stats.spe - mine.stats.spe;
  if (gap <= 0) return 0;
  return Math.max(0.15, 0.6 - gap / 200);
}

/**
 * 직전 턴에 쓴 카드는 이번 턴에 못 낸다. 1턴 카드는 3턴에 다시 쓸 수 있다.
 *
 * 막는 것은 «포켓몬»이 아니라 «카드»다. 같은 태그를 두 장 이상 가지고 있으면
 * 연달아 낼 수 있다 — 그래서 보유 수량을 함께 본다.
 */
export function usableNow(no: string, lastUsed: string | null, owned: Basket): boolean {
  if (lastUsed !== no) return true;
  return (owned[no] ?? 0) >= 2;
}

/** 메가진화 · Z기술 · 다이맥스는 각각 배틀당 한 번, 팀 전체 기준이다. */
export function gimmickAvailable(used: GimmickKind[], kind: GimmickKind): boolean {
  return !used.includes(kind);
}

/** 태그가 쓸 수 있는 기믹. 뒷면에 다이맥스기술/Z기술이 찍혀 있으면 그 종류다. */
export function gimmickOf(stats: TagStats): GimmickKind | null {
  return stats.gimmick?.kind ?? null;
}

/**
 * 「다 같이 공격!」 — 마지막 턴에 가끔 터져서 우리편 전원이 같이 때린다.
 * 공식은 확률을 밝히지 않는다. 마지막 턴에만, 넉넉잡아 4판에 한 번으로 둔다.
 */
export const ALL_OUT_CHANCE = 0.25;
export const ALL_OUT_TURN = 3;

export const TOTAL_TURNS = 3;
