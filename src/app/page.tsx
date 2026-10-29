import type { Metadata } from 'next';
import Link from 'next/link';
import TagCard from '@/components/TagCard';
import InstallApp from '@/components/InstallApp';
import { getMeta, getTagsWithScores } from '@/lib/data';
import { CANONICAL } from '@/lib/site';

export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

const SHORTCUTS = [
  { href: '/dex', emoji: '📖', title: '도감', desc: '등급별 전체 태그와 시세' },
  { href: '/trade', emoji: '⚖️', title: '트레이드 계산기', desc: '누가 손해인지 바로 판정' },
  { href: '/boss', emoji: '⚔️', title: '보스 공략', desc: '상성 좋은 포켓몬 3마리 추천' },
  { href: '/map', emoji: '📍', title: '내 주변 매장', desc: '가까운 게임기 찾기' },
];

export default function HomePage() {
  const tags = getTagsWithScores();
  const meta = getMeta();

  const top = tags
    .filter((t) => t.score.confidence === 'market')
    .sort((a, b) => b.score.tp - a.score.tp)
    .slice(0, 6);

  const latestStage = Math.max(...tags.map((t) => t.stage));
  const latest = tags
    .filter((t) => t.stage === latestStage && t.rarity === 6)
    .sort((a, b) => a.no.localeCompare(b.no))
    .slice(0, 6);

  return (
    <div className="space-y-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: '태그스타 도감',
        alternateName: '포켓몬 태그스타 도감',
        url: `${CANONICAL}/`,
        inLanguage: 'ko-KR',
        description: '포켓몬 태그스타 비공식 팬사이트. 태그 도감, 중고 매물 기반 참고 시세, 교환 계산기, 보스 공략과 설치 매장을 제공합니다.',
      }).replace(/</g, '\\u003c') }} />
      <section className="pt-4 text-center sm:pt-10">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          <span className="mb-3 block text-base font-bold text-violet-200/80 sm:text-xl">포켓몬 태그스타 도감·시세</span>
          내 태그, <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">얼마짜리</span>일까?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-violet-200/65 sm:text-base">
          포켓몬 태그스타 태그 {meta.counts.tags}개의 등급과 중고 시세를 모았어요.
          교환하기 전에 손해인지 이득인지 먼저 확인해보세요.
        </p>
        <InstallApp />
      </section>

      {/* 배틀은 유일하게 «해보는» 화면이라 바로가기 네 칸에 섞지 않고 따로 세운다.
          다섯 칸으로 늘리면 sm 2열에서 한 장이 혼자 떨어지기도 한다. */}
      <Link
        href="/play"
        className="group relative block overflow-hidden rounded-2xl border border-amber-300/25 bg-gradient-to-br from-fuchsia-500/20 via-violet-500/15 to-sky-500/20 p-5 transition hover:-translate-y-0.5 hover:border-amber-300/50 sm:p-6"
      >
        <div className="flex items-center gap-4">
          <span className="text-4xl sm:text-5xl">🎮</span>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-black uppercase tracking-widest text-amber-300">NEW</p>
            <h2 className="mt-0.5 text-lg font-extrabold text-white sm:text-xl">배틀로 겟 — 내 태그로 플레이</h2>
            <p className="mt-1 text-pretty text-xs leading-relaxed text-violet-100/70 sm:text-sm">
              내 태그 3장으로 보스에 도전해요. 공격 룰렛·버튼 연타·다이맥스까지 실제 기계 순서 그대로.
            </p>
          </div>
          <span aria-hidden className="shrink-0 text-xl text-amber-300 transition group-hover:translate-x-1">→</span>
        </div>
      </Link>

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="group rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:-translate-y-0.5 hover:border-violet-300/30 hover:bg-white/[0.08]"
          >
            <span className="text-2xl">{s.emoji}</span>
            <h2 className="mt-2 font-extrabold text-white">{s.title}</h2>
            <p className="mt-0.5 text-xs text-violet-200/55">{s.desc}</p>
          </Link>
        ))}
      </section>

      {top.length > 0 && (
        <section>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="text-lg font-bold">지금 제일 비싼 태그</h2>
            <Link href="/dex" className="text-xs font-semibold text-violet-200/60 hover:text-violet-100">
              전체 보기 →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
            {top.map((t) => <TagCard key={t.no} tag={t} />)}
          </div>
        </section>
      )}

      {latest.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-bold">{latestStage}탄 슈퍼스타태그 ★6</h2>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-6">
            {latest.map((t) => <TagCard key={t.no} tag={t} />)}
          </div>
        </section>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-sm leading-relaxed text-violet-200/60">
        <h2 className="font-bold text-violet-100">등급은 이렇게 나뉘어요</h2>
        <ul className="mt-2 space-y-1 text-[13px]">
          <li><b className="text-amber-200">슈퍼스타태그 ★6</b> — 탄마다 10장. 값어치가 여기서 갈려요.</li>
          <li><b className="text-fuchsia-200">스타태그 ★5</b> — 탄마다 15장. 교환에서 실제로 쳐주는 하한선.</li>
          <li><b className="text-slate-300">★4 이하 · 레귤러</b> — 수가 많아 교환에서는 덤으로 봐요.</li>
        </ul>
      </section>

      <section className="space-y-5 text-sm leading-relaxed text-violet-200/65">
        <h2 className="text-lg font-bold text-violet-100">태그스타 도감 이용 안내</h2>
        <div>
          <h3 className="font-bold text-violet-100">포켓몬 태그스타 시세는 어디서 확인하나요?</h3>
          <p className="mt-1"><Link href="/dex" className="underline">태그 도감</Link>에서 포켓몬 이름이나 태그 번호를 검색하면 개별 태그의 참고 시세와 거래점수(TP)를 확인할 수 있어요. 시세는 중고 판매 매물을 바탕으로 계산한 값이며, 거래 완료 가격을 확인한 실거래가는 아닙니다. 표본이 부족한 태그에는 등급 기반 추정치를 표시합니다.</p>
        </div>
        <div>
          <h3 className="font-bold text-violet-100">태그 교환 가치는 어떻게 비교하나요?</h3>
          <p className="mt-1"><Link href="/trade" className="underline">교환 계산기</Link>에 내 태그와 상대 태그를 담아 참고 거래점수를 비교하세요. ★6 슈퍼스타와 ★5 스타처럼 등급이 다른 교환에는 별도 경고를 표시합니다. 실제 교환 조건은 태그 상태와 상대방의 선호도에 따라 달라질 수 있어요.</p>
        </div>
        <div>
          <h3 className="font-bold text-violet-100">태그스타 게임기 설치 매장은 어디에 있나요?</h3>
          <p className="mt-1"><Link href="/map" className="underline">설치 매장 찾기</Link>에서 공식 사이트에 안내된 전국 {meta.counts.places}곳의 매장과 주소를 확인할 수 있어요. 위치 권한을 허용하면 가까운 순으로 찾을 수 있습니다. 설치·운영 여부는 방문 전 매장에 확인하세요.</p>
        </div>
        <div>
          <h3 className="font-bold text-violet-100">공식 사이트인가요? 정보 출처는 어디인가요?</h3>
          <p className="mt-1">태그스타 도감은 비공식 팬사이트입니다. 태그와 설치 매장 정보는 <a href={meta.source} className="underline" target="_blank" rel="noreferrer noopener">포켓몬태그스타 공식 사이트</a>를 바탕으로 정리합니다. 마지막 데이터 갱신 시각은 각 페이지 하단에 표시합니다.</p>
        </div>
      </section>
    </div>
  );
}
