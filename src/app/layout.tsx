import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import './globals.css';
import { formatUpdatedAt, getMeta } from '@/lib/data';

export const metadata: Metadata = {
  title: {
    default: '포켓몬 태그스타 도감 · 시세 · 트레이드 계산기',
    template: '%s | 태그스타 도감',
  },
  description:
    '포켓몬 태그스타 전체 태그를 등급별로 정리하고, 중고 실거래 시세와 트레이드 손익 판정, 내 주변 설치 매장까지 한 곳에서 확인하세요.',
  keywords: ['포켓몬 태그스타', '태그스타 시세', '태그스타 도감', '포켓몬 태그 교환', '태그스타 매장'],
  openGraph: {
    title: '포켓몬 태그스타 도감 · 시세 · 트레이드 계산기',
    description: '등급별 태그 시세와 교환 손익을 계산해 보세요.',
    type: 'website',
    locale: 'ko_KR',
  },
};

export const viewport: Viewport = {
  themeColor: '#07060f',
};

const NAV = [
  { href: '/dex', label: '도감' },
  { href: '/trade', label: '트레이드' },
  { href: '/map', label: '내 주변' },
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const meta = getMeta();

  return (
    <html lang="ko">
      <body className="min-h-dvh antialiased">
        <header className="sticky top-0 z-50 border-b border-white/10 bg-[#07060f]/80 backdrop-blur-xl">
          <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:h-16">
            <Link href="/" className="flex shrink-0 items-center gap-2 font-extrabold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-amber-300 via-fuchsia-400 to-sky-400 text-sm text-black shadow-lg">
                ★
              </span>
              <span className="hidden text-base sm:inline">태그스타 도감</span>
            </Link>
            <nav className="ml-auto flex items-center gap-1 text-sm">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-lg px-3 py-2 font-semibold text-violet-100/80 transition hover:bg-white/10 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pb-20 pt-6 sm:pt-10">{children}</main>

        <footer className="border-t border-white/10 px-4 py-8 text-center text-xs leading-relaxed text-violet-200/50">
          <p>
            비공식 팬사이트입니다. 포켓몬 및 포켓몬 태그스타의 권리는 각 권리자에게 있습니다.
          </p>
          <p className="mt-1">
            태그·매장 정보 출처{' '}
            <a href={meta.source} className="underline hover:text-violet-200" target="_blank" rel="noreferrer noopener">
              포켓몬태그스타 공식 사이트
            </a>
            {meta.updatedAt && <> · 마지막 갱신 {formatUpdatedAt(meta.updatedAt)}</>}
          </p>
          <p className="mt-1">시세는 중고 거래 매물을 모아 추정한 참고값이며, 실제 거래가를 보장하지 않습니다.</p>
        </footer>
      </body>
    </html>
  );
}
