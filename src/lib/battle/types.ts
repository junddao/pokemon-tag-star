import type { PokemonType } from '../pokemon-types.ts';

/** 태그 한 장의 전투 수치. 뒷면(스탯·기술)과 앞면(에너지)에서 읽어온 값이다. */
export interface TagStats {
  no: string;
  name: string;
  /** 앞면의 「에너지」. 기계가 쓰는 종합 전투력이고 다이맥스가 여기에 배율을 곱한다. */
  energy: number;
  hp: number;
  atk: number;
  def: number;
  spa: number;
  spd: number;
  spe: number;
  move: string;
  gimmick?: { kind: 'dynamax' | 'z'; move: string };
}

export type GimmickKind = 'dynamax' | 'z' | 'mega';

/** 배틀에 나선 포켓몬 한 마리. 태그 정보 + 이번 판에서만 변하는 상태. */
export interface Fighter {
  no: string;
  name: string;
  types: readonly PokemonType[];
  stats: TagStats;
  hp: number;
  maxHp: number;
  /** 이 태그가 이번 배틀에서 기믹을 이미 썼는지 */
  transformed: boolean;
}

export type Side = 'mine' | 'foe';

export interface AttackOutcome {
  damage: number;
  multiplier: number;
  critical: boolean;
  /** 「훌륭해 / 보통이야 / 부족해」 로 화면에 뜨는 값 */
  verdict: Verdict;
  fainted: boolean;
}

export type Verdict = 'great' | 'normal' | 'weak' | 'none';

export interface TurnInput {
  /** 공격 룰렛에서 멈춘 숫자 */
  roulette: number;
  /** 버튼 연타 강도 0~1. 1이면 무지개(최대 위력) */
  mash: number;
  /** 이번 턴에 발동할 기믹 */
  gimmick?: GimmickKind;
  /** 다이맥스 룰렛에서 뽑은 레벨 (1·5·10) */
  dynamaxLevel?: number;
}

export interface BattleTurn {
  index: number;
  foeNo: string;
  myNo: string;
  first: Side;
  myAttack: AttackOutcome | null;
  foeAttack: AttackOutcome | null;
}

export type BallKind = '몬스터볼' | '슈퍼볼' | '하이퍼볼';
