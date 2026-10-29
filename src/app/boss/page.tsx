import type { Metadata } from 'next';
import BossRecommender from '@/components/BossRecommender';
import { getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  alternates: { canonical: '/boss/' },
  title: '포켓몬 태그스타 보스 공략 — 상성별 태그 추천',
  description: '★5·★6 보스를 고르면 타입 상성이 유리한 태그를 보유 목록 우선으로 추천합니다.',
};

export default function BossPage() {
  const tags = getTagsWithScores();
  const stages = [...new Set(tags.map((t) => t.stage))].sort((a, b) => a - b);
  return <BossRecommender tags={tags} stages={stages} />;
}
