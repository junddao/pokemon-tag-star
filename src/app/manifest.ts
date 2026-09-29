import type { MetadataRoute } from 'next';
import { asset } from '@/lib/site';

export const dynamic = 'force-static';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: '포켓몬 태그스타 도감',
    short_name: '태그스타',
    description: '태그 도감, 시세, 트레이드 계산기와 보스 공략',
    start_url: asset('/'),
    scope: asset('/'),
    display: 'standalone',
    background_color: '#07060f',
    theme_color: '#07060f',
    icons: [
      { src: asset('/icons/icon-192.png'), sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: asset('/icons/icon-512.png'), sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
