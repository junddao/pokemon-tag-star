import type { Metadata } from 'next';
import DexBrowser from '@/components/DexBrowser';
import { getMeta, getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  alternates: { canonical: '/dex/' },
  title: '태그 도감 — 등급별 전체 목록과 시세',
  description:
    '포켓몬 태그스타 전체 태그를 ★6 슈퍼스타부터 레귤러까지 등급별로 정리했습니다. 포켓몬 이름·태그 번호로 검색하고 중고 매물 기반 참고 시세를 비교하세요.',
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
          전체 {meta.counts.tags}개 · 중고 매물 시세 확보 {meta.counts.pricedTags}개.
          시세가 없는 태그는 등급으로 추정한 값이에요.
        </p>
      </header>
      <DexBrowser tags={tags} stages={stages} />
    </>
  );
}
