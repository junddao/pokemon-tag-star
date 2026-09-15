import type { Rarity } from './types.ts';

/** 등급별 색. 아이들이 색만 보고 등급을 구분할 수 있어야 한다. */
export const RARITY_THEME: Record<Rarity, { label: string; ring: string; chip: string; glow: string }> = {
  6: { label: '★6', ring: 'ring-amber-300/70',  chip: 'bg-amber-300/15 text-amber-200 border-amber-300/40',  glow: 'shadow-[0_0_28px_-6px_rgba(252,211,77,0.65)]' },
  5: { label: '★5', ring: 'ring-fuchsia-300/60', chip: 'bg-fuchsia-300/15 text-fuchsia-200 border-fuchsia-300/40', glow: 'shadow-[0_0_24px_-8px_rgba(240,171,252,0.6)]' },
  4: { label: '★4', ring: 'ring-sky-300/50',    chip: 'bg-sky-300/12 text-sky-200 border-sky-300/35',        glow: '' },
  3: { label: '★3', ring: 'ring-emerald-300/40', chip: 'bg-emerald-300/12 text-emerald-200 border-emerald-300/30', glow: '' },
  2: { label: '★2', ring: 'ring-slate-400/40',  chip: 'bg-slate-300/10 text-slate-300 border-slate-400/30',  glow: '' },
  0: { label: 'R',  chip: 'bg-orange-300/12 text-orange-200 border-orange-300/30', ring: 'ring-orange-300/40', glow: '' },
};

export const RARITY_ORDER: Rarity[] = [6, 5, 4, 3, 2, 0];
