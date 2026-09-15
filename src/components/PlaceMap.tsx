'use client';

import dynamic from 'next/dynamic';
import type { Place } from '@/lib/types';

// Leaflet 은 불러오는 시점에 window 를 만지므로 서버 렌더를 건너뛴다.
const Inner = dynamic(() => import('./PlaceMapInner'), {
  ssr: false,
  loading: () => (
    <div className="grid h-[60dvh] place-items-center rounded-2xl border border-white/10 text-sm text-violet-200/50">
      지도를 불러오는 중…
    </div>
  ),
});

export default function PlaceMap({ places }: { places: Place[] }) {
  return <Inner places={places} />;
}
