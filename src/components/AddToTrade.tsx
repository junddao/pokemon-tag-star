'use client';

import Link from 'next/link';
import { basketCount, useOwned, useTrade } from '@/lib/store';

export default function AddToTrade({ no, name }: { no: string; name: string }) {
  const { trade, add } = useTrade();
  const { owned, toggle } = useOwned();

  const mine = trade.mine[no] ?? 0;
  const theirs = trade.theirs[no] ?? 0;
  const total = basketCount(trade.mine) + basketCount(trade.theirs);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => add('mine', no)}
          className="rounded-xl border border-rose-300/30 bg-rose-400/10 px-3 py-2.5 text-xs font-bold text-rose-100 transition hover:bg-rose-400/20 active:scale-95"
        >
          내가 줄 것에 담기{mine > 0 && <span className="ml-1 tabular-nums">({mine})</span>}
        </button>
        <button
          type="button"
          onClick={() => add('theirs', no)}
          className="rounded-xl border border-sky-300/30 bg-sky-400/10 px-3 py-2.5 text-xs font-bold text-sky-100 transition hover:bg-sky-400/20 active:scale-95"
        >
          내가 받을 것에 담기{theirs > 0 && <span className="ml-1 tabular-nums">({theirs})</span>}
        </button>
      </div>

      <button
        type="button"
        onClick={() => toggle(no)}
        aria-pressed={Boolean(owned[no])}
        className={`w-full rounded-xl border px-3 py-2 text-xs font-bold transition ${
          owned[no]
            ? 'border-amber-300/40 bg-amber-300/15 text-amber-100'
            : 'border-white/10 bg-white/[0.03] text-violet-200/60 hover:text-violet-100'
        }`}
      >
        {owned[no] ? `★ ${name} 보유 중` : '☆ 내 보유 태그로 표시'}
      </button>

      {total > 0 && (
        <Link
          href="/trade"
          className="block rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-3 py-2.5 text-center text-xs font-extrabold text-white shadow-lg transition hover:brightness-110"
        >
          트레이드 계산기로 ({total}장)
        </Link>
      )}
    </div>
  );
}
