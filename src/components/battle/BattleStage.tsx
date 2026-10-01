'use client';

import Image from 'next/image';
import type { Fighter, Verdict } from '@/lib/battle/types';

export type Art = Record<string, string>;

export interface Effect {
  /** 이번에 맞은 쪽 */
  target: 'mine' | 'foe';
  damage: number;
  verdict: Verdict;
  critical: boolean;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  great: '효과가 굉장하다!',
  normal: '보통이야',
  weak: '효과가 별로다...',
  none: '효과가 없다!',
};

const VERDICT_CLASS: Record<Verdict, string> = {
  great: 'bg-amber-300 text-ink-950',
  normal: 'bg-white/15 text-violet-100',
  weak: 'bg-sky-500/70 text-white',
  none: 'bg-white/10 text-violet-200/70',
};

function HpBar({ fighter }: { fighter: Fighter }) {
  const ratio = Math.max(0, fighter.hp) / fighter.maxHp;
  const tone = ratio > 0.5 ? 'bg-emerald-400' : ratio > 0.2 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
      <div className={`battle-gauge h-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

function Portrait({
  fighter, art, boss, revealed, animation, badge,
}: {
  fighter: Fighter;
  art: Art;
  boss?: boolean;
  revealed?: boolean;
  animation?: string;
  badge?: string;
}) {
  const down = fighter.hp <= 0;
  return (
    <div className={`relative flex-1 rounded-xl border p-1.5 transition-colors ${
      revealed ? 'border-rose-400/80 bg-rose-500/15' : 'border-white/10 bg-white/[0.04]'
    } ${boss ? 'ring-1 ring-amber-300/50' : ''}`}>
      {badge && (
        <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-amber-300 px-2 py-0.5 text-[10px] font-black text-ink-950">
          {badge}
        </span>
      )}
      <div className={`relative aspect-[300/169] w-full ${down ? 'battle-faint' : animation ?? ''}`}>
        <Image
          src={art[fighter.no] ?? ''}
          alt={fighter.name}
          fill
          sizes="33vw"
          className="rounded-lg object-cover"
        />
      </div>
      <p className="mt-1 truncate text-center text-[11px] font-bold text-violet-100">{fighter.name}</p>
      <HpBar fighter={fighter} />
      <p className="text-center text-[10px] tabular-nums text-violet-200/55">
        {Math.max(0, fighter.hp)} / {fighter.maxHp}
      </p>
    </div>
  );
}

/**
 * 「지역배틀」의 짝짓기 화면 — 위에 상대 3칸, 아래에 내 3칸.
 *
 * 상대가 한 마리를 먼저 내보이고 그걸 보고 내 태그를 고르는 구조라, 턴 번호를
 * 앞세우지 않고 «지금 누구와 맞붙는가»를 화면 한가운데에 둔다.
 */
export default function BattleStage({
  foes, bossIndex, revealed, team, activeNo, art, effect, attacking,
}: {
  foes: Fighter[];
  bossIndex: number;
  revealed: number | null;
  team: Fighter[];
  activeNo: string | null;
  art: Art;
  effect: Effect | null;
  attacking: 'mine' | 'foe' | null;
}) {
  return (
    <div className="relative space-y-2">
      {effect && (
        <div className="pointer-events-none absolute inset-0 z-20 battle-flash rounded-2xl bg-white" />
      )}

      <div className="flex gap-2">
        {foes.map((foe, index) => (
          <Portrait
            key={foe.no}
            fighter={foe}
            art={art}
            boss={index === bossIndex}
            revealed={index === revealed}
            badge={index === bossIndex ? '보스' : undefined}
            animation={
              attacking === 'foe' && index === revealed ? 'battle-lunge-down'
                : effect?.target === 'foe' && index === revealed ? 'battle-shake' : undefined
            }
          />
        ))}
      </div>

      <div className="relative flex h-12 items-center justify-center">
        {effect ? (
          <>
            <span className={`battle-banner rounded-full px-4 py-1.5 text-sm font-black ${VERDICT_CLASS[effect.verdict]}`}>
              {VERDICT_LABEL[effect.verdict]}
            </span>
            {effect.damage > 0 && (
              <span className="battle-damage-pop absolute text-3xl font-black text-rose-300 drop-shadow-[0_2px_0_rgba(0,0,0,0.6)]">
                -{effect.damage}{effect.critical && <em className="ml-1 text-sm not-italic text-amber-300">급소!</em>}
              </span>
            )}
          </>
        ) : (
          <span className="text-xs text-violet-200/40">VS</span>
        )}
      </div>

      <div className="flex gap-2">
        {team.map((mine) => (
          <Portrait
            key={mine.no}
            fighter={mine}
            art={art}
            revealed={mine.no === activeNo}
            animation={
              attacking === 'mine' && mine.no === activeNo ? 'battle-lunge-up'
                : effect?.target === 'mine' && mine.no === activeNo ? 'battle-shake' : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}
