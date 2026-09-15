'use client';

import Image from 'next/image';
import { useEffect, useMemo, useRef, useState } from 'react';
import RarityChip from './RarityChip';
import type { TagWithScore } from '@/lib/data';

export default function TagPicker({
  tags, title, onPick, onClose,
}: {
  tags: TagWithScore[];
  title: string;
  onPick: (no: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // 바텀시트가 열리자마자 키보드가 올라오면 목록 절반이 가려진다.
    // 물리 키보드로 바로 타이핑할 수 있는 환경에서만 포커스한다.
    if (window.matchMedia('(pointer: fine)').matches) inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const matched = q
      ? tags.filter((t) => t.name.toLowerCase().includes(q) || t.no.toLowerCase().includes(q))
      : tags;
    return matched
      .slice()
      .sort((a, b) => b.rarity - a.rarity || b.score.tp - a.score.tp)
      .slice(0, 60);
  }, [tags, query]);

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-[85dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-white/15 bg-[#0c0a1a] sm:rounded-3xl"
      >
        <div className="flex items-center gap-2 border-b border-white/10 p-3">
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="포켓몬 이름 또는 번호"
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-base text-white sm:text-sm placeholder:text-violet-200/35 outline-none focus:border-violet-300/50"
          />
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-xl px-3 py-2.5 text-sm font-semibold text-violet-200/60 hover:text-white"
          >
            닫기
          </button>
        </div>

        <ul className="min-h-0 flex-1 divide-y divide-white/5 overflow-y-auto overscroll-contain">
          {results.map((t) => (
            <li key={t.no}>
              <button
                type="button"
                onClick={() => onPick(t.no)}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition hover:bg-white/5 active:bg-white/10"
              >
                <span className="relative h-10 w-[71px] shrink-0 overflow-hidden rounded-md bg-black/40">
                  <Image src={t.images.thumb} alt="" fill sizes="71px" className="object-contain" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <RarityChip rarity={t.rarity} />
                    <span className="truncate text-sm font-bold text-white">{t.name}</span>
                  </span>
                  <span className="mt-0.5 block font-mono text-[10px] text-violet-200/40">{t.no}</span>
                </span>
                <span className="shrink-0 text-right text-xs tabular-nums">
                  <span className="block font-bold text-violet-100">{t.score.tp} TP</span>
                  <span className="block text-[10px] text-violet-200/40">
                    {t.score.priceKrw != null ? `${t.score.priceKrw.toLocaleString('ko-KR')}원` : '추정'}
                  </span>
                </span>
              </button>
            </li>
          ))}
          {results.length === 0 && (
            <li className="px-4 py-10 text-center text-sm text-violet-200/50">검색 결과가 없어요.</li>
          )}
        </ul>
      </div>
    </div>
  );
}
