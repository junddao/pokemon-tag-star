'use client';

import { useEffect } from 'react';
import { tagViewed } from '@/lib/analytics';

/**
 * 상세 페이지는 정적 서버 컴포넌트라 이벤트를 직접 못 찍는다.
 * 클라이언트 경계를 이 한 줄짜리 컴포넌트에만 가둬 두기 위한 장치.
 */
export default function TrackTagView({ no, rarity }: { no: string; rarity: number }) {
  useEffect(() => {
    tagViewed({ no, rarity });
  }, [no, rarity]);

  return null;
}
