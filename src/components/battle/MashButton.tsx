'use client';

import { useEffect, useRef, useState } from 'react';

/** 무지개까지 채우려면 눌러야 하는 횟수. 실물도 몇 초 안에 끝나는 길이다. */
const FULL_TAPS = 18;
const WINDOW_MS = 2600;

const STEPS = [
  { at: 0.0, className: 'bg-white/10 text-violet-100', label: '연타!' },
  { at: 0.25, className: 'bg-sky-400 text-ink-950', label: '더!' },
  { at: 0.5, className: 'bg-violet-400 text-ink-950', label: '더!!' },
  { at: 0.75, className: 'bg-fuchsia-400 text-ink-950', label: '거의!!' },
  { at: 1.0, className: 'bg-gradient-to-r from-rose-400 via-amber-300 to-emerald-300 text-ink-950', label: '최대 위력!' },
];

function stepFor(ratio: number) {
  return [...STEPS].reverse().find((step) => ratio >= step.at) ?? STEPS[0];
}

/**
 * 버튼 연타 — 많이 누를수록 버튼 색이 변하고 위력이 오른다. 무지개면 최대.
 * 제한 시간이 끝나면 그때까지의 강도(0~1)를 넘긴다.
 */
export default function MashButton({
  label,
  onDone,
}: {
  label: string;
  onDone: (strength: number) => void;
}) {
  const [taps, setTaps] = useState(0);
  const tapsRef = useRef(0);
  const [left, setLeft] = useState(WINDOW_MS);

  useEffect(() => {
    const started = Date.now();
    const timer = setInterval(() => {
      const remaining = WINDOW_MS - (Date.now() - started);
      if (remaining <= 0) {
        clearInterval(timer);
        setLeft(0);
        onDone(Math.min(1, tapsRef.current / FULL_TAPS));
        return;
      }
      setLeft(remaining);
    }, 60);
    return () => clearInterval(timer);
    // onDone 은 매 렌더마다 새로 만들어질 수 있다. 타이머를 다시 켜면 시간이 늘어난다.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const ratio = Math.min(1, taps / FULL_TAPS);
  const step = stepFor(ratio);

  return (
    <div className="space-y-3 text-center">
      <p className="text-sm font-bold text-violet-100">{label}</p>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className={`battle-gauge h-full ${step.className}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <button
        type="button"
        onPointerDown={() => {
          tapsRef.current += 1;
          setTaps(tapsRef.current);
        }}
        className={`h-20 w-full rounded-2xl text-xl font-black transition-colors active:scale-[0.99] ${step.className}`}
      >
        {step.label}
      </button>
      <p className="text-xs tabular-nums text-violet-200/55">{(left / 1000).toFixed(1)}초</p>
    </div>
  );
}
