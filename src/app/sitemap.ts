import type { MetadataRoute } from 'next';
import { getMeta, getTags } from '@/lib/data';
import { CANONICAL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date(getMeta().updatedAt || Date.now());

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${CANONICAL}/`, lastModified, priority: 1 },
    { url: `${CANONICAL}/dex/`, lastModified, priority: 0.9 },
    { url: `${CANONICAL}/trade/`, lastModified, priority: 0.8 },
    { url: `${CANONICAL}/map/`, lastModified, priority: 0.7 },
    { url: `${CANONICAL}/privacy/`, lastModified, priority: 0.1 },
  ];

  // 검색 유입의 핵심은 태그 낱개 페이지다. 전부 넣는다.
  const tagPages: MetadataRoute.Sitemap = getTags().map((t) => ({
    url: `${CANONICAL}/dex/${encodeURIComponent(t.no)}/`,
    lastModified,
    priority: t.rarity >= 5 ? 0.8 : 0.5,
  }));

  return [...staticPages, ...tagPages];
}
