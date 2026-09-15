import type { PriceStat, Tag, TagScore } from './types.ts';
import { MIN_SAMPLES_BY_RARITY, RARITY_BASE_TP, clampTp } from './rarity.ts';

/**
 * 실거래 중앙값을 거래점수로 바꾸는 환산율.
 * ★6 3.2만원 ≈ 80TP, ★5 4천원 ≈ 10TP 에 맞춰 잡았다.
 */
export const KRW_PER_TP = 400;

/**
 * 시세 표본이 없을 때만 쓰는 인기 가중치.
 * 실거래가 잡히면 이 값은 무시되므로, 추정을 덜 틀리게 하는 용도일 뿐이다.
 */
const POPULARITY: Record<string, number> = {
  피카츄: 1.6, 뮤츠: 1.5, 뮤: 1.5, 리자몽: 1.6, 루카리오: 1.4,
  이브이: 1.4, 에브이: 1.4, 님피아: 1.3, 리피아: 1.2, 쥬피썬더: 1.2,
  가디안: 1.3, 레쿠쟈: 1.5, 가이오가: 1.3, 그란돈: 1.3,
  코라이돈: 1.3, 미라이돈: 1.3, 잠만보: 1.2, 마기라스: 1.2,
  레시라무: 1.2, 제크로무: 1.2, 큐레무: 1.2, 메타그로스: 1.1,
};

export function popularityOf(name: string): number {
  return POPULARITY[name] ?? 1;
}

export function estimateTp(tag: Tag): number {
  return round1(RARITY_BASE_TP[tag.rarity] * popularityOf(tag.name));
}

export function tpFromKrw(krw: number): number {
  return round1(krw / KRW_PER_TP);
}

/**
 * 태그마다 거래점수를 확정한다.
 * 실거래 중앙값이 있으면 그것이 진실이고, 없으면 산식 추정에 '추정치' 표시를 단다.
 */
export function buildScores(tags: Tag[], prices: Map<string, PriceStat>): TagScore[] {
  return tags.map((tag) => {
    const stat = prices.get(tag.no);
    const enoughSamples = (stat?.samples ?? 0) >= MIN_SAMPLES_BY_RARITY[tag.rarity];

    if (stat?.median != null && enoughSamples) {
      const tp = clampTp(tag.rarity, tpFromKrw(stat.median));
      return {
        no: tag.no,
        tp,
        confidence: 'market' as const,
        priceKrw: tpToKrw(tp),
        samples: stat.samples,
      };
    }
    return {
      no: tag.no,
      tp: estimateTp(tag),
      confidence: 'estimated' as const,
      priceKrw: null,
      samples: stat?.samples ?? 0,
    };
  });
}

/** 거래점수를 다시 원화로 (화면 표시용) */
export function tpToKrw(tp: number): number {
  return Math.round((tp * KRW_PER_TP) / 100) * 100;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
