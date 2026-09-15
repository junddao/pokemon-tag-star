import type { Metadata } from 'next';
import DexBrowser from '@/components/DexBrowser';
import { getMeta, getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  title: '태그 도감 — 등급별 전체 목록과 시세',
  description:
    '포켓몬 태그스타 1탄·2탄 전체 태그를 ★6 슈퍼스타부터 레귤러까지 등급별로 정리했습니다. 중고 실거래 시세로 정렬해 보세요.',
};

export default function DexPage() {
  const tags = getTagsWithScores();
  const meta = getMeta();
  const stages = [...new Set(tags.map((t) => t.stage))].sort((a, b) => a - b);

  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">태그 도감</h1>
        <p className="mt-2 text-sm text-violet-200/60">
          전체 {meta.counts.tags}개 · 실거래 시세 확보 {meta.counts.pricedTags}개.
          시세가 없는 태그는 등급으로 추정한 값이에요.
        </p>
      </header>
      <DexBrowser tags={tags} stages={stages} />
    </>
  );
}
