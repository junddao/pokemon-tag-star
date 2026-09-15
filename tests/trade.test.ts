import { describe, expect, it } from 'vitest';
import { classify, evaluateTrade, suggestAdditions, sumTp, type TradeEntry } from '../src/lib/trade.ts';
import { rarityLabel } from '../src/lib/rarity.ts';
import type { Rarity, Tag, TagScore } from '../src/lib/types.ts';

function entry(no: string, rarity: Rarity, tp: number, qty = 1,
               confidence: TagScore['confidence'] = 'market'): TradeEntry {
  const tag: Tag = {
    no, name: no, stage: 2, stageLabel: '2탄',
    rarity, rarityLabel: rarityLabel(rarity), sourceIdx: 0,
    images: { thumb: '', front: null, back: null },
  };
  return { tag, score: { no, tp, confidence, priceKrw: tp * 400, samples: 5 }, qty };
}

describe('판정 구간', () => {
  it('비율을 5단계로 나눈다', () => {
    expect(classify(0.4)).toBe('big-gain');
    expect(classify(0.1)).toBe('gain');
    expect(classify(0)).toBe('fair');
    expect(classify(-0.1)).toBe('loss');
    expect(classify(-0.4)).toBe('big-loss');
  });
});

describe('합계', () => {
  it('수량을 곱해 더한다', () => {
    expect(sumTp([entry('a', 5, 10, 3), entry('b', 6, 80)])).toBe(110);
  });
});

describe('등급 사다리 경고', () => {
  // 이 경고가 이 계산기의 존재 이유다.
  // 점수만 맞추면 "★5 스무 장 = ★6 한 장"이라는 현실에 없는 조언을 하게 된다.
  it('점수가 공정해도 ★5 뭉치로 ★6을 받으려 하면 경고한다', () => {
    const mine = [entry('star5', 5, 4, 20)];     // ★5 스무 장 = 80TP
    const theirs = [entry('super6', 6, 80)];     // ★6 한 장  = 80TP

    const r = evaluateTrade(mine, theirs);
    expect(r.myTp).toBe(80);
    expect(r.theirTp).toBe(80);
    expect(r.verdict).toBe('fair');              // 점수로는 공정하지만
    expect(r.warnings.some((w) => w.kind === 'ladder')).toBe(true);  // 현실에선 안 된다
    expect(r.warnings.some((w) => w.kind === 'padding')).toBe(true);
  });

  it('★6끼리 맞바꾸면 사다리 경고가 없다', () => {
    const r = evaluateTrade([entry('a', 6, 80)], [entry('b', 6, 82)]);
    expect(r.warnings.some((w) => w.kind === 'ladder')).toBe(false);
    expect(r.verdict).toBe('fair');
  });

  it('내가 ★6을 내주고 하위 등급만 받는 경우도 경고한다', () => {
    const r = evaluateTrade([entry('a', 6, 80)], [entry('b', 5, 10, 8)]);
    expect(r.warnings.some((w) => w.kind === 'ladder')).toBe(true);
  });

  it('추정치가 섞이면 알려준다', () => {
    const r = evaluateTrade([entry('a', 6, 80, 1, 'estimated')], [entry('b', 6, 80)]);
    expect(r.warnings.some((w) => w.kind === 'estimated')).toBe(true);
  });
});

describe('손익 판정', () => {
  it('내가 많이 주면 손해로 본다', () => {
    const r = evaluateTrade([entry('a', 6, 80), entry('b', 6, 80)], [entry('c', 6, 80)]);
    expect(r.diff).toBe(-80);
    expect(r.verdict).toBe('big-loss');
  });

  it('내가 적게 주면 이득으로 본다', () => {
    const r = evaluateTrade([entry('a', 5, 10)], [entry('c', 6, 80)]);
    expect(r.verdict).toBe('big-gain');
  });
});

describe('추가 추천', () => {
  it('모자란 점수를 가장 가깝게 메우는 조합을 고른다', () => {
    const pool = [entry('p80', 6, 80), entry('p30', 5, 30), entry('p12', 5, 12), entry('p5', 5, 5)];
    const picked = suggestAdditions(pool, 42);
    expect(sumTp(picked)).toBe(42); // 30 + 12
    expect(picked.map((p) => p.tag.no).sort()).toEqual(['p12', 'p30']);
  });

  it('정확히 못 맞추면 모자란 쪽이 아니라 덜 넘치는 쪽을 고른다', () => {
    // 부족분 20. 10 하나로는 여전히 모자라 트레이드가 성립하지 않는다.
    const pool = [entry('p10', 5, 10), entry('p25', 5, 25)];
    expect(sumTp(suggestAdditions(pool, 20))).toBe(25);
  });

  it('목표를 넘기는 조합이 여럿이면 가장 덜 얹는다', () => {
    const pool = [entry('p22', 5, 22), entry('p40', 6, 40), entry('p80', 6, 80)];
    expect(sumTp(suggestAdditions(pool, 20))).toBe(22);
  });

  it('보유분으로 목표에 못 미치면 가장 가까운 조합이라도 제안한다', () => {
    const pool = [entry('p10', 5, 10), entry('p5', 5, 5)];
    expect(sumTp(suggestAdditions(pool, 100))).toBe(15);
  });

  it('부족분이 없으면 아무것도 추천하지 않는다', () => {
    expect(suggestAdditions([entry('a', 6, 80)], 0)).toEqual([]);
    expect(suggestAdditions([], 50)).toEqual([]);
  });

  it('보유 수량을 넘겨 추천하지 않는다', () => {
    const picked = suggestAdditions([entry('a', 5, 10, 2)], 100);
    expect(picked[0].qty).toBeLessThanOrEqual(2);
  });
});
