import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import PrismTag from '@/components/PrismTag';
import RarityChip from '@/components/RarityChip';
import TagCard from '@/components/TagCard';
import AddToTrade from '@/components/AddToTrade';
import TrackTagView from '@/components/TrackTagView';
import { formatKrw, getPrices, getTagsWithScores } from '@/lib/data';
import { RARITY_THEME } from '@/lib/theme';

export function generateStaticParams() {
  return getTagsWithScores().map((t) => ({ no: t.no }));
}

function find(no: string) {
  return getTagsWithScores().find((t) => t.no === decodeURIComponent(no));
}

export async function generateMetadata({ params }: { params: Promise<{ no: string }> }): Promise<Metadata> {
  const { no } = await params;
  const tag = find(no);
  if (!tag) return {};

  const price = tag.score.priceKrw;
  const priceText = price != null ? `중고 시세 약 ${price.toLocaleString('ko-KR')}원` : '시세 정보 수집 중';

  return {
    title: `${tag.name} ${tag.rarityLabel} — ${priceText}`,
    description: `포켓몬 태그스타 ${tag.stageLabel} ${tag.name}(${tag.no}) ${tag.rarityLabel} 태그의 ${priceText}. 교환 가치와 트레이드 손익을 확인해 보세요.`,
    openGraph: { images: [{ url: tag.images.front ?? tag.images.thumb }] },
  };
}

export default async function TagDetailPage({ params }: { params: Promise<{ no: string }> }) {
  const { no } = await params;
  const tag = find(no);
  if (!tag) notFound();

  const all = getTagsWithScores();
  const stat = getPrices().find((p) => p.no === tag.no);
  const theme = RARITY_THEME[tag.rarity];
  const related = all
    .filter((t) => t.no !== tag.no && t.rarity === tag.rarity && t.stage === tag.stage)
    .sort((a, b) => b.score.tp - a.score.tp)
    .slice(0, 6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `포켓몬 태그스타 ${tag.name} ${tag.rarityLabel}`,
    sku: tag.no,
    image: tag.images.front ?? tag.images.thumb,
    ...(tag.score.priceKrw != null && {
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'KRW',
        lowPrice: stat?.min ?? tag.score.priceKrw,
        highPrice: stat?.max ?? tag.score.priceKrw,
        offerCount: stat?.samples ?? 1,
      },
    }),
  };

  return (
    <article>
      <TrackTagView no={tag.no} rarity={tag.rarity} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <nav className="mb-5 text-xs text-violet-200/50">
        <Link href="/dex" className="hover:text-violet-100">도감</Link>
        <span className="mx-1.5">/</span>
        <span>{tag.stageLabel}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <PrismTag front={tag.images.front ?? tag.images.thumb} back={tag.images.back} alt={tag.name} priority />
        </div>

        <aside className="space-y-4">
          <div>
            <div className="flex items-center gap-2">
              <RarityChip rarity={tag.rarity} />
              <span className="font-mono text-xs text-violet-200/45">{tag.no}</span>
            </div>
            <h1 className="mt-2 text-3xl font-extrabold tracking-tight">{tag.name}</h1>
            <p className="mt-1 text-sm text-violet-200/55">{tag.stageLabel} · {tag.rarityLabel}</p>
          </div>

          <div className={`rounded-2xl border border-white/10 bg-white/[0.04] p-4 ring-1 ring-inset ${theme.ring}`}>
            <p className="text-xs font-semibold text-violet-200/50">중고 시세</p>
            <p className="mt-1 text-3xl font-extrabold tabular-nums text-emerald-300">
              {formatKrw(tag.score.priceKrw)}
            </p>
            <p className="mt-1 text-xs text-violet-200/50">
              거래점수 <span className="font-bold text-violet-100">{tag.score.tp} TP</span>
              {tag.score.confidence === 'estimated' && (
                <span className="ml-2 rounded bg-amber-300/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-200">
                  추정치
                </span>
              )}
            </p>
            {stat?.median != null && tag.score.confidence === 'market' && (
              <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-white/10 pt-3 text-center text-[11px]">
                <Stat label="최저" value={formatKrw(stat.min)} />
                <Stat label="최고" value={formatKrw(stat.max)} />
                <Stat label="매물" value={`${stat.samples}건`} />
              </dl>
            )}
            {tag.score.confidence === 'estimated' && (
              <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-violet-200/50">
                단품 매물이 충분하지 않아 등급으로 추정했어요. 실제 교환에서는 참고만 하세요.
              </p>
            )}
          </div>

          <AddToTrade no={tag.no} name={tag.name} />

          <p className="text-[11px] leading-relaxed text-violet-200/40">
            시세는 중고 거래 매물을 모아 계산한 중앙값이에요. 묶음 판매와 다른 게임 상품은 걸러냈지만,
            실제 거래가를 보장하지는 않아요.
          </p>
        </aside>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-3 text-lg font-bold">같은 등급의 다른 태그</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
            {related.map((t) => <TagCard key={t.no} tag={t} />)}
          </div>
        </section>
      )}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-violet-200/40">{label}</dt>
      <dd className="mt-0.5 font-bold tabular-nums text-violet-100">{value}</dd>
    </div>
  );
}
