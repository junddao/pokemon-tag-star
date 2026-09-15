import { beforeEach, describe, expect, it } from 'vitest';
import {
  locateRequested,
  readFirebaseConfig,
  resetAnalytics,
  setSink,
  tagViewed,
  track,
  tradeEvaluated,
  tradeSignature,
} from '../src/lib/analytics.ts';

type Logged = { name: string; params?: Record<string, string | number> };

function recorder() {
  const seen: Logged[] = [];
  return { seen, sink: (name: string, params?: Record<string, string | number>) => seen.push({ name, params }) };
}

beforeEach(() => {
  resetAnalytics();
});

describe('전송 버퍼', () => {
  it('firebase 가 붙기 전에 찍힌 이벤트를 순서대로 몰아서 보낸다', () => {
    track('first');
    track('second', { tag_no: '001' });

    const { seen, sink } = recorder();
    setSink(sink);

    expect(seen).toEqual([
      { name: 'first', params: undefined },
      { name: 'second', params: { tag_no: '001' } },
    ]);
  });

  it('붙은 다음에는 바로 보낸다', () => {
    const { seen, sink } = recorder();
    setSink(sink);

    track('after', { result: 'ready' });

    expect(seen).toEqual([{ name: 'after', params: { result: 'ready' } }]);
  });

  it('firebase 가 끝까지 안 붙어도 버퍼가 무한히 자라지 않는다', () => {
    for (let i = 0; i < 100; i += 1) track(`e${i}`);

    const { seen, sink } = recorder();
    setSink(sink);

    expect(seen).toHaveLength(20);
    // 오래된 것을 버리고 최근 20개를 남긴다
    expect(seen[0].name).toBe('e80');
    expect(seen[19].name).toBe('e99');
  });

  it('전송이 터져도 화면 쪽으로 예외를 올리지 않는다', () => {
    setSink(() => {
      throw new Error('firebase 가 광고차단기에 막혔다');
    });

    expect(() => track('boom')).not.toThrow();
  });
});

describe('firebase 설정 읽기', () => {
  const full = {
    NEXT_PUBLIC_FIREBASE_API_KEY: 'key',
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'pokestar',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:2:web:3',
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-ABC123',
  };

  it('네 값이 모두 있을 때만 설정을 만든다', () => {
    expect(readFirebaseConfig(full)).toEqual({
      apiKey: 'key',
      projectId: 'pokestar',
      appId: '1:2:web:3',
      measurementId: 'G-ABC123',
    });
  });

  it('하나라도 비면 null 이라 로컬·테스트에서는 아무것도 초기화되지 않는다', () => {
    for (const key of Object.keys(full)) {
      const partial = { ...full, [key]: undefined };
      expect(readFirebaseConfig(partial), `${key} 없음`).toBeNull();
    }
    expect(readFirebaseConfig({})).toBeNull();
  });

  it('공백만 든 값은 없는 것으로 본다', () => {
    expect(readFirebaseConfig({ ...full, NEXT_PUBLIC_FIREBASE_APP_ID: '   ' })).toBeNull();
  });
});

describe('이벤트', () => {
  it('태그 상세 열람은 번호와 등급을 남긴다', () => {
    const { seen, sink } = recorder();
    setSink(sink);

    tagViewed({ no: '015', rarity: 6 });

    expect(seen).toEqual([{ name: 'tag_view', params: { tag_no: '015', rarity: 6 } }]);
  });

  it('트레이드 계산은 양쪽 장수와 판정을 남긴다', () => {
    const { seen, sink } = recorder();
    setSink(sink);

    tradeEvaluated({ mineCount: 3, theirsCount: 1, verdict: 'big-loss' });

    expect(seen).toEqual([
      { name: 'trade_calculate', params: { mine_count: 3, theirs_count: 1, verdict: 'big-loss' } },
    ]);
  });

  it('내 주변 찾기는 위치 허용 여부를 남긴다', () => {
    const { seen, sink } = recorder();
    setSink(sink);

    locateRequested('denied');

    expect(seen).toEqual([{ name: 'map_locate', params: { result: 'denied' } }]);
  });

  it('이벤트 이름이 GA4 한도(40자)를 넘지 않는다', () => {
    const { seen, sink } = recorder();
    setSink(sink);

    tagViewed({ no: '015', rarity: 6 });
    tradeEvaluated({ mineCount: 1, theirsCount: 1, verdict: 'fair' });
    locateRequested('ready');

    for (const { name } of seen) {
      expect(name.length, name).toBeLessThanOrEqual(40);
      expect(name, name).toMatch(/^[a-z][a-z0-9_]*$/);
    }
  });
});

describe('트레이드 중복 전송 방지', () => {
  it('담은 순서가 달라도 같은 구성이면 같은 서명이다', () => {
    const a = tradeSignature({ mine: { '001': 1, '002': 2 }, theirs: { '003': 1 }, verdict: 'fair' });
    const b = tradeSignature({ mine: { '002': 2, '001': 1 }, theirs: { '003': 1 }, verdict: 'fair' });

    expect(a).toBe(b);
  });

  it('장수나 판정이 바뀌면 서명이 달라진다', () => {
    const base = { mine: { '001': 1 }, theirs: { '003': 1 }, verdict: 'fair' as const };

    expect(tradeSignature({ ...base, mine: { '001': 2 } })).not.toBe(tradeSignature(base));
    expect(tradeSignature({ ...base, verdict: 'gain' })).not.toBe(tradeSignature(base));
  });

  it('양쪽이 다 비면 서명이 없어서 계산으로 치지 않는다', () => {
    expect(tradeSignature({ mine: {}, theirs: {}, verdict: 'fair' })).toBeNull();
  });

  it('한쪽만 담겨도 계산으로 치지 않는다', () => {
    expect(tradeSignature({ mine: { '001': 1 }, theirs: {}, verdict: 'big-loss' })).toBeNull();
  });
});
