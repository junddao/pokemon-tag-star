import { describe, expect, it } from 'vitest';
import { bossOptions } from '../src/lib/boss-recommendations.ts';
import { rarityLabel } from '../src/lib/rarity.ts';
import type { Rarity, Tag } from '../src/lib/types.ts';

function tag(no: string, name: string, stage: number, rarity: Rarity): Tag {
  return {
    no, name, stage, stageLabel: `스타태그 스타더스트 ${stage}탄`,
    rarity, rarityLabel: rarityLabel(rarity), sourceIdx: 0,
    images: { thumb: '', front: null, back: null },
  };
}

describe('보스 목록', () => {
  it('탄을 지정하면 그 탄의 보스만 남긴다', () => {
    const tags = [tag('1-1-001', '뮤츠', 1, 6), tag('2-1-001', '가이오가', 2, 6)];
    expect(bossOptions(tags, 2).map((t) => t.name)).toEqual(['가이오가']);
  });

  it('같은 포켓몬이 두 탄에 있으면 고른 탄의 태그를 남긴다', () => {
    const tags = [tag('1-2-009', '피카츄', 1, 5), tag('2-2-004', '피카츄', 2, 5)];
    expect(bossOptions(tags, 2).map((t) => t.no)).toEqual(['2-2-004']);
  });

  it("'전체'는 같은 포켓몬을 한 번만 보여준다", () => {
    const tags = [tag('1-2-009', '피카츄', 1, 5), tag('2-2-004', '피카츄', 2, 5)];
    expect(bossOptions(tags, 'all').map((t) => t.no)).toEqual(['1-2-009']);
  });

  it('★4 이하와 타입을 모르는 포켓몬은 뺀다', () => {
    const tags = [tag('2-3-001', '잠만보', 2, 4), tag('2-1-099', '없는포켓몬', 2, 6)];
    expect(bossOptions(tags, 2)).toEqual([]);
  });
});
