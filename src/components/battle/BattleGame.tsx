'use client';

import { useCallback, useMemo, useState } from 'react';
import {
  availableGimmick, createBattle, resolveTurn, revealFoe, selectable, wheelOf,
  type BattleState,
} from '@/lib/battle/battle';
import { randomRng } from '@/lib/battle/rng';
import { preemptChance } from '@/lib/battle/rules';
import { typeEffectiveness } from '@/lib/pokemon-types';
import { moveOf } from '@/lib/battle/moves';
import type { GimmickKind, TagStats, Verdict } from '@/lib/battle/types';
import { useOwned } from '@/lib/store';

import AttackRoulette from './AttackRoulette';
import BattleStage, { type Art, type Effect } from './BattleStage';
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
  | 'team' | 'reveal' | 'select' | 'preempt' | 'gimmick'
  | 'roulette' | 'mash' | 'strike' | 'gettime' | 'result';

const VERDICT_TEXT: Record<Verdict, string> = {
  great: '훌륭해', normal: '보통이야', weak: '부족해', none: '효과 없음',
};

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
  const [step, setStep] = useState<Step>('team');
  const [state, setState] = useState<BattleState | null>(null);
  const [myNo, setMyNo] = useState<string | null>(null);
  const [roulette, setRoulette] = useState(0);
  const [gimmick, setGimmick] = useState<GimmickResult | null>(null);
  const [preempt, setPreempt] = useState(false);
  const [effect, setEffect] = useState<Effect | null>(null);
  const [attacking, setAttacking] = useState<'mine' | 'foe' | null>(null);
  const [caught, setCaught] = useState(false);

  const ownedNos = useMemo(() => Object.keys(owned).filter((no) => owned[no] > 0), [owned]);

  const begin = useCallback((team: TagStats[]) => {
    const fresh = createBattle({ bosses, minions, team, rng: randomRng() });
    setState(revealFoe(fresh, randomRng()));
    setStep('select');
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

    let delay = 0;
    for (const side of order) {
      const outcome = outcomes[side];
      if (!outcome) continue;
      const at = delay;
      setTimeout(() => { setAttacking(side); setEffect(null); }, at);
      setTimeout(() => setEffect({
        target: outcome.target, damage: outcome.damage,
        verdict: outcome.verdict, critical: outcome.critical,
      }), at + 420);
      delay = at + 1500;
    }

    setTimeout(() => {
      setAttacking(null);
      setEffect(null);
      setState(result.state);
      nextTurn(result.state);
    }, delay + 300);
  }, [state, myNo, preempt, roulette, gimmick, nextTurn]);

  if (step === 'team' || !state) {
    return <TeamPicker stats={stats} art={art} ownedNos={ownedNos} onStart={begin} />;
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
        <button type="button" onClick={() => { setState(null); setStep('team'); setCaught(false); }}
          className="h-14 w-full rounded-2xl bg-violet-400 text-lg font-black text-ink-950">
          한 판 더!
        </button>
      </div>
    );
  }

  const usable = selectable(state, owned);
  const gimmickKind: GimmickKind | null = myNo ? availableGimmick(state, myNo) : null;

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
      />

      {step === 'select' && (
        <div className="space-y-3">
          <p className="text-sm font-bold text-violet-100">
            상대는 <strong className="text-rose-300">{foe.name}</strong>! 공격할 포켓몬을 밀어 올리자
          </p>
          <div className="grid grid-cols-3 gap-2">
            {state.team.map((member) => {
              const move = moveOf(member.stats.move);
              const multiplier = move ? typeEffectiveness(move.type, foe.types) : 1;
              const verdict: Verdict = multiplier === 0 ? 'none' : multiplier > 1 ? 'great' : multiplier < 1 ? 'weak' : 'normal';
              const faster = member.stats.spe > foe.stats.spe;
              const blocked = !usable.includes(member.no);
              return (
                <button
                  key={member.no}
                  type="button"
                  disabled={blocked}
                  onClick={() => {
                    setMyNo(member.no);
                    setStep(faster ? (availableGimmick(state, member.no) ? 'gimmick' : 'roulette') : 'preempt');
                  }}
                  className={`min-h-[5.5rem] rounded-xl border p-2 text-left ${
                    blocked ? 'border-white/10 bg-white/[0.02] opacity-40' : 'border-violet-300/30 bg-violet-400/10'
                  }`}
                >
                  <p className="truncate text-xs font-bold text-violet-50">{member.name}</p>
                  <p className="mt-1 truncate text-[10px] text-violet-200/70">{member.stats.move}</p>
                  <p className={`mt-1 text-[11px] font-black ${
                    verdict === 'great' ? 'text-amber-300' : verdict === 'weak' ? 'text-sky-300' : 'text-violet-200/60'
                  }`}>{VERDICT_TEXT[verdict]}</p>
                  <p className={`mt-0.5 text-[10px] font-bold ${faster ? 'text-sky-300' : 'text-rose-300'}`}>
                    {faster ? '─ 내가 선공' : '─ 상대가 선공'}
                  </p>
                  {blocked && <p className="mt-0.5 text-[10px] text-amber-200/80">직전 턴 사용</p>}
                </button>
              );
            })}
          </div>
          <p className="text-xs text-violet-200/45">
            직전 턴에 쓴 카드는 못 내요. 같은 태그를 2장 이상 보유하면 연달아 낼 수 있어요.
          </p>
        </div>
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
