'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  availableGimmick, createEncounter, resolveTurn, revealFoe, selectable, startBattle, wheelOf,
  type BattleState, type Encounter,
} from '@/lib/battle/battle';
import { randomRng } from '@/lib/battle/rng';
import { preemptChance } from '@/lib/battle/rules';
import { typeEffectiveness } from '@/lib/pokemon-types';
import { moveOf } from '@/lib/battle/moves';
import type { GimmickKind, TagStats, Verdict } from '@/lib/battle/types';
import { useOwned } from '@/lib/store';

import AttackRoulette from './AttackRoulette';
import BattleStage, { type Art, type Effect, type Hint } from './BattleStage';
import GetTime from './GetTime';
import GimmickChance, { type GimmickResult } from './GimmickChance';
import MashButton from './MashButton';
import TeamPicker from './TeamPicker';

/**
 * 「배틀로 겟」 모드 한 판.
 *
 * 공식 진행 순서를 그대로 따른다. 상대 등장 → 태그 세팅 → (턴마다) 상대 공개 →
 * 내 태그 선택 → 선공 찬스 → 기믹 찬스 → 공격 룰렛 → 버튼 연타 → 공격 →
 * 3턴 뒤 겟 타임. 전투 계산은 전부 src/lib/battle 의 순수 함수가 한다.
 */
type Step =
  | 'intro' | 'team' | 'reveal' | 'select' | 'preempt' | 'gimmick'
  | 'roulette' | 'mash' | 'strike' | 'gettime' | 'result';

export interface BattleGameProps {
  /** 내 팀 후보 — 태그 전체 */
  stats: TagStats[];
  /** 보스로 설 수 있는 태그 (★5·★6·레귤러) */
  bosses: TagStats[];
  /** 보스 좌우에 설 약한 태그 (★4 이하) */
  minions: TagStats[];
  art: Art;
}

export default function BattleGame({ stats, bosses, minions, art }: BattleGameProps) {
  const { owned, setQty } = useOwned();
  const [step, setStep] = useState<Step>('intro');
  const [state, setState] = useState<BattleState | null>(null);
  // 공식 순서는 «상대 등장 → 너의 포켓몬을 꺼내자» 다. 팀보다 상대가 먼저 정해진다.
  // 상대는 난수로 뽑으므로 렌더 중에 만들면 서버 결과와 어긋나 하이드레이션이 깨진다.
  // 실물도 동전을 넣어야 시작하므로, 버튼을 누른 시점에 뽑는다.
  const [encounter, setEncounter] = useState<Encounter | null>(null);
  const [myNo, setMyNo] = useState<string | null>(null);
  const [roulette, setRoulette] = useState(0);
  const [gimmick, setGimmick] = useState<GimmickResult | null>(null);
  const [preempt, setPreempt] = useState(false);
  const [effect, setEffect] = useState<Effect | null>(null);
  const [attacking, setAttacking] = useState<'mine' | 'foe' | null>(null);
  // 한 턴에 두 번 때릴 수 있는데 상태는 턴이 끝나야 바뀐다. 그 사이 HP 바가 멈춰
  // 있으면 숫자만 뜨고 바는 나중에 툭 바뀐다. 맞는 순간의 HP 를 따로 들고 있는다.
  const [hpNow, setHpNow] = useState<Record<string, number> | null>(null);
  const [caught, setCaught] = useState(false);

  const ownedNos = useMemo(() => Object.keys(owned).filter((no) => owned[no] > 0), [owned]);

  const begin = useCallback((team: TagStats[]) => {
    if (!encounter) return;
    setState(revealFoe(startBattle(encounter, team), randomRng()));
    setStep('select');
  }, [encounter]);

  const encounterStart = useCallback(() => {
    setEncounter(createEncounter({ bosses, minions, rng: randomRng() }));
    setState(null);
    setCaught(false);
    setStep('team');
  }, [bosses, minions]);

  const nextTurn = useCallback((current: BattleState) => {
    setMyNo(null);
    setGimmick(null);
    setPreempt(false);
    setRoulette(0);
    if (current.phase === 'gettime') {
      setStep('gettime');
      return;
    }
    setState(revealFoe(current, randomRng()));
    setStep('select');
  }, []);

  const strike = useCallback((mash: number) => {
    if (!state || !myNo) return;
    setStep('strike');
    setAttacking(null);

    const result = resolveTurn(state, {
      myNo,
      preempt,
      input: {
        roulette,
        mash,
        gimmick: gimmick?.used ? (availableGimmick(state, myNo) ?? undefined) : undefined,
        dynamaxLevel: gimmick?.level,
      },
      rng: randomRng(),
    });

    // 선공한 쪽을 먼저 돌진시키고, 한 박자 뒤에 반격을 보여준다.
    const order = result.turn.first === 'mine' ? ['mine', 'foe'] as const : ['foe', 'mine'] as const;
    const outcomes = {
      mine: result.turn.myAttack ? { target: 'foe' as const, ...result.turn.myAttack } : null,
      foe: result.turn.foeAttack ? { target: 'mine' as const, ...result.turn.foeAttack } : null,
    };

    // 맞는 순간마다 HP 를 깎아 바가 숫자와 함께 줄어들게 한다.
    const running: Record<string, number> = Object.fromEntries(
      [...state.foes, ...state.team].map((f) => [f.no, f.hp]),
    );
    const hitNo = { foe: state.foes[state.revealed].no, mine: myNo };

    let delay = 0;
    for (const side of order) {
      const outcome = outcomes[side];
      if (!outcome) continue;
      const at = delay;
      const no = hitNo[outcome.target];
      running[no] = Math.max(0, running[no] - outcome.damage);
      const snapshot = { ...running };

      setTimeout(() => { setAttacking(side); setEffect(null); }, at);
      setTimeout(() => {
        setEffect({
          target: outcome.target, damage: outcome.damage,
          verdict: outcome.verdict, critical: outcome.critical,
        });
        setHpNow(snapshot);
      }, at + 420);
      delay = at + 1500;
    }

    setTimeout(() => {
      setAttacking(null);
      setEffect(null);
      setHpNow(null);
      setState(result.state);
      nextTurn(result.state);
    }, delay + 300);
  }, [state, myNo, preempt, roulette, gimmick, nextTurn]);

  if (step === 'intro' || !encounter) {
    return (
      <div className="space-y-5 rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center">
        <p className="text-4xl">🎰</p>
        <h2 className="text-lg font-black">「배틀로 겟」 모드</h2>
        <p className="text-pretty text-xs leading-relaxed text-violet-200/65">
          야생 포켓몬이 나타나면 내 태그 3장을 세팅해요. 3턴 안에 가운데 보스를 쓰러뜨리면 승리!
        </p>
        <button type="button" onClick={encounterStart}
          className="h-14 w-full rounded-2xl bg-emerald-400 text-lg font-black text-ink-950">
          게임 스타트!
        </button>
      </div>
    );
  }

  if (step === 'team' || !state) {
    return <TeamPicker stats={stats} art={art} ownedNos={ownedNos} encounter={encounter} onStart={begin} />;
  }

  const foe = state.foes[state.revealed];
  const mine = myNo ? state.team.find((f) => f.no === myNo) ?? null : null;
  const target = state.foes[state.bossIndex].hp <= 0 ? state.foes[state.bossIndex] : foe;

  if (step === 'gettime') {
    return (
      <div className="space-y-5">
        <BattleStage {...{ foes: state.foes, bossIndex: state.bossIndex, revealed: null, team: state.team, activeNo: null, art, effect: null, attacking: null }} />
        <GetTime
          target={target}
          art={art}
          onDone={(got) => {
            // 잡은 포켓몬은 태그가 되어 보유 목록에 들어간다. 실물의 「태그로 만들기」에 해당한다.
            if (got) setQty(target.no, (owned[target.no] ?? 0) + 1);
            setCaught(got);
            setStep('result');
          }}
        />
      </div>
    );
  }

  if (step === 'result') {
    return (
      <div className="space-y-5 text-center">
        <p className="text-2xl font-black">{state.won ? '배틀 승리!' : '배틀 종료'}</p>
        <p className="text-sm text-violet-200/70">
          {state.won ? `${state.foes[state.bossIndex].name}을(를) 쓰러뜨렸어요.` : '3턴 안에 보스를 쓰러뜨리지 못했어요.'}
          {caught && ` ${target.name} 태그를 획득했어요!`}
        </p>
        <BattleStage {...{ foes: state.foes, bossIndex: state.bossIndex, revealed: null, team: state.team, activeNo: null, art, effect: null, attacking: null }} />
        <button type="button" onClick={encounterStart}
          className="h-14 w-full rounded-2xl bg-violet-400 text-lg font-black text-ink-950">
          한 판 더!
        </button>
      </div>
    );
  }

  const usable = selectable(state, owned);
  const gimmickKind: GimmickKind | null = myNo ? availableGimmick(state, myNo) : null;

  /** 선택 단계에서 포켓몬 칸에 직접 얹을 정보 — 상성·선후공·사용 가능 여부. */
  const hints: Record<string, Hint> = Object.fromEntries(state.team.map((member) => {
    const move = moveOf(member.stats.move);
    const multiplier = move ? typeEffectiveness(move.type, foe.types) : 1;
    const verdict: Verdict = multiplier === 0 ? 'none'
      : multiplier > 1 ? 'great' : multiplier < 1 ? 'weak' : 'normal';
    return [member.no, {
      verdict,
      faster: member.stats.spe > foe.stats.spe,
      blocked: !usable.includes(member.no),
      move: member.stats.move,
    }];
  }));

  const pick = (no: string) => {
    const faster = (state.team.find((f) => f.no === no)?.stats.spe ?? 0) > foe.stats.spe;
    setMyNo(no);
    // 선공이면 선공 찬스가 뜰 이유가 없다. 바로 기믹 또는 룰렛으로 넘어간다.
    setStep(faster ? (availableGimmick(state, no) ? 'gimmick' : 'roulette') : 'preempt');
  };

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-black">{state.turn}턴 / 3턴</h2>
        <span className="text-xs text-violet-200/55">보스 {state.foes[state.bossIndex].name}</span>
      </div>

      <BattleStage
        foes={state.foes}
        bossIndex={state.bossIndex}
        revealed={state.revealed}
        team={state.team}
        activeNo={myNo}
        art={art}
        effect={effect}
        attacking={attacking}
        hpNow={hpNow}
        hints={step === 'select' ? hints : undefined}
        onPick={step === 'select' ? pick : undefined}
      />

      {step === 'select' && (
        <p className="text-xs text-violet-200/45">
          상대는 <strong className="text-rose-200">{foe.name}</strong>. 직전 턴에 쓴 카드는 못 내요 —
          같은 태그를 2장 이상 보유하면 연달아 낼 수 있어요.
        </p>
      )}

      {step === 'preempt' && mine && (
        <div className="rounded-2xl border border-sky-300/30 bg-sky-400/10 p-5">
          <p className="mb-3 text-center text-sm font-black text-sky-200">선공 찬스!</p>
          <MashButton
            label="연타해서 경계선을 밀어 올려라"
            onDone={(strength) => {
              const won = strength >= 1 - preemptChance(mine, foe);
              setPreempt(won);
              setStep(gimmickKind ? 'gimmick' : 'roulette');
            }}
          />
        </div>
      )}

      {step === 'gimmick' && mine && gimmickKind && (
        <GimmickChance
          kind={gimmickKind}
          moveName={mine.stats.gimmick?.move ?? mine.stats.move}
          onResolve={(result) => { setGimmick(result); setStep('roulette'); }}
        />
      )}

      {step === 'roulette' && myNo && (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-5">
          <AttackRoulette
            wheel={wheelOf(state, myNo, gimmick?.used && gimmickKind === 'dynamax')}
            onStop={(value) => { setRoulette(value); setStep('mash'); }}
          />
        </div>
      )}

      {step === 'mash' && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
          <p className="mb-2 text-center text-xs text-violet-200/60">공격력 +{roulette}</p>
          <MashButton label="버튼을 마구 눌러라! 무지개까지!" onDone={strike} />
        </div>
      )}

      {step === 'strike' && (
        <p className="py-4 text-center text-sm font-bold text-violet-100">공격!</p>
      )}
    </div>
  );
}
