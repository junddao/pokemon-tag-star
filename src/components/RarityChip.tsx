import { RARITY_THEME } from '@/lib/theme';
import type { Rarity } from '@/lib/types';

export default function RarityChip({ rarity, className = '' }: { rarity: Rarity; className?: string }) {
  const theme = RARITY_THEME[rarity];
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-bold leading-none ${theme.chip} ${className}`}
    >
      {theme.label}
    </span>
  );
}
