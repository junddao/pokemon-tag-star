'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import type { TagStats } from '@/lib/battle/types';
import type { Art } from './BattleStage';

/**
 * 레인에 태그 3장을 세팅하는 화면.
 *
 * 실물은 «내가 가진 태그»만 올릴 수 있다. 그래서 보유 등록한 태그를 먼저 보여주되,
 * 3장이 안 되면 게임 자체를 시작할 수 없으므로 전체 태그도 고를 수 있게 둔다.
 */
export default function TeamPicker({
  stats, art, ownedNos, onStart,
}: {
  stats: TagStats[];
  art: Art;
  ownedNos: string[];
  onStart: (team: TagStats[]) => void;
}) {
  const hasOwned = ownedNos.length >= 3;
  const [onlyOwned, setOnlyOwned] = useState(hasOwned);
  const [picked, setPicked] = useState<string[]>([]);

  const owned = useMemo(() => new Set(ownedNos), [ownedNos]);
  const pool = useMemo(
    () => (onlyOwned ? stats.filter((s) => owned.has(s.no)) : stats),
    [stats, onlyOwned, owned],
  );

  const toggle = (no: string) => {
    setPicked((current) => current.includes(no)
      ? current.filter((item) => item !== no)
      : current.length >= 3 ? current : [...current, no]);
  };

  const team = picked.map((no) => stats.find((s) => s.no === no)!).filter(Boolean);

  return (
    <div className="space-y-5">
      <header>
        <h2 className="text-lg font-black">레인에 태그를 세팅하자</h2>
        <p className="mt-1 text-xs text-violet-200/60">
          3장을 고르면 배틀이 시작돼요. 같은 태그를 2장 이상 가지고 있으면 연달아 낼 수 있어요.
        </p>
      </header>

      {hasOwned && (
        <div className="flex gap-2">
          {[
            { key: true, label: `내 보유 ${ownedNos.length}장` },
            { key: false, label: '전체 태그' },
          ].map((option) => (
            <button
              key={String(option.key)}
              type="button"
              onClick={() => { setOnlyOwned(option.key); setPicked([]); }}
              className={`h-11 flex-1 rounded-xl text-sm font-bold ${
                onlyOwned === option.key ? 'bg-violet-400 text-ink-950' : 'border border-white/15 bg-white/5 text-violet-100'
              }`}
            >{option.label}</button>
          ))}
        </div>
      )}

      {!hasOwned && (
        <p className="rounded-xl border border-amber-300/25 bg-amber-300/10 p-3 text-xs text-amber-100">
          보유 등록한 태그가 3장이 안 돼요. 도감 상세에서 ☆ 로 등록하면 내 태그로 플레이할 수 있어요.
        </p>
      )}

      <div className="flex gap-2">
        {[0, 1, 2].map((slot) => {
          const member = team[slot];
          return (
            <div key={slot} className="flex-1 rounded-xl border border-dashed border-white/20 bg-white/[0.03] p-1.5">
              {member ? (
                <>
                  <div className="relative aspect-[300/169] w-full">
                    <Image src={art[member.no] ?? ''} alt={member.name} fill sizes="33vw" className="rounded-lg object-cover" />
                  </div>
                  <p className="mt-1 truncate text-center text-[11px] font-bold">{member.name}</p>
                </>
              ) : (
                <div className="flex aspect-[300/169] items-center justify-center text-xs text-violet-200/35">빈 칸</div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        disabled={team.length < 3}
        onClick={() => onStart(team)}
        className="h-14 w-full rounded-2xl bg-emerald-400 text-lg font-black text-ink-950 disabled:bg-white/10 disabled:text-violet-200/40"
      >
        {team.length < 3 ? `${3 - team.length}장 더 골라줘` : '포켓몬을 꺼낸다!'}
      </button>

      <div className="grid max-h-[22rem] grid-cols-3 gap-2 overflow-y-auto rounded-2xl border border-white/10 p-2 sm:grid-cols-4">
        {pool.map((tag) => {
          const on = picked.includes(tag.no);
          return (
            <button
              key={tag.no}
              type="button"
              onClick={() => toggle(tag.no)}
              className={`rounded-xl border p-1 text-left ${on ? 'border-emerald-300 bg-emerald-300/15' : 'border-white/10 bg-white/[0.03]'}`}
            >
              <div className="relative aspect-[300/169] w-full">
                <Image src={art[tag.no] ?? ''} alt={tag.name} fill sizes="25vw" className="rounded-lg object-cover" />
              </div>
              <p className="mt-1 truncate text-[10px] font-bold text-violet-100">{tag.name}</p>
              <p className="truncate text-[9px] tabular-nums text-violet-200/50">스피드 {tag.spe}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
