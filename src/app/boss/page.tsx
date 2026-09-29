import type { Metadata } from 'next';
import BossRecommender from '@/components/BossRecommender';
import { getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  title: '보스 상대 포켓몬 3마리 추천',
  description: '★5·★6 보스를 고르면 타입 상성이 유리한 태그를 보유 목록 우선으로 추천합니다.',
};

export default function BossPage() {
  return <BossRecommender tags={getTagsWithScores()} />;
}
