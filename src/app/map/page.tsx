import type { Metadata } from 'next';
import PlaceMap from '@/components/PlaceMap';
import { formatUpdatedAt, getMeta, getPlaces } from '@/lib/data';

export const metadata: Metadata = {
  alternates: { canonical: '/map/' },
  title: '내 주변 태그스타 매장 찾기',
  description:
    '전국 포켓몬 태그스타 게임기 설치 매장을 지도에서 확인하세요. 현재 위치 기준으로 가까운 순으로 보여주고 길찾기까지 연결합니다.',
};

export default function MapPage() {
  const places = getPlaces();
  const meta = getMeta();
  const regions = [...new Set(places.map((place) => place.region))].sort();

  return (
    <>
      <header className="mb-5">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">포켓몬 태그스타 설치 매장 찾기</h1>
        <p className="mt-2 text-sm text-violet-200/60">
          전국 {meta.counts.places}곳. 위치를 켜면 가까운 순으로 정렬해줄게요.
        </p>
      </header>
      <PlaceMap places={places} />
      <section className="mt-10 space-y-4">
        <h2 className="text-lg font-bold">지역별 포켓몬 태그스타 매장·주소 목록</h2>
        <p className="text-sm leading-relaxed text-violet-200/60">
          공식 사이트의 설치 매장 안내를 정리했습니다. 게임기 운영 여부와 영업시간은 방문 전 매장에 확인하세요.
          {meta.updatedAt && <> 데이터 갱신: <time dateTime={meta.updatedAt}>{formatUpdatedAt(meta.updatedAt)}</time>.</>}
        </p>
        {regions.map((region) => (
          <details key={region} className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
            <summary className="cursor-pointer font-semibold">{region} 태그스타 설치 매장 ({places.filter((place) => place.region === region).length}곳)</summary>
            <ul className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              {places.filter((place) => place.region === region).map((place) => (
                <li key={place.idx}>
                  <h3 className="font-semibold text-violet-100">{place.name}</h3>
                  <p className="mt-1 text-violet-200/60">{place.address}</p>
                </li>
              ))}
            </ul>
          </details>
        ))}
      </section>
    </>
  );
}
