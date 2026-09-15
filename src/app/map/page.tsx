import type { Metadata } from 'next';
import PlaceMap from '@/components/PlaceMap';
import { getMeta, getPlaces } from '@/lib/data';

export const metadata: Metadata = {
  title: '내 주변 태그스타 매장 찾기',
  description:
    '전국 포켓몬 태그스타 게임기 설치 매장을 지도에서 확인하세요. 현재 위치 기준으로 가까운 순으로 보여주고 길찾기까지 연결합니다.',
};

export default function MapPage() {
  const places = getPlaces();
  const meta = getMeta();

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">내 주변 매장</h1>
        <p className="mt-2 text-sm text-violet-200/60">
          전국 {meta.counts.places}곳. 위치를 켜면 가까운 순으로 정렬해줄게요.
        </p>
      </header>
      <PlaceMap places={places} />
    </>
  );
}
