import { describe, expect, it } from 'vitest';
import { buildScores, estimateTp, tpFromKrw, tpToKrw } from '../src/lib/scoring.ts';
import { clampTp, rarityLabel } from '../src/lib/rarity.ts';
import type { PriceStat, Rarity, Tag } from '../src/lib/types.ts';

function tag(no: string, name: string, rarity: Rarity): Tag {
  return {
    no, name, stage: 2, stageLabel: '2탄', rarity, rarityLabel: rarityLabel(rarity),
    sourceIdx: 0, images: { thumb: '', front: null, back: null },
  };
}

function stat(no: string, median: number | null, samples: number): PriceStat {
  return { no, median, samples, min: median, max: median, observedAt: '2026-09-15T00:00:00Z' };
}

describe('원화 ↔ 거래점수', () => {
  it('★6 3.2만원이 80TP 근처가 되도록 환산한다', () => {
    expect(tpFromKrw(32000)).toBe(80);
    expect(tpToKrw(80)).toBe(32000);
  });
});

describe('등급 상한', () => {
  it('★4 이하는 아무리 비싸게 팔려도 덤 취급을 벗어나지 못한다', () => {
    expect(clampTp(4, 12.5)).toBe(2);
    expect(clampTp(3, 12.5)).toBe(2);
    expect(clampTp(2, 100)).toBe(2);
  });

  it('★5 는 ★6 영역까지 올라가지 않는다', () => {
    expect(clampTp(5, 200)).toBe(40);
  });

  it('★6 은 넓게 열어둔다', () => {
    expect(clampTp(6, 150)).toBe(150);
  });
});

describe('점수 확정', () => {
  it('표본이 충분하면 실거래를 쓴다', () => {
    const [score] = buildScores([tag('1-2-001', '가이오가', 6)], new Map([['1-2-001', stat('1-2-001', 20000, 9)]]));
    expect(score.confidence).toBe('market');
    expect(score.tp).toBe(50);
  });

  it('★3 의 표본 3건짜리 시세는 믿지 않는다', () => {
    // 저가 태그의 소수 표본은 예외이거나 필터를 빠져나간 묶음이다
    const [score] = buildScores([tag('1-2-033', '수풀부기', 3)], new Map([['1-2-033', stat('1-2-033', 5000, 3)]]));
    expect(score.confidence).toBe('estimated');
    expect(score.tp).toBeLessThan(1);
  });

  it('시세가 없으면 등급 산식으로 추정한다', () => {
    const [score] = buildScores([tag('1-2-011', '쥬피썬더', 5)], new Map());
    expect(score.confidence).toBe('estimated');
    expect(score.tp).toBe(estimateTp(tag('1-2-011', '쥬피썬더', 5)));
  });

  it('등급 순서가 뒤집히지 않는다', () => {
    // 이 불변식이 깨지면 계산기가 "★3 한 장 = ★5 한 장" 이라고 조언하게 된다
    const tags = [tag('a', '가', 6), tag('b', '나', 5), tag('c', '다', 3)];
    const prices = new Map([
      ['a', stat('a', 20000, 9)],
      ['b', stat('b', 5000, 6)],
      ['c', stat('c', 24000, 30)], // 오염된 시세
    ]);
    const [s6, s5, s3] = buildScores(tags, prices);
    expect(s6.tp).toBeGreaterThan(s5.tp);
    expect(s5.tp).toBeGreaterThan(s3.tp);
  });
});
