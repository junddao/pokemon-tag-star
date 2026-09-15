'use client';

import { useCallback, useEffect, useState } from 'react';

/**
 * 트레이드 바구니와 보유 목록은 이 기기의 브라우저에만 저장한다.
 * 어린이가 주 사용자라 개인정보를 서버로 보내지 않는 것이 설계 전제다.
 */
export type Basket = Record<string, number>;
export interface TradeState {
  mine: Basket;
  theirs: Basket;
}

const TRADE_KEY = 'pokestar:trade';
const OWNED_KEY = 'pokestar:owned';
const EVENT = 'pokestar:store-change';

const EMPTY_TRADE: TradeState = { mine: {}, theirs: {} };

function read<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? ({ ...fallback, ...JSON.parse(raw) } as T) : fallback;
  } catch {
    // 시크릿 모드나 저장소 차단 상태에서도 화면은 정상 동작해야 한다
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* 저장에 실패해도 현재 세션은 계속 쓸 수 있다 */
  }
  window.dispatchEvent(new CustomEvent(EVENT));
}

function useStoredValue<T>(key: string, fallback: T): [T, (next: T) => void] {
  // 서버 렌더 결과와 어긋나지 않도록 첫 렌더는 항상 fallback 으로 그린다
  const [value, setValue] = useState<T>(fallback);

  useEffect(() => {
    const sync = () => setValue(read(key, fallback));
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const update = useCallback((next: T) => {
    setValue(next);
    write(key, next);
  }, [key]);

  return [value, update];
}

export type Side = 'mine' | 'theirs';

export function useTrade() {
  const [trade, setTrade] = useStoredValue<TradeState>(TRADE_KEY, EMPTY_TRADE);

  const add = useCallback((side: Side, no: string, delta = 1) => {
    setTrade(applyDelta(trade, side, no, delta));
  }, [trade, setTrade]);

  const remove = useCallback((side: Side, no: string) => {
    const next = { ...trade, [side]: { ...trade[side] } };
    delete next[side][no];
    setTrade(next);
  }, [trade, setTrade]);

  const clear = useCallback(() => setTrade(EMPTY_TRADE), [setTrade]);

  return { trade, add, remove, clear };
}

export function applyDelta(state: TradeState, side: Side, no: string, delta: number): TradeState {
  const basket = { ...state[side] };
  const next = (basket[no] ?? 0) + delta;
  if (next <= 0) delete basket[no];
  else basket[no] = Math.min(next, 99);
  return { ...state, [side]: basket };
}

export function useOwned() {
  const [owned, setOwned] = useStoredValue<Basket>(OWNED_KEY, {});

  const toggle = useCallback((no: string) => {
    const next = { ...owned };
    if (next[no]) delete next[no];
    else next[no] = 1;
    setOwned(next);
  }, [owned, setOwned]);

  const setQty = useCallback((no: string, qty: number) => {
    const next = { ...owned };
    if (qty <= 0) delete next[no];
    else next[no] = Math.min(qty, 99);
    setOwned(next);
  }, [owned, setOwned]);

  return { owned, toggle, setQty };
}

export function basketCount(basket: Basket): number {
  return Object.values(basket).reduce((a, b) => a + b, 0);
}
