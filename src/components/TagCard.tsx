import Image from 'next/image';
import Link from 'next/link';
import RarityChip from './RarityChip';
import type { TagWithScore } from '@/lib/data';
import { RARITY_THEME } from '@/lib/theme';

export default function TagCard({ tag }: { tag: TagWithScore }) {
  const theme = RARITY_THEME[tag.rarity];
  const price = tag.score.priceKrw;

  return (
    <Link
      href={`/dex/${encodeURIComponent(tag.no)}`}
      className={`group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] ring-1 ring-inset ${theme.ring} transition hover:-translate-y-0.5 hover:bg-white/[0.08] ${theme.glow}`}
    >
      <div className="relative w-full bg-black/30" style={{ aspectRatio: '300 / 169' }}>
        <div className="absolute inset-[7%]">
          <Image
            src={tag.images.thumb}
            alt={tag.name}
            fill
            sizes="(max-width: 640px) 45vw, 200px"
            className="object-contain transition duration-300 group-hover:scale-[1.04]"
          />
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2.5">
        <div className="flex items-center justify-between gap-1">
          <RarityChip rarity={tag.rarity} />
          <span className="font-mono text-[10px] text-violet-200/45">{tag.no}</span>
        </div>
        <p className="truncate text-sm font-bold text-white">{tag.name}</p>
        <p className="mt-auto text-[11px] tabular-nums">
          {price != null ? (
            <span className="font-semibold text-emerald-300">{price.toLocaleString('ko-KR')}원</span>
          ) : (
            <span className="text-violet-200/40">시세 없음</span>
          )}
          <span className="ml-1.5 text-violet-200/40">{tag.score.tp} TP</span>
        </p>
      </div>
    </Link>
  );
}
