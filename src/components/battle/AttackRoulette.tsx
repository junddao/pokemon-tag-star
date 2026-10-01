'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * 공격 룰렛 — 돌아가는 숫자를 버튼으로 멈춘다. 높을수록 공격력이 오른다.
 *
 * 휠 구성은 태그마다 다르다(에너지로 추정). 칸을 일정 속도로 돌리고, 누른 순간의
 * 칸을 그대로 채택한다. 실물도 멈춘 칸이 곧 보너스다.
 */
export default function AttackRoulette({
  wheel,
  onStop,
}: {
  wheel: number[];
  onStop: (value: number) => void;
}) {
  const [index, setIndex] = useState(0);
  const stopped = useRef(false);

  useEffect(() => {
    const timer = setInterval(() => {
      if (!stopped.current) setIndex((current) => (current + 1) % wheel.length);
    }, 110);
    return () => clearInterval(timer);
  }, [wheel.length]);

  const stop = () => {
    if (stopped.current) return;
    stopped.current = true;
    onStop(wheel[index]);
  };

  return (
    <div className="space-y-4 text-center">
      <p className="text-sm font-bold text-violet-100">공격 룰렛! 높은 숫자에서 멈춰라</p>
      <div className="flex items-center justify-center gap-2">
        {wheel.map((value, slot) => (
          <span
            key={value}
            className={`flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-black tabular-nums ${
              slot === index
                ? 'border-amber-300 bg-amber-300 text-ink-950 shadow-[0_0_24px_-2px_rgba(252,211,77,0.9)]'
                : 'border-white/15 bg-white/5 text-violet-200/50'
            }`}
          >
            {value}
          </span>
        ))}
      </div>
      <button
        type="button"
        onClick={stop}
        className="h-14 w-full rounded-2xl bg-amber-400 text-lg font-black text-ink-950 active:scale-[0.98]"
      >
        멈춰!
      </button>
    </div>
  );
}
