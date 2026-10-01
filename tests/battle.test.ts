import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { createBattle, resolveTurn, revealFoe, selectable, toFighter, availableGimmick } from '../src/lib/battle/battle.ts';
import { resolveAttack } from '../src/lib/battle/damage.ts';
import { MOVES } from '../src/lib/battle/moves.ts';
import { seededRng } from '../src/lib/battle/rng.ts';
import { wheelFor } from '../src/lib/battle/roulette.ts';
import { usableNow, firstMover } from '../src/lib/battle/rules.ts';
import { captureChance } from '../src/lib/battle/capture.ts';
import type { TagStats } from '../src/lib/battle/types.ts';
import { SPECIES_TYPES } from '../src/lib/pokemon-types.ts';

const stats: TagStats[] = JSON.parse(
  readFileSync(path.join(process.cwd(), 'public', 'data', 'stats.json'), 'utf8'),
);
const byNo = new Map(stats.map((s) => [s.no, s]));
const pick = (no: string): TagStats => {
  const found = byNo.get(no);
  if (!found) throw new Error(`테스트 태그 없음: ${no}`);
  return found;
};

describe('전투 수치 데이터', () => {
  it('태그 143장을 모두 덮는다', () => {
    const tags = JSON.parse(readFileSync(path.join(process.cwd(), 'public', 'data', 'tags.json'), 'utf8'));
    expect(stats).toHaveLength(tags.length);
    expect(new Set(stats.map((s) => s.no)).size).toBe(tags.length);
  });

  it('수치가 사람이 읽을 수 있는 범위 안에 있다', () => {
    for (const row of stats) {
      for (const value of [row.hp, row.atk, row.def, row.spa, row.spd, row.spe, row.energy]) {
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThan(0);
        expect(value).toBeLessThanOrEqual(300);
      }
    }
  });

  it('모든 기술이 기술표에 있다', () => {
    for (const row of stats) {
      expect(MOVES[row.move], `${row.no} ${row.move}`).toBeDefined();
      if (row.gimmick) expect(MOVES[row.gimmick.move], row.gimmick.move).toBeDefined();
    }
  });

  it('모든 포켓몬이 타입표에 있다', () => {
    for (const row of stats) expect(SPECIES_TYPES[row.name], row.name).toBeDefined();
  });

  /** 뮤츠는 뒷면 이미지와 나무위키 양쪽에서 같은 값이 나온 교차검증 기준점이다. */
  it('뮤츠 수치가 교차검증 값과 같다', () => {
    expect(pick('1-1-001')).toMatchObject({
      name: '뮤츠', energy: 158, hp: 172, atk: 119, def: 98, spa: 165, spd: 98, spe: 140,
      move: '사이코브레이크',
    });
  });
});

describe('공격 룰렛 휠', () => {
  /** 실물에서 관측된 두 건. 추정식이 이 둘을 맞추지 못하면 식을 고쳐야 한다. */
  it('짜랑고우거(에너지 158)는 10/20/50', () => {
    expect(wheelFor(158)).toEqual([10, 20, 50]);
  });

  it('에브이(에너지 112)는 10/20/35', () => {
    expect(wheelFor(112)).toEqual([10, 20, 35]);
  });

  it('다이맥스하면 최고 칸이 올라간다', () => {
    expect(wheelFor(158, true)).toEqual([10, 20, 60]);
  });

  it('에너지가 아주 낮아도 최고 칸이 가운데 칸보다 작아지지 않는다', () => {
    const [, mid, high] = wheelFor(32);
    expect(high).toBeGreaterThan(mid);
  });
});

describe('데미지', () => {
  const attacker = toFighter(pick('1-2-009')); // 제크로무 — 크로스썬더(전기)
  const water = toFighter(pick('1-2-001'));    // 가이오가 — 물

  it('같은 시드면 같은 결과가 나온다', () => {
    const run = () => resolveAttack({
      attacker, defender: water, moveName: '크로스썬더',
      roulette: 20, mash: 1, rng: seededRng(42),
    });
    expect(run()).toEqual(run());
  });

  it('전기가 물에게 효과가 굉장하다', () => {
    const outcome = resolveAttack({
      attacker, defender: water, moveName: '크로스썬더',
      roulette: 20, mash: 1, rng: seededRng(7),
    });
    expect(outcome.multiplier).toBe(2);
    expect(outcome.verdict).toBe('great');
  });

  it('무효인 상성은 데미지가 0 이다', () => {
    const ghost = toFighter(pick('1-1-016')); // 팬텀 — 고스트/독
    const normal = toFighter(pick('R-1-3'));  // 잠만보 — 노말 기가임팩트
    const outcome = resolveAttack({
      attacker: normal, defender: ghost, moveName: '기가임팩트',
      roulette: 50, mash: 1, rng: seededRng(1),
    });
    expect(outcome.damage).toBe(0);
    expect(outcome.verdict).toBe('none');
  });

  it('연타를 채우면 데미지가 늘어난다', () => {
    const weak = resolveAttack({
      attacker, defender: water, moveName: '크로스썬더', roulette: 20, mash: 0, rng: seededRng(5),
    });
    const full = resolveAttack({
      attacker, defender: water, moveName: '크로스썬더', roulette: 20, mash: 1, rng: seededRng(5),
    });
    expect(full.damage).toBeGreaterThan(weak.damage);
  });

  it('룰렛 숫자가 높을수록 데미지가 늘어난다', () => {
    const low = resolveAttack({
      attacker, defender: water, moveName: '크로스썬더', roulette: 10, mash: 1, rng: seededRng(5),
    });
    const high = resolveAttack({
      attacker, defender: water, moveName: '크로스썬더', roulette: 50, mash: 1, rng: seededRng(5),
    });
    expect(high.damage).toBeGreaterThan(low.damage);
  });

  it('표에 없는 기술이면 조용히 넘어가지 않고 터진다', () => {
    expect(() => resolveAttack({
      attacker, defender: water, moveName: '없는기술', roulette: 10, mash: 1, rng: seededRng(1),
    })).toThrow();
  });
});

describe('턴 규칙', () => {
  it('직전 턴에 쓴 카드는 못 낸다', () => {
    expect(usableNow('1-1-001', '1-1-001', {})).toBe(false);
  });

  it('같은 태그를 두 장 가지면 연달아 낼 수 있다', () => {
    expect(usableNow('1-1-001', '1-1-001', { '1-1-001': 2 })).toBe(true);
  });

  it('스피드가 높은 쪽이 먼저 친다', () => {
    const fast = toFighter(pick('1-1-003')); // 자시안 153
    const slow = toFighter(pick('R-1-3'));   // 잠만보 29
    expect(firstMover(fast, slow)).toBe('mine');
    expect(firstMover(slow, fast)).toBe('foe');
  });
});

describe('배틀 진행', () => {
  const team = [pick('1-2-009'), pick('1-1-003'), pick('1-2-004')];
  const bosses = [pick('1-2-001')];
  const minions = [pick('1-1-026'), pick('1-1-028'), pick('1-1-030')];

  const start = () => createBattle({ bosses, minions, team, rng: seededRng(99) });

  it('가운데가 보스다', () => {
    const state = start();
    expect(state.foes).toHaveLength(3);
    expect(state.foes[state.bossIndex].name).toBe('가이오가');
  });

  it('보스와 같은 포켓몬이 양옆에 서지 않는다', () => {
    const state = start();
    const boss = state.foes[state.bossIndex].name;
    expect(state.foes[0].name).not.toBe(boss);
    expect(state.foes[2].name).not.toBe(boss);
  });

  it('직전에 낸 태그는 다음 턴 선택지에서 빠진다', () => {
    const state = { ...start(), lastUsed: '1-2-009' };
    expect(selectable(state, {})).not.toContain('1-2-009');
    expect(selectable(state, {})).toContain('1-1-003');
  });

  it('기믹은 배틀당 한 번만 쓸 수 있다', () => {
    const state = start();
    expect(availableGimmick(state, '1-2-004')).toBe('z'); // 피카츄 — 스파킹기가볼트
    const used = { ...state, usedGimmicks: ['z' as const] };
    expect(availableGimmick(used, '1-2-004')).toBeNull();
  });

  it('보스를 쓰러뜨리면 겟 타임으로 넘어가고 승리로 기록된다', () => {
    let state = revealFoe(start(), seededRng(1));
    state = { ...state, revealed: state.bossIndex };
    state.foes[state.bossIndex].hp = 1; // 한 대면 쓰러지는 상태로 만든다

    const result = resolveTurn(state, {
      myNo: '1-2-009', input: { roulette: 50, mash: 1 }, rng: seededRng(3),
    });
    expect(result.state.phase).toBe('gettime');
    expect(result.state.won).toBe(true);
  });

  it('3턴을 다 쓰면 보스가 살아 있어도 겟 타임으로 넘어간다', () => {
    let state = revealFoe(start(), seededRng(1));
    state = { ...state, turn: 3 };
    const result = resolveTurn(state, {
      myNo: '1-2-009', input: { roulette: 10, mash: 0 }, rng: seededRng(4),
    });
    expect(result.state.phase).toBe('gettime');
  });

  it('턴을 넘기면 방금 낸 태그가 lastUsed 로 남는다', () => {
    const state = revealFoe(start(), seededRng(1));
    const result = resolveTurn(state, {
      myNo: '1-1-003', input: { roulette: 20, mash: 0.5 }, rng: seededRng(8),
    });
    expect(result.state.lastUsed).toBe('1-1-003');
  });
});

describe('겟 타임', () => {
  it('체력이 적을수록, 좋은 볼일수록 잘 잡힌다', () => {
    const target = toFighter(pick('1-2-001'));
    const full = captureChance(target, '몬스터볼');
    const hurt = captureChance({ ...target, hp: 1 }, '몬스터볼');
    const hyper = captureChance({ ...target, hp: 1 }, '하이퍼볼');

    expect(hurt).toBeGreaterThan(full);
    expect(hyper).toBeGreaterThan(hurt);
    expect(hyper).toBeLessThanOrEqual(0.95);
  });
});
