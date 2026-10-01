import type { Metadata } from 'next';
import BattleGame from '@/components/battle/BattleGame';
import { getStats, getTagsWithScores } from '@/lib/data';

export const metadata: Metadata = {
  title: '배틀로 겟 — 내 태그로 플레이',
  description: '보유한 태그 3장으로 보스에 도전하는 연습 배틀. 공격 룰렛·버튼 연타·선공 찬스·다이맥스까지 실제 기계 순서를 따릅니다.',
};

export default function PlayPage() {
  const tags = getTagsWithScores();
  const stats = getStats();

  // 보스는 ★5·★6·레귤러 53마리, 좌우에 서는 잡몹은 ★4 이하다.
  const rarity = new Map(tags.map((tag) => [tag.no, tag.rarity]));
  const isBoss = (no: string) => {
    const value = rarity.get(no) ?? 0;
    return value >= 5 || value === 0;
  };

  const art = Object.fromEntries(tags.map((tag) => [tag.no, tag.images.thumb]));

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">배틀로 겟</h1>
        <p className="mt-2 text-sm text-violet-200/60">
          내 태그 3장으로 보스에 도전해요. 실제 기계의 진행 순서와 규칙을 따릅니다.
        </p>
      </header>

      <BattleGame
        stats={stats}
        bosses={stats.filter((s) => isBoss(s.no))}
        minions={stats.filter((s) => !isBoss(s.no))}
        art={art}
      />

      <p className="text-xs leading-relaxed text-violet-200/45">
        데미지 공식과 다이맥스 배율은 실물 플레이 관측치를 바탕으로 한 추정이라 실제 기계와
        정확히 같지는 않아요. 공격 룰렛의 숫자 구성은 태그에 인쇄돼 있지 않아 에너지값으로 추정했어요.
      </p>
    </div>
  );
}
