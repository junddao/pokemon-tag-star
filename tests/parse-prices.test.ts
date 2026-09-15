import { describe, expect, it } from 'vitest';
import { isUsableListing, median, summarizePrices } from '../src/lib/parse-prices.ts';

// 번개장터 검색에서 실제로 관측된 오염 사례들
const OTHER_NAMES = ['가이오가', '그란돈', '잠만보', '코라이돈', '피카츄', '뮤츠'];
const ctx = { name: '가이오가', otherNames: OTHER_NAMES };

describe('매물 필터', () => {
  it('단품 매물은 통과시킨다', () => {
    expect(isUsableListing('포켓몬 태그스타 2탄 가이오가', ctx)).toBe(true);
    expect(isUsableListing('포켓몬스터 포켓몬 태그스타 2탄 6성 가이오가 게임 슈퍼', ctx)).toBe(true);
  });

  it('다른 포켓몬이 함께 적힌 묶음을 거른다', () => {
    expect(isUsableListing('포켓몬태그스타6성 그란돈,가이오가', ctx)).toBe(false);
    expect(isUsableListing('포켓몬 태그스타 2탄 가이오가,그란돈6성', ctx)).toBe(false);
    expect(isUsableListing('포켓몬 태그스타2탄 가이오가 ,잠만보 6성 일괄택포', ctx)).toBe(false);
  });

  it('다른 게임 상품을 거른다', () => {
    expect(isUsableListing('포켓몬카드 일본판 메자스타 스페셜 태그 3종(가이오가/라우드본/웨이니발)', ctx)).toBe(false);
  });

  it('수량이 붙은 제목을 거른다', () => {
    expect(isUsableListing('포켓몬 태그스타 가이오가 3장', ctx)).toBe(false);
    expect(isUsableListing('포켓몬 태그스타2탄 가이오가 5종', ctx)).toBe(false);
  });

  it('찾는 포켓몬이 없으면 거른다', () => {
    expect(isUsableListing('포켓몬 태그스타 2탄 피카츄', ctx)).toBe(false);
  });
});

describe('중앙값', () => {
  it('이상치에 끌려가지 않는다', () => {
    // 평균이라면 500000 하나에 무너진다
    expect(median([30000, 32000, 35000, 500000])).toBe(33500);
  });

  it('빈 배열은 null', () => {
    expect(median([])).toBeNull();
  });
});

describe('시세 집계', () => {
  it('표본이 3건 미만이면 시세로 인정하지 않는다', () => {
    const stat = summarizePrices('1-2-001', [
      { name: '포켓몬 태그스타 가이오가', price: '30000' },
      { name: '포켓몬 태그스타 2탄 가이오가', price: '40000' },
    ], ctx);
    expect(stat.median).toBeNull();
    expect(stat.samples).toBe(2);
  });

  it('묶음을 걸러낸 뒤의 중앙값을 쓴다', () => {
    const stat = summarizePrices('1-2-001', [
      { name: '포켓몬 태그스타 가이오가', price: '30000' },
      { name: '포켓몬 태그스타 2탄 가이오가', price: '40000' },
      { name: '포켓몬 태그스타 6성 가이오가', price: '35000' },
      { name: '포켓몬태그스타6성 그란돈,가이오가', price: '50000' }, // 묶음 → 제외
      { name: '메자스타 가이오가', price: '11000' },                 // 다른 게임 → 제외
    ], ctx);
    expect(stat.samples).toBe(3);
    expect(stat.median).toBe(35000);
  });

  it('말도 안 되는 가격을 자른다', () => {
    const stat = summarizePrices('1-2-001', [
      { name: '포켓몬 태그스타 가이오가', price: '10' },
      { name: '포켓몬 태그스타 가이오가 삽니다', price: '9999999' },
      { name: '포켓몬 태그스타 2탄 가이오가', price: '30000' },
    ], ctx);
    expect(stat.samples).toBe(1);
    expect(stat.median).toBeNull();
  });
});
