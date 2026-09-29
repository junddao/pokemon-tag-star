'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import type { TagWithScore } from '@/lib/data';
import { recommendAgainstBoss, topThree, type Recommendation } from '@/lib/boss-recommendations';
import { SPECIES_TYPES } from '@/lib/pokemon-types';
import { useOwned } from '@/lib/store';

export default function BossRecommender({ tags }: { tags: TagWithScore[] }) {
  const bosses = useMemo(() => {
    const seen = new Set<string>();
    return tags.filter((tag) => {
      if (tag.rarity < 5 || seen.has(tag.name) || !SPECIES_TYPES[tag.name]) return false;
      seen.add(tag.name);
      return true;
    });
  }, [tags]);
  const [bossName, setBossName] = useState(bosses[0]?.name ?? '');
  const { owned } = useOwned();
  const recommendations = useMemo(() => recommendAgainstBoss(tags, bossName, owned), [tags, bossName, owned]);
  const top = useMemo(() => topThree(recommendations), [recommendations]);
  const bossTypes = SPECIES_TYPES[bossName] ?? [];
  const ownedCount = top.filter((item) => item.owned).length;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">보스 상대 3마리 추천</h1>
        <p className="mt-2 text-sm text-violet-200/60">상대할 ★5·★6 포켓몬을 고르면, 타입 상성이 좋은 내 태그를 먼저 보여줘요.</p>
      </header>

      <section className="rounded-2xl border border-violet-300/20 bg-violet-400/[0.07] p-5">
        <label htmlFor="boss-pokemon" className="block text-sm font-bold text-violet-100">상대할 보스</label>
        <select
          id="boss-pokemon"
          value={bossName}
          onChange={(event) => setBossName(event.target.value)}
          className="mt-3 w-full rounded-xl border border-white/15 bg-[#181326] px-3 py-3 text-base text-white outline-none focus:border-violet-300 sm:max-w-sm"
        >
          {bosses.map((boss) => <option key={boss.name} value={boss.name}>{boss.name} · {boss.rarityLabel}</option>)}
        </select>
        <p className="mt-3 text-xs text-violet-200/65">{bossName} 타입: <strong className="text-violet-100">{bossTypes.join(' / ')}</strong></p>
      </section>

      <section>
        <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="text-lg font-bold">추천 3마리</h2>
          <span className="text-xs text-violet-200/55">내 보유 태그 {ownedCount}마리</span>
        </div>
        {top.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-3">
            {top.map((item, index) => <RecommendationCard key={item.tag.no} item={item} rank={index + 1} />)}
          </div>
        ) : <p className="rounded-2xl border border-white/10 p-6 text-sm text-violet-200/60">추천 가능한 태그가 없어요.</p>}
        <p className="mt-3 text-xs leading-relaxed text-violet-200/50">
          내 보유 태그를 먼저 추천하고, 부족한 자리는 다른 태그로 채워요. 타입 상성만 계산했으며 태그의 기술 타입·전투력은 반영하지 않았어요.
        </p>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold">상성 좋은 태그 전체 <span className="text-sm font-normal text-violet-200/50">{recommendations.length}개</span></h2>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((item) => <RecommendationRow key={item.tag.no} item={item} />)}
        </div>
        <p className="mt-4 text-xs text-violet-200/50">보유 태그는 도감의 상세 화면에서 ☆ 버튼으로 등록할 수 있어요.</p>
      </section>
    </div>
  );
}

function RecommendationCard({ item, rank }: { item: Recommendation; rank: number }) {
  return (
    <Link href={`/dex/${encodeURIComponent(item.tag.no)}`} className="overflow-hidden rounded-2xl border border-violet-300/20 bg-white/[0.05] transition hover:border-violet-300/50 hover:bg-white/[0.08]">
      <div className="relative aspect-[300/169] bg-black/25">
        <Image src={item.tag.images.thumb} alt={item.tag.name} fill sizes="(max-width: 640px) 100vw, 33vw" className="object-contain p-3" />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-bold text-amber-200">#{rank} 추천</span>
          {item.owned && <span className="rounded-full bg-emerald-300/15 px-2 py-0.5 text-[11px] font-bold text-emerald-200">★ 보유 중</span>}
        </div>
        <p className="font-bold">{item.tag.name} <span className="font-mono text-xs font-normal text-violet-200/50">{item.tag.no}</span></p>
        <p className="text-xs text-violet-200/70">{item.attackType} 타입 · 상성 {item.multiplier}배</p>
      </div>
    </Link>
  );
}

function RecommendationRow({ item }: { item: Recommendation }) {
  return (
    <Link href={`/dex/${encodeURIComponent(item.tag.no)}`} className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-2 transition hover:bg-white/[0.08]">
      <div className="relative h-14 w-20 shrink-0">
        <Image src={item.tag.images.thumb} alt="" fill sizes="80px" className="object-contain" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{item.tag.name} <span className="font-mono text-[10px] font-normal text-violet-200/45">{item.tag.no}</span></p>
        <p className="text-xs text-violet-200/60">{item.attackType} · 상성 {item.multiplier}배</p>
      </div>
      {item.owned && <span className="shrink-0 text-xs font-bold text-emerald-200">★ 보유</span>}
    </Link>
  );
}
