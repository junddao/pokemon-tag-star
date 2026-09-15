'use client';

import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import L from 'leaflet';
import 'leaflet.markercluster';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatDistance, nearest, type PlaceWithDistance } from '@/lib/geo';
import type { Place } from '@/lib/types';

const KOREA_CENTER: [number, number] = [36.5, 127.8];

type Status = 'idle' | 'locating' | 'ready' | 'denied';

export default function PlaceMapInner({ places }: { places: Place[] }) {
  const holder = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const clusterRef = useRef<L.MarkerClusterGroup | null>(null);
  const meRef = useRef<L.CircleMarker | null>(null);

  const [status, setStatus] = useState<Status>('idle');
  const [me, setMe] = useState<{ lat: number; lng: number } | null>(null);
  const [region, setRegion] = useState<string>('전체');

  const regions = useMemo(
    () => ['전체', ...[...new Set(places.map((p) => p.region))].sort((a, b) => a.localeCompare(b, 'ko'))],
    [places],
  );

  const shown = useMemo(
    () => (region === '전체' ? places : places.filter((p) => p.region === region)),
    [places, region],
  );

  const list: PlaceWithDistance[] = useMemo(() => {
    if (me) return nearest(shown, me.lat, me.lng, 40);
    return shown.slice(0, 40).map((p) => ({ ...p, distanceKm: Number.NaN }));
  }, [shown, me]);

  // 지도 생성은 한 번만
  useEffect(() => {
    if (!holder.current || mapRef.current) return;
    const map = L.map(holder.current, { zoomControl: true, attributionControl: true })
      .setView(KOREA_CENTER, 7);

    // 키가 필요 없는 OSM 표준 타일을 쓰고, 어두운 화면에 맞게 CSS 로 반전시킨다.
    // (다크 전용 타일 서비스는 대부분 API 키를 요구한다)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(map);

    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // 마커는 필터가 바뀔 때마다 갈아끼운다
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    clusterRef.current?.remove();
    const cluster = L.markerClusterGroup({
      maxClusterRadius: 48,
      iconCreateFunction: (c) => {
        const n = c.getChildCount();
        const size = n < 10 ? 34 : n < 50 ? 42 : 50;
        return L.divIcon({
          html: `<div class="tag-cluster" style="width:${size}px;height:${size}px;font-size:${size / 3}px">${n}</div>`,
          className: '',
          iconSize: [size, size],
        });
      },
    });

    for (const p of shown) {
      L.marker([p.lat, p.lng], { icon: pinIcon, title: p.name })
        .bindPopup(popupHtml(p))
        .addTo(cluster);
    }
    cluster.addTo(map);
    clusterRef.current = cluster;

    if (!me && shown.length > 0 && region !== '전체') {
      map.fitBounds(cluster.getBounds(), { padding: [40, 40] });
    }
  }, [shown, region, me]);

  // 내 위치 표시
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !me) return;
    meRef.current?.remove();
    meRef.current = L.circleMarker([me.lat, me.lng], {
      radius: 8, color: '#a78bfa', fillColor: '#8b5cf6', fillOpacity: 0.95, weight: 3,
    }).addTo(map).bindTooltip('내 위치');
    map.setView([me.lat, me.lng], 12);
  }, [me]);

  const locate = () => {
    if (!('geolocation' in navigator)) return setStatus('denied');
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setMe({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setStatus('ready');
      },
      () => setStatus('denied'),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    );
  };

  const focus = (p: Place) => {
    mapRef.current?.setView([p.lat, p.lng], 16, { animate: true });
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
      <div className="order-2 lg:order-1 lg:max-h-[68dvh] lg:overflow-y-auto">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={locate}
            disabled={status === 'locating'}
            className="rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 px-4 py-2 text-xs font-extrabold text-white shadow-lg transition hover:brightness-110 disabled:opacity-60"
          >
            {status === 'locating' ? '위치 찾는 중…' : '📍 내 주변 찾기'}
          </button>
          <select
            value={region}
            onChange={(e) => setRegion(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white outline-none"
          >
            {regions.map((r) => <option key={r} value={r} className="bg-[#0c0a1a]">{r}</option>)}
          </select>
          <span className="text-xs tabular-nums text-violet-200/45">{shown.length}곳</span>
        </div>

        {status === 'denied' && (
          <p className="mb-3 rounded-xl bg-amber-300/10 px-3 py-2 text-[11px] leading-relaxed text-amber-100 ring-1 ring-inset ring-amber-300/25">
            위치 권한이 꺼져 있어요. 지역을 골라서 찾아보세요.
          </p>
        )}

        <ul className="space-y-1.5">
          {list.map((p) => (
            <li key={p.idx}>
              <button
                type="button"
                onClick={() => focus(p)}
                className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-left transition hover:border-violet-300/30 hover:bg-white/[0.07]"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="truncate text-sm font-bold text-white">{p.name}</span>
                  {Number.isFinite(p.distanceKm) && (
                    <span className="shrink-0 text-[11px] font-bold tabular-nums text-violet-300">
                      {formatDistance(p.distanceKm)}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[11px] text-violet-200/50">{p.address}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div
        ref={holder}
        className="order-1 h-[46dvh] w-full overflow-hidden rounded-2xl border border-white/10 lg:order-2 lg:h-[68dvh]"
      />
    </div>
  );
}

const pinIcon = L.divIcon({
  className: '',
  html: '<div style="width:14px;height:14px;border-radius:9999px;background:#f0abfc;border:2px solid #fff;box-shadow:0 0 12px -2px #e879f9"></div>',
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function popupHtml(p: Place): string {
  const kakao = `https://map.kakao.com/link/to/${encodeURIComponent(p.name)},${p.lat},${p.lng}`;
  const naver = `https://map.naver.com/p/search/${encodeURIComponent(p.name + ' ' + p.address)}`;
  return `
    <div style="min-width:190px">
      <strong style="display:block;font-size:13px">${escapeHtml(p.name)}</strong>
      <span style="display:block;margin-top:2px;font-size:11px;opacity:.7">${escapeHtml(p.address)}</span>
      <span style="display:flex;gap:8px;margin-top:8px;font-size:11px;font-weight:700">
        <a href="${kakao}" target="_blank" rel="noreferrer noopener" style="color:#fcd34d">카카오맵 길찾기</a>
        <a href="${naver}" target="_blank" rel="noreferrer noopener" style="color:#6ee7b7">네이버지도</a>
      </span>
    </div>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
