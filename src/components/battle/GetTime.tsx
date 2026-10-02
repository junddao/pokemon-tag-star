'use client';

import Image from 'next/image';
import { useState } from 'react';
import { BALL_WHEEL, captureChance, throwBall } from '@/lib/battle/capture';
import type { BallKind, Fighter } from '@/lib/battle/types';
import { randomRng } from '@/lib/battle/rng';
import type { Art } from './BattleStage';

const BALL_COLOR: Record<BallKind, string> = {
  몬스터볼: 'from-rose-500 to-rose-300',
  슈퍼볼: 'from-sky-500 to-sky-300',
  하이퍼볼: 'from-amber-500 to-amber-300',
};

type Stage = 'wheel' | 'throwing' | 'result';

/**
 * 겟 타임 — 3턴이 끝나거나 보스를 쓰러뜨리면 열린다.
 *
 * 볼 룰렛으로 볼이 정해지고, 던져서 잡으면 태그가 된다. 실물은 여기서 1,500원을
 * 더 넣어야 태그가 나오지만, 여기서는 잡은 포켓몬을 그대로 보유 목록에 넣는다.
 */
export default function GetTime({
  target, art, onDone,
}: {
  target: Fighter;
  art: Art;
  onDone: (caught: boolean) => void;
}) {
  const [stage, setStage] = useState<Stage>('wheel');
  const [slot, setSlot] = useState(0);
  const [ball, setBall] = useState<BallKind>('몬스터볼');
  const [caught, setCaught] = useState(false);

  const chance = captureChance(target, BALL_WHEEL[slot]);

  const start = () => {
    const chosen = BALL_WHEEL[slot];
    setBall(chosen);
    setStage('throwing');
    const result = throwBall(target, chosen, randomRng());
    setCaught(result);
    // 던지는 연출(0.7초) + 흔들림 3회(0.52초×3) 가 끝난 뒤에 결과를 보여준다.
    setTimeout(() => setStage('result'), 2200);
  };

  return (
    <div className="space-y-5 text-center">
      <header>
        <p className="text-xl font-black text-amber-200">겟 타임!</p>
        <p className="mt-1 text-xs text-violet-200/60">
          {target.hp <= 0 ? `${target.name}을(를) 쓰러뜨렸다! 볼을 던지자` : `${target.name}에게 볼을 던지자`}
        </p>
      </header>

      <div className="relative mx-auto h-40 w-full max-w-xs">
        <div className={`relative mx-auto aspect-[300/169] w-56 ${stage === 'result' && !caught ? 'battle-shake' : ''}`}>
          <Image src={art[target.no] ?? ''} alt={target.name} fill sizes="224px" className="rounded-xl object-cover" />
        </div>
        {stage !== 'wheel' && (
          <div className="pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2">
            <div className="battle-ball-throw">
              <div className={`battle-ball-wobble h-10 w-10 rounded-full bg-gradient-to-b ${BALL_COLOR[ball]} ring-2 ring-white/70`} />
            </div>
          </div>
        )}
      </div>

      {stage === 'wheel' && (
        <>
          <p className="text-sm font-bold text-violet-100">볼 룰렛 — 좋은 볼에서 멈춰라</p>
          <div className="flex items-center justify-center gap-2">
            {BALL_WHEEL.map((kind, index) => (
              <span key={index}
                className={`h-10 w-10 rounded-full bg-gradient-to-b ${BALL_COLOR[kind]} ${
                  index === slot ? 'ring-2 ring-white' : 'opacity-35'
                }`}
              />
            ))}
          </div>
          <p className="text-xs tabular-nums text-violet-200/55">
            {BALL_WHEEL[slot]} · 포획 확률 약 {Math.round(chance * 100)}%
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSlot((s) => (s + 1) % BALL_WHEEL.length)}
              className="h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 text-base font-bold text-violet-100">돌려</button>
            <button type="button" onClick={start}
              className="h-14 flex-1 rounded-2xl bg-amber-400 text-base font-black text-ink-950">던진다!</button>
          </div>
        </>
      )}

      {stage === 'throwing' && <p className="text-sm font-bold text-violet-100">두근두근...</p>}

      {stage === 'result' && (
        <>
          <p className={`text-lg font-black ${caught ? 'text-emerald-300' : 'text-rose-300'}`}>
            {caught ? `${target.name}을(를) 잡았다!` : `아깝다! ${target.name}이(가) 튀어나왔다`}
          </p>
          <button type="button" onClick={() => onDone(caught)}
            className="h-14 w-full rounded-2xl bg-violet-400 text-base font-black text-ink-950">결과 보기</button>
        </>
      )}
    </div>
  );
}
