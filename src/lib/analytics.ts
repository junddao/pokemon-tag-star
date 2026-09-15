import type { Verdict } from './trade';

/**
 * 화면과 firebase 사이의 얇은 층.
 *
 * 화면은 여기만 부르고, firebase 는 instrumentation-client 가 나중에 붙인다.
 * 분석이 없거나 막혀도 화면은 그대로 굴러가야 하므로 이 파일은 절대 예외를 올리지 않는다.
 */

export type EventParams = Record<string, string | number>;
export type Sink = (name: string, params?: EventParams) => void;

/** firebase 가 붙기 전에 찍힌 이벤트를 담아 두는 한도. 넘치면 오래된 것을 버린다. */
const BUFFER_LIMIT = 20;

let sink: Sink | null = null;
let buffer: { name: string; params?: EventParams }[] = [];

function send(name: string, params?: EventParams): void {
  if (!sink) return;
  try {
    sink(name, params);
  } catch {
    // 광고차단기·쿠키 차단·오프라인 — 어느 쪽이든 화면이 멈출 이유는 없다
  }
}

/** instrumentation-client 가 firebase 를 띄운 뒤 호출한다. 그동안 쌓인 것을 순서대로 흘려보낸다. */
export function setSink(next: Sink | null): void {
  sink = next;
  if (!sink) return;
  const pending = buffer;
  buffer = [];
  for (const event of pending) send(event.name, event.params);
}

export function track(name: string, params?: EventParams): void {
  if (sink) return send(name, params);
  buffer.push({ name, params });
  if (buffer.length > BUFFER_LIMIT) buffer.shift();
}

/** 테스트용 초기화. */
export function resetAnalytics(): void {
  sink = null;
  buffer = [];
}

export type FirebaseConfig = {
  apiKey: string;
  projectId: string;
  appId: string;
  measurementId: string;
};

/** 분석에 필요한 최소 키. 넷 중 하나라도 비면 초기화를 아예 건너뛴다. */
const CONFIG_KEYS = {
  apiKey: 'NEXT_PUBLIC_FIREBASE_API_KEY',
  projectId: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  appId: 'NEXT_PUBLIC_FIREBASE_APP_ID',
  measurementId: 'NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID',
} as const;

export function readFirebaseConfig(env: Record<string, string | undefined>): FirebaseConfig | null {
  const config = {} as FirebaseConfig;
  for (const [field, envName] of Object.entries(CONFIG_KEYS) as [keyof FirebaseConfig, string][]) {
    const value = env[envName]?.trim();
    if (!value) return null;
    config[field] = value;
  }
  return config;
}

export function tagViewed(tag: { no: string; rarity: number }): void {
  track('tag_view', { tag_no: tag.no, rarity: tag.rarity });
}

export function tradeEvaluated(input: { mineCount: number; theirsCount: number; verdict: Verdict }): void {
  track('trade_calculate', {
    mine_count: input.mineCount,
    theirs_count: input.theirsCount,
    verdict: input.verdict,
  });
}

export type LocateResult = 'ready' | 'denied' | 'unsupported';

export function locateRequested(result: LocateResult): void {
  track('map_locate', { result });
}

/**
 * 트레이드는 담을 때마다 다시 계산되므로, 같은 구성을 여러 번 보내지 않기 위한 서명.
 * 양쪽이 다 차 있을 때만 "계산했다"고 본다 — 한쪽만 담긴 중간 상태는 결과가 아니다.
 */
export function tradeSignature(input: {
  mine: Record<string, number>;
  theirs: Record<string, number>;
  verdict: Verdict;
}): string | null {
  const side = (basket: Record<string, number>) =>
    Object.entries(basket)
      .filter(([, qty]) => qty > 0)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([no, qty]) => `${no}x${qty}`)
      .join(',');

  const mine = side(input.mine);
  const theirs = side(input.theirs);
  if (!mine || !theirs) return null;
  return `${mine}|${theirs}|${input.verdict}`;
}
