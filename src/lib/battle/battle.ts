import { SPECIES_TYPES } from '../pokemon-types.ts';
import type { Basket } from '../store.ts';
import { resolveAttack } from './damage.ts';
import type { Rng } from './rng.ts';
import {
  ALL_OUT_CHANCE, ALL_OUT_TURN, TOTAL_TURNS,
  firstMover, gimmickAvailable, usableNow,
} from './rules.ts';
import { wheelFor } from './roulette.ts';
import type {
  AttackOutcome, BattleTurn, Fighter, GimmickKind, Side, TagStats, TurnInput,
} from './types.ts';

/**
 * 배틀 한 판의 상태 기계.
 *
 * 화면이 룰렛 숫자와 연타 강도를 넘기면 여기서 한 턴을 해결한다. React 를 쓰지 않고
 * 난수를 주입받으므로, 같은 시드와 같은 입력이면 언제나 같은 배틀이 나온다.
 */

export type Phase = 'reveal' | 'select' | 'resolved' | 'gettime' | 'done';

export interface BattleState {
  phase: Phase;
  turn: number;
  /** [왼쪽, 보스, 오른쪽] — 가운데가 보스다 */
  foes: Fighter[];
  bossIndex: number;
  team: Fighter[];
  /** 이번 턴에 상대가 먼저 내보인 포켓몬 */
  revealed: number;
  lastUsed: string | null;
  usedGimmicks: GimmickKind[];
  log: BattleTurn[];
  won: boolean;
}

export function toFighter(stats: TagStats): Fighter {
  return {
    no: stats.no,
    name: stats.name,
    types: SPECIES_TYPES[stats.name] ?? ['노말'],
    stats,
    hp: stats.hp,
    maxHp: stats.hp,
    transformed: false,
  };
}

/**
 * 상대 3마리. 공식 진행 순서에서 «상대 포켓몬 등장»이 «너의 포켓몬을 꺼내자»보다
 * 먼저 오기 때문에, 팀과 떼어서 따로 만든다. 누가 나왔는지 보고 상성을 맞춰
 * 태그를 고르는 것이 이 게임의 핵심이다.
 */
export interface Encounter {
  foes: Fighter[];
  bossIndex: number;
}

export function createEncounter({ bosses, minions, rng }: {
  bosses: TagStats[];
  minions: TagStats[];
  rng: Rng;
}): Encounter {
  const boss = rng.pick(bosses);
  // 보스와 같은 포켓몬이 양옆에 서면 어느 쪽이 보스인지 헷갈린다.
  const pool = minions.filter((m) => m.name !== boss.name);
  const left = rng.pick(pool);
  const right = rng.pick(pool.filter((m) => m.no !== left.no));

  return { foes: [toFighter(left), toFighter(boss), toFighter(right)], bossIndex: 1 };
}

export function startBattle(encounter: Encounter, team: TagStats[]): BattleState {
  return {
    phase: 'reveal',
    turn: 1,
    foes: encounter.foes,
    bossIndex: encounter.bossIndex,
    team: team.map(toFighter),
    revealed: encounter.bossIndex,
    lastUsed: null,
    usedGimmicks: [],
    log: [],
    won: false,
  };
}

export interface CreateBattleOptions {
  /** 보스 후보 (★5·★6·레귤러) */
  bosses: TagStats[];
  /** 좌우에 세울 약한 태그 후보 */
  minions: TagStats[];
  /** 내가 고른 태그 3장 */
  team: TagStats[];
  rng: Rng;
}

export function createBattle({ bosses, minions, team, rng }: CreateBattleOptions): BattleState {
  return startBattle(createEncounter({ bosses, minions, rng }), team);
}

/** 상대가 이번 턴에 낼 한 마리를 정한다. 쓰러진 쪽은 빼고, 보스가 조금 더 자주 나온다. */
export function revealFoe(state: BattleState, rng: Rng): BattleState {
  const alive = state.foes
    .map((foe, index) => ({ foe, index }))
    .filter(({ foe }) => foe.hp > 0);

  const weighted = alive.flatMap(({ index }) =>
    index === state.bossIndex ? [index, index] : [index]);

  return { ...state, phase: 'select', revealed: rng.pick(weighted) };
}

/** 이번 턴에 낼 수 있는 내 태그. 직전 턴 카드는 두 장 이상 가진 게 아니면 못 낸다. */
export function selectable(state: BattleState, owned: Basket): string[] {
  return state.team
    .filter((fighter) => fighter.hp > 0 && usableNow(fighter.no, state.lastUsed, owned))
    .map((fighter) => fighter.no);
}

/** 이번 턴에 이 태그로 쓸 수 있는 기믹. 팀 전체 기준으로 한 번씩만 쓴다. */
export function availableGimmick(state: BattleState, no: string): GimmickKind | null {
  const fighter = state.team.find((f) => f.no === no);
  const kind = fighter?.stats.gimmick?.kind ?? null;
  if (!kind || !gimmickAvailable(state.usedGimmicks, kind)) return null;
  return kind;
}

export function wheelOf(state: BattleState, no: string, dynamaxed = false): number[] {
  const fighter = state.team.find((f) => f.no === no);
  return wheelFor(fighter?.stats.energy ?? 60, dynamaxed);
}

export interface ResolveOptions {
  myNo: string;
  input: TurnInput;
  /** 선공 찬스 연타에 성공했는지. 후공일 때만 의미가 있다. */
  preempt?: boolean;
  rng: Rng;
}

export interface ResolveResult {
  state: BattleState;
  turn: BattleTurn;
  /** 「다 같이 공격!」이 터졌는지 */
  allOut: boolean;
}

export function resolveTurn(state: BattleState, options: ResolveOptions): ResolveResult {
  const { myNo, input, preempt, rng } = options;
  const myIndex = state.team.findIndex((f) => f.no === myNo);
  if (myIndex < 0) throw new Error(`팀에 없는 태그: ${myNo}`);

  const team = state.team.map((f) => ({ ...f }));
  const foes = state.foes.map((f) => ({ ...f }));
  const mine = team[myIndex];
  const foe = foes[state.revealed];

  const gimmick = input.gimmick && availableGimmick(state, myNo) === input.gimmick
    ? input.gimmick
    : undefined;
  const myMove = gimmick ? (mine.stats.gimmick?.move ?? mine.stats.move) : mine.stats.move;
  const dynamaxLevel = gimmick === 'dynamax' ? (input.dynamaxLevel ?? 1) : undefined;

  // 스피드로 선후공이 갈리고, 후공이어도 「선공 찬스」를 성공하면 뒤집힌다.
  const natural = firstMover(mine, foe);
  const first: Side = natural === 'foe' && preempt ? 'mine' : natural;

  const allOut = state.turn === ALL_OUT_TURN && rng.chance(ALL_OUT_CHANCE);

  const strike = (): AttackOutcome => {
    const outcome = resolveAttack({
      attacker: mine, defender: foe, moveName: myMove,
      roulette: input.roulette, mash: input.mash, dynamaxLevel, rng,
    });
    // 「다 같이 공격!」이면 우리편 전원이 함께 때린다. 남은 두 장은 평타로 계산한다.
    const extra = allOut
      ? team.filter((f) => f.no !== myNo && f.hp > 0).reduce((sum, ally) => sum + resolveAttack({
        attacker: ally, defender: foe, moveName: ally.stats.move,
        roulette: input.roulette, mash: input.mash, rng,
      }).damage, 0)
      : 0;
    const damage = outcome.damage + extra;
    foe.hp = Math.max(0, foe.hp - damage);
    return { ...outcome, damage, fainted: foe.hp === 0 };
  };

  const counter = (): AttackOutcome => {
    const outcome = resolveAttack({
      attacker: foe, defender: mine, moveName: foe.stats.move,
      // 상대는 룰렛·연타가 없다. 기계가 내는 값이라 중간치로 고정한다.
      roulette: 20, mash: 0.85, rng,
    });
    mine.hp = Math.max(0, mine.hp - outcome.damage);
    return { ...outcome, fainted: mine.hp === 0 };
  };

  let myAttack: AttackOutcome | null = null;
  let foeAttack: AttackOutcome | null = null;

  if (first === 'mine') {
    myAttack = strike();
    if (foe.hp > 0) foeAttack = counter();
  } else {
    foeAttack = counter();
    if (mine.hp > 0) myAttack = strike();
  }

  const turn: BattleTurn = {
    index: state.turn,
    foeNo: foe.no,
    myNo,
    first,
    myAttack,
    foeAttack,
  };

  const bossDown = foes[state.bossIndex].hp === 0;
  const lastTurn = state.turn >= TOTAL_TURNS;

  return {
    allOut,
    turn,
    state: {
      ...state,
      team,
      foes,
      lastUsed: myNo,
      usedGimmicks: gimmick ? [...state.usedGimmicks, gimmick] : state.usedGimmicks,
      log: [...state.log, turn],
      turn: state.turn + 1,
      // 보스를 쓰러뜨렸거나 3턴이 끝나면 겟 타임이다. 공식 「배틀로 겟」 모드 순서와 같다.
      phase: bossDown || lastTurn ? 'gettime' : 'reveal',
      won: bossDown,
    },
  };
}
