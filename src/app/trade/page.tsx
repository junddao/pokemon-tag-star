import type { Metadata } from 'next';
import TradeCalculator from '@/components/TradeCalculator';
import { getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  title: '트레이드 계산기 — 누가 손해인지 바로 확인',
  description:
    '내 태그와 상대 태그를 담으면 등급 가중치로 손익을 판정합니다. ★5를 아무리 쌓아도 ★6이 되지 않는 등급 사다리까지 알려줍니다.',
};

export default function TradePage() {
  return (
    <>
      <header className="mb-6">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">트레이드 계산기</h1>
        <p className="mt-2 text-sm leading-relaxed text-violet-200/60">
          양쪽 태그를 담으면 손익을 판정해요. 합계가 같아도 ★6은 ★5 뭉치로 바뀌지 않으니,
          그런 조합은 따로 경고해줄게요.
        </p>
      </header>
      <TradeCalculator tags={getTagsWithScores()} />
    </>
  );
}
