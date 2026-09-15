import type { Tag, TagScore } from './types.ts';
import { ANCHOR_RARITY } from './rarity.ts';

export interface TradeEntry {
  tag: Tag;
  score: TagScore;
  qty: number;
}

export type Verdict = 'big-loss' | 'loss' | 'fair' | 'gain' | 'big-gain';

export interface TradeWarning {
  kind: 'ladder' | 'padding' | 'estimated';
  message: string;
}

export interface TradeResult {
  /** 내가 내주는 쪽의 합계 */
  myTp: number;
  /** 내가 받는 쪽의 합계 */
  theirTp: number;
  diff: number;
  ratio: number;
  verdict: Verdict;
  verdictLabel: string;
  warnings: TradeWarning[];
}

const VERDICT_LABEL: Record<Verdict, string> = {
  'big-loss': '크게 손해',
  loss: '약간 손해',
  fair: '공정',
  gain: '약간 이득',
  'big-gain': '크게 이득',
};

export function sumTp(entries: TradeEntry[]): number {
  return round1(entries.reduce((acc, e) => acc + e.score.tp * e.qty, 0));
}

export function countItems(entries: TradeEntry[]): number {
  return entries.reduce((acc, e) => acc + e.qty, 0);
}

export function topRarity(entries: TradeEntry[]): number {
  return entries.reduce((acc, e) => Math.max(acc, e.tag.rarity), 0);
}

export function classify(ratio: number): Verdict {
  if (ratio >= 0.25) return 'big-gain';
  if (ratio >= 0.08) return 'gain';
  if (ratio > -0.08) return 'fair';
  if (ratio > -0.25) return 'loss';
  return 'big-loss';
}

/**
 * 트레이드를 판정한다.
 *
 * 합계 비교만으로는 거짓말이 된다. ★6은 ★5를 아무리 쌓아도 대체되지 않기 때문에
 * 점수가 맞아떨어져도 현실에서 성사되지 않는 조합을 따로 경고한다.
 */
export function evaluateTrade(mine: TradeEntry[], theirs: TradeEntry[]): TradeResult {
  const myTp = sumTp(mine);
  const theirTp = sumTp(theirs);
  const diff = round1(theirTp - myTp);
  const base = Math.max(myTp, theirTp, 1);
  const ratio = diff / base;

  const warnings: TradeWarning[] = [];
  const myTop = topRarity(mine);
  const theirTop = topRarity(theirs);

  if (theirTop >= ANCHOR_RARITY && myTop < ANCHOR_RARITY && mine.length > 0) {
    warnings.push({
      kind: 'ladder',
      message: `상대는 ★${theirTop}을 내놓는데 내 쪽 최고는 ${rarityText(myTop)}이야. `
        + '점수가 맞아도 ★6은 보통 ★6으로만 바뀌어서, 이 조합은 거절당할 가능성이 높아.',
    });
  }
  if (myTop >= ANCHOR_RARITY && theirTop < ANCHOR_RARITY && theirs.length > 0) {
    warnings.push({
      kind: 'ladder',
      message: `내가 ★${myTop}을 내놓는데 상대 최고는 ${rarityText(theirTop)}이야. `
        + '점수가 맞더라도 ★6을 내주는 쪽이 아쉬운 거래가 되기 쉬워.',
    });
  }

  const myCount = countItems(mine);
  const theirCount = countItems(theirs);
  if (myCount >= theirCount * 3 && myCount >= 5) {
    warnings.push({
      kind: 'padding',
      message: `내 쪽만 ${myCount}장이야. 장수로 맞추는 거래는 점수가 같아도 잘 성사되지 않아.`,
    });
  } else if (theirCount >= myCount * 3 && theirCount >= 5) {
    warnings.push({
      kind: 'padding',
      message: `상대가 ${theirCount}장을 얹었어. 낮은 등급을 잔뜩 받는 거래가 아닌지 확인해봐.`,
    });
  }

  const estimated = [...mine, ...theirs].filter((e) => e.score.confidence === 'estimated');
  if (estimated.length > 0) {
    warnings.push({
      kind: 'estimated',
      message: `${estimated.length}장은 실거래 시세가 없어서 추정치로 계산했어. 판정이 정확하지 않을 수 있어.`,
    });
  }

  const verdict = classify(ratio);
  return { myTp, theirTp, diff, ratio, verdict, verdictLabel: VERDICT_LABEL[verdict], warnings };
}

/**
 * 모자란 점수를 가장 가깝게 메우는 조합을 내 보유 목록에서 찾는다.
 * 초과 지불을 최소화하는 것이 목표라 탐욕법 대신 작은 DP를 쓴다.
 */
export function suggestAdditions(
  pool: TradeEntry[],
  deficit: number,
  maxItems = 4,
): TradeEntry[] {
  if (deficit <= 0 || pool.length === 0) return [];

  // 0.1TP 단위 정수로 바꿔 DP를 돌린다.
  const UNIT = 10;
  const target = Math.round(deficit * UNIT);
  const cap = Math.min(target * 2 + 1, 20_000);

  const items = pool
    .flatMap((e) => Array.from({ length: Math.min(e.qty, maxItems) }, () => e))
    .filter((e) => e.score.tp > 0)
    .slice(0, 80);

  // reach[k][s] = k장으로 합계 s 를 만들 때 마지막으로 쓴 아이템 인덱스
  const reach: (number | null)[][] = Array.from({ length: maxItems + 1 }, () => Array(cap + 1).fill(null));
  const used: Set<number>[][] = Array.from({ length: maxItems + 1 }, () => Array(cap + 1).fill(null as never));
  reach[0][0] = -1;
  used[0][0] = new Set();

  for (let k = 0; k < maxItems; k++) {
    for (let s = 0; s <= cap; s++) {
      if (reach[k][s] === null) continue;
      for (let i = 0; i < items.length; i++) {
        if (used[k][s].has(i)) continue;
        const ns = s + Math.round(items[i].score.tp * UNIT);
        if (ns > cap) continue;
        if (reach[k + 1][ns] !== null) continue;
        reach[k + 1][ns] = i;
        used[k + 1][ns] = new Set(used[k][s]).add(i);
      }
    }
  }

  // 목적은 "부족분을 채우는 것"이다. 모자란 조합은 문제를 해결하지 못하므로
  // 목표를 넘기는 조합을 먼저 보고, 그중 가장 덜 얹는 것을 고른다.
  // 아무 조합도 목표에 못 미치면 그때만 가장 가까운 아래 조합을 쓴다.
  let over: { k: number; s: number } | null = null;
  let under: { k: number; s: number } | null = null;

  for (let k = 1; k <= maxItems; k++) {
    for (let s = 1; s <= cap; s++) {
      if (reach[k][s] === null) continue;
      if (s >= target) {
        if (!over || s < over.s || (s === over.s && k < over.k)) over = { k, s };
      } else if (!under || s > under.s || (s === under.s && k < under.k)) {
        under = { k, s };
      }
    }
  }

  const best = over ?? under;
  if (!best) return [];

  const chosen = [...used[best.k][best.s]].map((i) => items[i]);
  return mergeByNo(chosen);
}

function mergeByNo(entries: TradeEntry[]): TradeEntry[] {
  const map = new Map<string, TradeEntry>();
  for (const e of entries) {
    const hit = map.get(e.tag.no);
    if (hit) hit.qty += 1;
    else map.set(e.tag.no, { ...e, qty: 1 });
  }
  return [...map.values()];
}

function rarityText(r: number): string {
  return r === 0 ? '레귤러' : `★${r}`;
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
