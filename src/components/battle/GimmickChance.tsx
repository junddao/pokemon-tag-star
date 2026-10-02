'use client';

import { useState } from 'react';
import MashButton from './MashButton';
import type { GimmickKind } from '@/lib/battle/types';

export interface GimmickResult {
  used: boolean;
  level?: number;
}

/**
 * 다이맥스 · Z기술 찬스.
 *
 * 둘 다 「첫 번째 공격을 진행할 때」 뜨고 배틀당 한 번만 쓸 수 있다.
 * 다이맥스는 연타로 레벨을 올린 뒤 룰렛이 X 에 멈추면 실패하고, 다이맥스 밴드가
 * 있으면 X 가 아예 나오지 않아 반드시 성공한다. Z기술은 룰렛이 없고 좌우 버튼을
 * 번갈아 눌러 Z파워를 모은다.
 */
export default function GimmickChance({
  kind,
  moveName,
  onResolve,
}: {
  kind: GimmickKind;
  moveName: string;
  onResolve: (result: GimmickResult) => void;
}) {
  if (kind === 'z') return <ZChance moveName={moveName} onResolve={onResolve} />;
  return <DynamaxChance moveName={moveName} onResolve={onResolve} />;
}

function Frame({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="space-y-4 rounded-2xl border border-fuchsia-300/30 bg-fuchsia-500/10 p-5">
      <div className="text-center">
        <p className="text-lg font-black text-fuchsia-200">{title}</p>
        <p className="mt-1 text-xs text-fuchsia-100/70">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function DynamaxChance({ moveName, onResolve }: { moveName: string; onResolve: (r: GimmickResult) => void }) {
  const [band, setBand] = useState<boolean | null>(null);
  const [level, setLevel] = useState<number | null>(null);
  const [slot, setSlot] = useState(0);

  if (band === null) {
    return (
      <Frame title="다이맥스 찬스!" subtitle="다이맥스 밴드를 가지고 있어?">
        <div className="flex gap-2">
          <button type="button" onClick={() => setBand(true)}
            className="h-14 flex-1 rounded-2xl bg-fuchsia-400 text-base font-black text-ink-950">있어</button>
          <button type="button" onClick={() => setBand(false)}
            className="h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 text-base font-bold text-violet-100">없어</button>
        </div>
        <button type="button" onClick={() => onResolve({ used: false })}
          className="h-11 w-full rounded-xl text-sm font-bold text-violet-200/60">그냥 평타로 간다</button>
      </Frame>
    );
  }

  if (level === null) {
    return (
      <Frame title="힘을 모아라!" subtitle="많이 누를수록 다이맥스 레벨이 오른다">
        <MashButton
          label="버튼 연타!"
          onDone={(strength) => setLevel(strength >= 0.7 ? 10 : strength >= 0.35 ? 5 : 1)}
        />
      </Frame>
    );
  }

  // 밴드가 있으면 모든 칸이 다이맥스 마크라 실패 칸이 없다.
  const slots = band ? ['◆', '◆', '◆', '◆'] : ['◆', '✕', '◆', '✕'];

  return (
    <Frame title="다이맥스 룰렛" subtitle={band ? '밴드 효과로 X 가 없다 — 반드시 성공!' : 'X 에 멈추면 실패'}>
      <div className="flex items-center justify-center gap-2">
        {slots.map((mark, index) => (
          <span key={index}
            className={`flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-2xl font-black ${
              index === slot ? 'border-fuchsia-300 bg-fuchsia-300 text-ink-950' : 'border-white/15 bg-white/5 text-violet-200/40'
            }`}
          >{mark}</span>
        ))}
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => setSlot((s) => (s + 1) % slots.length)}
          className="h-14 flex-1 rounded-2xl border border-white/20 bg-white/5 text-base font-bold text-violet-100">돌려</button>
        <button type="button"
          onClick={() => onResolve(slots[slot] === '◆' ? { used: true, level } : { used: false })}
          className="h-14 flex-1 rounded-2xl bg-fuchsia-400 text-base font-black text-ink-950">여기서 멈춰!</button>
      </div>
      <p className="text-center text-xs text-fuchsia-100/60">성공하면 «{moveName}» 발동</p>
    </Frame>
  );
}

function ZChance({ moveName, onResolve }: { moveName: string; onResolve: (r: GimmickResult) => void }) {
  const NEEDED = 8;
  const [power, setPower] = useState(0);
  const [side, setSide] = useState<'left' | 'right'>('left');

  const press = (pressed: 'left' | 'right') => {
    // 번갈아 눌러야 Z파워가 찬다. 한쪽만 두드리면 늘지 않는다.
    if (pressed !== side) return;
    const next = power + 1;
    setSide(pressed === 'left' ? 'right' : 'left');
    if (next >= NEEDED) {
      onResolve({ used: true });
      return;
    }
    setPower(next);
  };

  return (
    <Frame title="Z기술 찬스!" subtitle={`빛나는 버튼을 번갈아 눌러 Z파워를 모아라 — «${moveName}»`}>
      <div className="h-3 w-full overflow-hidden rounded-full bg-white/10">
        <div className="battle-gauge h-full bg-gradient-to-r from-sky-400 to-amber-300"
          style={{ width: `${(power / NEEDED) * 100}%` }} />
      </div>
      <div className="flex gap-3">
        {(['left', 'right'] as const).map((which) => (
          <button key={which} type="button" onPointerDown={() => press(which)}
            className={`h-20 flex-1 rounded-2xl text-lg font-black ${
              side === which
                ? which === 'left' ? 'bg-sky-400 text-ink-950' : 'bg-amber-400 text-ink-950'
                : 'border border-white/15 bg-white/5 text-violet-200/40'
            }`}
          >{which === 'left' ? '◀' : '▶'}</button>
        ))}
      </div>
      <button type="button" onClick={() => onResolve({ used: false })}
        className="h-11 w-full rounded-xl text-sm font-bold text-violet-200/60">그냥 평타로 간다</button>
    </Frame>
  );
}
