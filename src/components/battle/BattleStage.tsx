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

export interface Hint {
  verdict: Verdict;
  faster: boolean;
  blocked: boolean;
  move: string;
}

const VERDICT_LABEL: Record<Verdict, string> = {
  great: '효과가 굉장하다!',
  normal: '보통이야',
  weak: '효과가 별로다...',
  none: '효과가 없다!',
};

const VERDICT_SHORT: Record<Verdict, string> = {
  great: '훌륭해', normal: '보통이야', weak: '부족해', none: '효과 없음',
};

const VERDICT_CLASS: Record<Verdict, string> = {
  great: 'bg-amber-300 text-ink-950',
  normal: 'bg-white/15 text-violet-100',
  weak: 'bg-sky-500/70 text-white',
  none: 'bg-white/10 text-violet-200/70',
};

const VERDICT_CHIP: Record<Verdict, string> = {
  great: 'bg-amber-300 text-ink-950',
  normal: 'bg-white/20 text-violet-50',
  weak: 'bg-sky-500/80 text-white',
  none: 'bg-white/15 text-violet-200/80',
};

function HpBar({ fighter, hp }: { fighter: Fighter; hp: number }) {
  const ratio = Math.max(0, hp) / fighter.maxHp;
  const tone = ratio > 0.5 ? 'bg-emerald-400' : ratio > 0.2 ? 'bg-amber-400' : 'bg-rose-500';
  return (
    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/50">
      <div className={`battle-gauge h-full ${tone}`} style={{ width: `${ratio * 100}%` }} />
    </div>
  );
}

function Body({
  fighter, art, animation, badge, hit, hp,
}: {
  fighter: Fighter;
  art: Art;
  animation?: string;
  badge?: string;
  hit?: Effect | null;
  /** 연출 중에는 턴 결과가 아직 반영되기 전이라 표시용 HP 를 따로 받는다. */
  hp: number;
}) {
  const down = hp <= 0;
  return (
    <>
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
        {/* 맞은 포켓몬 위에서 숫자가 튀어오른다. 화면 전체를 덮지 않는다. */}
        {hit && (
          <span className="battle-impact pointer-events-none absolute inset-0 rounded-lg" />
        )}
        {hit && hit.damage > 0 && (
          <span className="battle-damage-pop pointer-events-none absolute inset-x-0 top-1/2 z-20 text-center text-2xl font-black text-rose-200 drop-shadow-[0_2px_0_rgba(0,0,0,0.85)]">
            -{hit.damage}
            {hit.critical && <em className="ml-1 text-[11px] not-italic text-amber-300">급소!</em>}
          </span>
        )}
      </div>
      <p className="mt-1 truncate text-center text-[11px] font-bold text-violet-100">{fighter.name}</p>
      <HpBar fighter={fighter} hp={hp} />
      <p className="text-center text-[10px] tabular-nums text-violet-200/55">
        {Math.max(0, hp)} / {fighter.maxHp}
      </p>
    </>
  );
}

function frameClass(active: boolean, boss: boolean, blocked: boolean) {
  return [
    'relative flex-1 rounded-xl border p-1.5 text-left transition-colors',
    active ? 'border-rose-400/80 bg-rose-500/15' : 'border-white/10 bg-white/[0.04]',
    boss ? 'ring-1 ring-amber-300/50' : '',
    blocked ? 'opacity-40' : '',
  ].join(' ');
}

/**
 * 「지역배틀」의 짝짓기 화면 — 위에 상대 3칸, 아래에 내 3칸.
 *
 * 상대가 한 마리를 먼저 내보이고 그걸 보고 내 태그를 고르는 구조다. 공격할 포켓몬은
 * 아래 별도 목록이 아니라 «포켓몬을 직접 눌러서» 고른다 — 실물에서 태그를 앞으로 미는
 * 동작에 해당하는 자리가 거기이고, 목록을 따로 두면 무엇을 누르는지 헷갈린다.
 */
export default function BattleStage({
  foes, bossIndex, revealed, team, activeNo, art, effect, attacking, hpNow, hints, onPick,
}: {
  foes: Fighter[];
  bossIndex: number;
  revealed: number | null;
  team: Fighter[];
  activeNo: string | null;
  art: Art;
  effect: Effect | null;
  attacking: 'mine' | 'foe' | null;
  /** 연출 중 표시할 HP. 없으면 각 포켓몬의 실제 HP 를 쓴다. */
  hpNow?: Record<string, number> | null;
  /** 선택 단계에서만 넘어온다. 넘어오면 내 포켓몬이 눌러지는 상태가 된다. */
  hints?: Record<string, Hint>;
  onPick?: (no: string) => void;
}) {
  const picking = Boolean(hints && onPick);
  const hpOf = (f: Fighter) => hpNow?.[f.no] ?? f.hp;

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        {foes.map((foe, index) => (
          <div key={foe.no} className={frameClass(index === revealed, index === bossIndex, false)}>
            <Body
              fighter={foe}
              hp={hpOf(foe)}
              art={art}
              badge={index === bossIndex ? '보스' : undefined}
              hit={effect?.target === 'foe' && index === revealed ? effect : null}
              animation={
                attacking === 'foe' && index === revealed ? 'battle-lunge-down'
                  : effect?.target === 'foe' && index === revealed ? 'battle-shake' : undefined
              }
            />
          </div>
        ))}
      </div>

      <div className="flex h-10 items-center justify-center">
        {effect ? (
          <span className={`battle-banner rounded-full px-4 py-1.5 text-sm font-black ${VERDICT_CLASS[effect.verdict]}`}>
            {VERDICT_LABEL[effect.verdict]}
          </span>
        ) : picking ? (
          <span className="text-xs font-bold text-amber-200">↓ 공격할 포켓몬을 눌러줘</span>
        ) : (
          <span className="text-xs text-violet-200/40">VS</span>
        )}
      </div>

      <div className="flex gap-2">
        {team.map((mine) => {
          const hint = hints?.[mine.no];
          const blocked = hint?.blocked ?? false;
          const content = (
            <Body
              fighter={mine}
              hp={hpOf(mine)}
              art={art}
              hit={effect?.target === 'mine' && mine.no === activeNo ? effect : null}
              animation={
                attacking === 'mine' && mine.no === activeNo ? 'battle-lunge-up'
                  : effect?.target === 'mine' && mine.no === activeNo ? 'battle-shake' : undefined
              }
            />
          );

          if (!picking) {
            return (
              <div key={mine.no} className={frameClass(mine.no === activeNo, false, false)}>
                {content}
              </div>
            );
          }

          return (
            <button
              key={mine.no}
              type="button"
              disabled={blocked}
              onClick={() => onPick?.(mine.no)}
              className={`${frameClass(false, false, blocked)} ${
                blocked ? '' : 'border-amber-300/50 bg-amber-300/[0.06] active:scale-[0.97]'
              } min-h-[11rem]`}
            >
              {content}
              {hint && (
                <div className="mt-1 space-y-0.5">
                  <p className="truncate text-center text-[10px] text-violet-200/70">{hint.move}</p>
                  <p className={`rounded-full py-0.5 text-center text-[10px] font-black ${VERDICT_CHIP[hint.verdict]}`}>
                    {VERDICT_SHORT[hint.verdict]}
                  </p>
                  <p className={`text-center text-[10px] font-bold ${hint.faster ? 'text-sky-300' : 'text-rose-300'}`}>
                    {blocked ? '직전 턴 사용' : hint.faster ? '내가 선공' : '상대가 선공'}
                  </p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
