'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import RarityChip from './RarityChip';
import TagPicker from './TagPicker';
import type { TagWithScore } from '@/lib/data';
import { useOwned, useTrade, type Basket, type Side } from '@/lib/store';
import { evaluateTrade, suggestAdditions, sumTp, type TradeEntry, type Verdict } from '@/lib/trade';

const VERDICT_STYLE: Record<Verdict, { bar: string; text: string; ring: string; emoji: string }> = {
  'big-gain': { bar: 'from-emerald-400 to-teal-300', text: 'text-emerald-300', ring: 'ring-emerald-300/40', emoji: '🎉' },
  gain: { bar: 'from-teal-400 to-sky-300', text: 'text-teal-300', ring: 'ring-teal-300/35', emoji: '🙂' },
  fair: { bar: 'from-violet-400 to-fuchsia-400', text: 'text-violet-200', ring: 'ring-violet-300/35', emoji: '⚖️' },
  loss: { bar: 'from-amber-400 to-orange-300', text: 'text-amber-300', ring: 'ring-amber-300/35', emoji: '😐' },
  'big-loss': { bar: 'from-rose-500 to-red-400', text: 'text-rose-300', ring: 'ring-rose-400/40', emoji: '🚨' },
};

const SIDE_META: Record<Side, { title: string; accent: string; border: string }> = {
  mine: { title: '내가 줄 것', accent: 'text-rose-200', border: 'border-rose-300/25' },
  theirs: { title: '내가 받을 것', accent: 'text-sky-200', border: 'border-sky-300/25' },
};

export default function TradeCalculator({ tags }: { tags: TagWithScore[] }) {
  const byNo = useMemo(() => new Map(tags.map((t) => [t.no, t])), [tags]);
  const { trade, add, remove, clear } = useTrade();
  const { owned } = useOwned();
  const [picking, setPicking] = useState<Side | null>(null);

  const toEntries = (basket: Basket): TradeEntry[] => {
    const entries: TradeEntry[] = [];
    for (const [no, qty] of Object.entries(basket)) {
      const tag = byNo.get(no);
      if (tag) entries.push({ tag, score: tag.score, qty });
    }
    return entries.sort((a, b) => b.tag.rarity - a.tag.rarity || b.score.tp - a.score.tp);
  };

  const mine = toEntries(trade.mine);
  const theirs = toEntries(trade.theirs);
  const empty = mine.length === 0 && theirs.length === 0;
  const result = evaluateTrade(mine, theirs);

  // 추천 풀: 이미 이 거래에 올린 것을 뺀 내 보유 태그
  const pool = useMemo(() => {
    const entries: TradeEntry[] = [];
    for (const [no, qty] of Object.entries(owned)) {
      if (trade.mine[no]) continue;
      const tag = byNo.get(no);
      if (tag) entries.push({ tag, score: tag.score, qty });
    }
    return entries;
  }, [owned, trade.mine, byNo]);

  const deficit = Math.max(0, Math.round((result.theirTp - result.myTp) * 10) / 10);
  const suggestion = deficit > 0 ? suggestAdditions(pool, deficit) : [];
  const style = VERDICT_STYLE[result.verdict];

  const total = result.myTp + result.theirTp;
  const minePct = total > 0 ? (result.myTp / total) * 100 : 50;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 md:grid-cols-2">
        <SidePanel side="mine" entries={mine} onAdd={() => setPicking('mine')} onDelta={add} onRemove={remove} />
        <SidePanel side="theirs" entries={theirs} onAdd={() => setPicking('theirs')} onDelta={add} onRemove={remove} />
      </div>

      {empty ? (
        <p className="rounded-2xl border border-dashed border-white/15 px-4 py-10 text-center text-sm leading-relaxed text-violet-200/50">
          양쪽에 태그를 담으면 누가 손해인지 바로 알려줄게요.
          <br />
          <Link href="/dex" className="mt-2 inline-block font-semibold text-violet-200 underline">
            도감에서 골라오기
          </Link>
        </p>
      ) : (
        <section className={`rounded-3xl border border-white/10 bg-white/[0.04] p-5 ring-1 ring-inset ${style.ring}`}>
          <div className="flex items-baseline justify-between gap-3">
            <p className={`text-2xl font-extrabold ${style.text}`}>
              <span className="mr-2">{style.emoji}</span>
              {result.verdictLabel}
            </p>
            <p className="text-right text-xs tabular-nums text-violet-200/50">
              {result.diff >= 0 ? '+' : ''}
              {result.diff} TP
            </p>
          </div>

          <div className="mt-4">
            <div className="flex h-3 overflow-hidden rounded-full bg-white/5">
              <div className="bg-gradient-to-r from-rose-500 to-rose-300 transition-all duration-500" style={{ width: `${minePct}%` }} />
              <div className="flex-1 bg-gradient-to-r from-sky-300 to-sky-500 transition-all duration-500" />
            </div>
            <div className="mt-1.5 flex justify-between text-[11px] font-semibold tabular-nums">
              <span className="text-rose-200/80">내가 줄 것 {result.myTp} TP</span>
              <span className="text-sky-200/80">{result.theirTp} TP 내가 받을 것</span>
            </div>
          </div>

          {result.warnings.length > 0 && (
            <ul className="mt-4 space-y-2">
              {result.warnings.map((w, i) => (
                <li
                  key={i}
                  className={`flex gap-2 rounded-xl px-3 py-2.5 text-[12px] leading-relaxed ${
                    w.kind === 'ladder'
                      ? 'bg-amber-300/10 text-amber-100 ring-1 ring-inset ring-amber-300/25'
                      : 'bg-white/5 text-violet-200/70'
                  }`}
                >
                  <span aria-hidden>{w.kind === 'ladder' ? '⚠️' : w.kind === 'padding' ? '📚' : 'ℹ️'}</span>
                  <span>{w.message}</span>
                </li>
              ))}
            </ul>
          )}

          {deficit > 0 && (
            <div className="mt-4 border-t border-white/10 pt-4">
              <p className="text-xs font-bold text-violet-200/70">
                {deficit} TP 모자라요 — 내 보유 태그에서 이렇게 채우면 맞아요
              </p>
              {pool.length === 0 ? (
                <p className="mt-2 text-[12px] leading-relaxed text-violet-200/50">
                  아직 보유 태그를 표시하지 않았어요. 도감에서 가진 태그를 ☆ 표시해두면 여기서 조합을 추천해줄게요.
                </p>
              ) : suggestion.length === 0 ? (
                <p className="mt-2 text-[12px] text-violet-200/50">보유 태그로는 채울 조합을 못 찾았어요.</p>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {suggestion.map((s) => (
                    <button
                      key={s.tag.no}
                      type="button"
                      onClick={() => add('mine', s.tag.no, s.qty)}
                      className="flex items-center gap-1.5 rounded-full border border-emerald-300/30 bg-emerald-400/10 px-3 py-1.5 text-[11px] font-bold text-emerald-100 transition hover:bg-emerald-400/20"
                    >
                      + {s.tag.name}
                      {s.qty > 1 && <span className="tabular-nums">×{s.qty}</span>}
                      <span className="text-emerald-200/60">{s.score.tp} TP</span>
                    </button>
                  ))}
                  <span className="self-center text-[11px] tabular-nums text-violet-200/45">
                    합계 {sumTp(suggestion)} TP
                  </span>
                </div>
              )}
            </div>
          )}

          <button
            type="button"
            onClick={clear}
            className="mt-4 text-[11px] font-semibold text-violet-200/40 underline hover:text-violet-200/70"
          >
            전부 비우기
          </button>
        </section>
      )}

      {picking && (
        <TagPicker
          tags={tags}
          title={SIDE_META[picking].title}
          onPick={(no) => { add(picking, no); setPicking(null); }}
          onClose={() => setPicking(null)}
        />
      )}
    </div>
  );
}

function SidePanel({
  side, entries, onAdd, onDelta, onRemove,
}: {
  side: Side;
  entries: TradeEntry[];
  onAdd: () => void;
  onDelta: (side: Side, no: string, delta: number) => void;
  onRemove: (side: Side, no: string) => void;
}) {
  const meta = SIDE_META[side];
  return (
    <section className={`rounded-2xl border ${meta.border} bg-white/[0.03] p-3`}>
      <div className="mb-2 flex items-center justify-between">
        <h2 className={`text-sm font-extrabold ${meta.accent}`}>{meta.title}</h2>
        <span className="text-xs tabular-nums text-violet-200/45">{sumTp(entries)} TP</span>
      </div>

      <ul className="space-y-1.5">
        {entries.map((e) => (
          <li key={e.tag.no} className="flex items-center gap-2 rounded-xl bg-black/25 p-1.5">
            <span className="relative h-9 w-16 shrink-0 overflow-hidden rounded-md bg-black/40">
              <Image src={e.tag.images.thumb} alt="" fill sizes="64px" className="object-contain" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="flex items-center gap-1.5">
                <RarityChip rarity={e.tag.rarity} />
                <span className="truncate text-xs font-bold text-white">{e.tag.name}</span>
              </span>
              <span className="text-[10px] tabular-nums text-violet-200/45">
                {e.score.tp} TP{e.score.confidence === 'estimated' && ' · 추정'}
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-0.5">
              <Step label="빼기" onClick={() => onDelta(side, e.tag.no, -1)}>−</Step>
              <span className="w-5 text-center text-xs font-bold tabular-nums">{e.qty}</span>
              <Step label="더하기" onClick={() => onDelta(side, e.tag.no, 1)}>+</Step>
              <button
                type="button"
                aria-label="빼기"
                onClick={() => onRemove(side, e.tag.no)}
                className="ml-0.5 rounded px-1 text-[11px] text-violet-200/35 hover:text-rose-300"
              >
                ✕
              </button>
            </span>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={onAdd}
        className="mt-2 w-full rounded-xl border border-dashed border-white/15 py-2.5 text-xs font-bold text-violet-200/60 transition hover:border-violet-300/40 hover:text-violet-100"
      >
        + 태그 추가
      </button>
    </section>
  );
}

function Step({ children, onClick, label }: { children: React.ReactNode; onClick: () => void; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid h-6 w-6 place-items-center rounded-md bg-white/10 text-sm font-bold text-violet-100 transition hover:bg-white/20 active:scale-90"
    >
      {children}
    </button>
  );
}
