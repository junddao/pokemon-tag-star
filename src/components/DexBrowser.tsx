'use client';

import { useMemo, useState } from 'react';
import TagCard from './TagCard';
import type { TagWithScore } from '@/lib/data';
import { RARITY_ORDER, RARITY_THEME } from '@/lib/theme';
import type { Rarity } from '@/lib/types';

type Sort = 'rarity' | 'price-desc' | 'price-asc' | 'no';

const SORTS: { key: Sort; label: string }[] = [
  { key: 'rarity', label: '등급순' },
  { key: 'price-desc', label: '비싼순' },
  { key: 'price-asc', label: '싼순' },
  { key: 'no', label: '번호순' },
];

export default function DexBrowser({ tags, stages }: { tags: TagWithScore[]; stages: number[] }) {
  const [stage, setStage] = useState<number | 'all'>('all');
  const [rarities, setRarities] = useState<Set<Rarity>>(new Set());
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<Sort>('rarity');

  const toggleRarity = (r: Rarity) =>
    setRarities((prev) => {
      const next = new Set(prev);
      if (next.has(r)) next.delete(r);
      else next.add(r);
      return next;
    });

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = tags.filter((t) => {
      if (stage !== 'all' && t.stage !== stage) return false;
      if (rarities.size > 0 && !rarities.has(t.rarity)) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.no.toLowerCase().includes(q)) return false;
      return true;
    });

    const byRarity = (a: TagWithScore, b: TagWithScore) =>
      b.rarity - a.rarity || b.score.tp - a.score.tp || a.no.localeCompare(b.no);

    return filtered.sort((a, b) => {
      if (sort === 'price-desc') return b.score.tp - a.score.tp || byRarity(a, b);
      if (sort === 'price-asc') return a.score.tp - b.score.tp || byRarity(a, b);
      if (sort === 'no') return a.no.localeCompare(b.no);
      return byRarity(a, b);
    });
  }, [tags, stage, rarities, query, sort]);

  return (
    <div>
      <div className="sticky top-14 z-40 -mx-4 mb-5 space-y-3 border-b border-white/10 bg-[#07060f]/85 px-4 py-3 backdrop-blur-xl sm:top-16">
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            options={[{ key: 'all' as const, label: '전체' }, ...stages.map((s) => ({ key: s, label: `${s}탄` }))]}
            value={stage}
            onChange={setStage}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="포켓몬 이름 또는 번호"
            className="ml-auto w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder:text-violet-200/35 outline-none focus:border-violet-300/50 sm:w-56"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          {RARITY_ORDER.map((r) => {
            const on = rarities.has(r);
            return (
              <button
                key={r}
                type="button"
                onClick={() => toggleRarity(r)}
                className={`rounded-full border px-2.5 py-1 text-[11px] font-bold transition ${
                  on ? RARITY_THEME[r].chip : 'border-white/10 bg-white/[0.03] text-violet-200/50 hover:text-violet-100'
                }`}
              >
                {RARITY_THEME[r].label}
              </button>
            );
          })}
          <span className="mx-1 h-4 w-px bg-white/10" />
          <Segmented options={SORTS.map((s) => ({ key: s.key, label: s.label }))} value={sort} onChange={setSort} small />
          <span className="ml-auto text-xs tabular-nums text-violet-200/45">{visible.length}개</span>
        </div>
      </div>

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-violet-200/50">조건에 맞는 태그가 없어요.</p>
      ) : (
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {visible.map((tag) => (
            <TagCard key={tag.no} tag={tag} />
          ))}
        </div>
      )}
    </div>
  );
}

function Segmented<T extends string | number>({
  options, value, onChange, small,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  small?: boolean;
}) {
  return (
    <div className="inline-flex shrink-0 rounded-xl border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => (
        <button
          key={String(o.key)}
          type="button"
          onClick={() => onChange(o.key)}
          className={`rounded-[10px] font-semibold transition ${small ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'} ${
            value === o.key ? 'bg-violet-400/25 text-white' : 'text-violet-200/55 hover:text-violet-100'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
