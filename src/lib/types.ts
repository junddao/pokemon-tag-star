/** 레귤러태그는 0, 나머지는 별 개수 (2~6) */
export type Rarity = 0 | 2 | 3 | 4 | 5 | 6;

export interface Tag {
  /** "1-2-001" 또는 레귤러의 "R-1-1" */
  no: string;
  name: string;
  /** 탄 번호 (1탄, 2탄) */
  stage: number;
  stageLabel: string;
  rarity: Rarity;
  rarityLabel: string;
  /** 공식 사이트 stage_pop.php 의 idx */
  sourceIdx: number;
  /** thumb=목록 썸네일, front/back=상세 팝업의 앞뒤면 */
  images: { thumb: string; front: string | null; back: string | null };
}

export interface Place {
  idx: number;
  name: string;
  address: string;
  /** 주소 첫 토큰에서 뽑은 시/도 */
  region: string;
  lat: number;
  lng: number;
}

/** 태그 한 종류에 대한 중고 시세 관측 결과 */
export interface PriceStat {
  no: string;
  /** 표본이 모자라면 null */
  median: number | null;
  samples: number;
  min: number | null;
  max: number | null;
  observedAt: string;
}

export interface TagScore {
  no: string;
  /** 거래점수 */
  tp: number;
  /** market = 실거래 기반, estimated = 산식 추정 */
  confidence: 'market' | 'estimated';
  priceKrw: number | null;
  samples: number;
}

export interface ScrapeRun {
  startedAt: string;
  finishedAt: string;
  ok: boolean;
  tags: number;
  places: number;
  pricedTags: number;
  notes: string[];
}
