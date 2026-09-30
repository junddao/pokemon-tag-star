import type { TagWithScore } from './data.ts';
import type { Tag } from './types.ts';
import type { Basket } from './store.ts';
import { bestMatchup, SPECIES_TYPES, type PokemonType } from './pokemon-types.ts';

/**
 * 보스로 고를 수 있는 ★5·★6 태그. 탄으로 먼저 거른 뒤 이름으로 합친다.
 * 순서를 뒤집으면 1·2탄에 모두 나온 포켓몬(피카츄·마기라스·메타그로스)의
 * 2탄 태그가 1탄 태그에 가려 목록에서 사라진다.
 */
export function bossOptions<T extends Tag>(tags: T[], stage: number | 'all'): T[] {
  const seen = new Set<string>();
  return tags.filter((tag) => {
    if (tag.rarity < 5 || !SPECIES_TYPES[tag.name]) return false;
    if (stage !== 'all' && tag.stage !== stage) return false;
    if (seen.has(tag.name)) return false;
    seen.add(tag.name);
    return true;
  });
}

export interface Recommendation {
  tag: TagWithScore;
  attackType: PokemonType;
  multiplier: number;
  owned: boolean;
}

/** 보스 이름을 기준으로 보유 태그를 먼저 정렬한다. 같은 포켓몬은 추천 3마리에 한 번만 넣는다. */
export function recommendAgainstBoss(tags: TagWithScore[], bossName: string, owned: Basket): Recommendation[] {
  const defenders = SPECIES_TYPES[bossName];
  if (!defenders) return [];

  return tags.flatMap((tag) => {
    if (tag.name === bossName) return [];
    const attacker = SPECIES_TYPES[tag.name];
    if (!attacker) return [];
    const matchup = bestMatchup(attacker, defenders);
    if (!matchup || matchup.multiplier <= 1) return [];
    return [{ tag, attackType: matchup.type, multiplier: matchup.multiplier, owned: (owned[tag.no] ?? 0) > 0 }];
  }).sort((a, b) =>
    Number(b.owned) - Number(a.owned)
    || b.multiplier - a.multiplier
    || b.tag.rarity - a.tag.rarity
    || b.tag.score.tp - a.tag.score.tp
    || a.tag.no.localeCompare(b.tag.no)
  );
}

export function topThree(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set<string>();
  return recommendations.filter(({ tag }) => {
    if (seen.has(tag.name)) return false;
    seen.add(tag.name);
    return true;
  }).slice(0, 3);
}
