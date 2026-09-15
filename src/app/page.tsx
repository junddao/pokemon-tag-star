import Link from 'next/link';
import TagCard from '@/components/TagCard';
import { getMeta, getTagsWithScores } from '@/lib/data';

const SHORTCUTS = [
  { href: '/dex', emoji: '📖', title: '도감', desc: '등급별 전체 태그와 시세' },
  { href: '/trade', emoji: '⚖️', title: '트레이드 계산기', desc: '누가 손해인지 바로 판정' },
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
      <section className="pt-4 text-center sm:pt-10">
        <h1 className="text-balance text-3xl font-extrabold leading-tight tracking-tight sm:text-5xl">
          내 태그, <span className="bg-gradient-to-r from-amber-300 via-fuchsia-400 to-sky-400 bg-clip-text text-transparent">얼마짜리</span>일까?
        </h1>
        <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-violet-200/65 sm:text-base">
          포켓몬 태그스타 태그 {meta.counts.tags}개의 등급과 중고 시세를 모았어요.
          교환하기 전에 손해인지 이득인지 먼저 확인해보세요.
        </p>
      </section>

      <section className="grid gap-3 sm:grid-cols-3">
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
    </div>
  );
}
