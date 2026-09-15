'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';

const MAX_TILT = 16; // deg

/** 이 기기가 자이로를 줄 수 있는지 — 렌더 중에 바뀌지 않는 성질 */
type GyroCapability = 'none' | 'direct' | 'needs-permission';
/** 사용자가 권한을 어떻게 했는지 — 버튼을 눌러야 바뀐다 */
type GyroPermission = 'idle' | 'granted' | 'denied';

const NO_SUBSCRIBE = () => () => {};

function readGyroCapability(): GyroCapability {
  if (!('DeviceOrientationEvent' in window)) return 'none';
  // 마우스가 있는 기기에서는 포인터 입력이 더 정확하다
  if (!window.matchMedia('(pointer: coarse)').matches) return 'none';
  const request = (DeviceOrientationEvent as unknown as { requestPermission?: unknown }).requestPermission;
  return typeof request === 'function' ? 'needs-permission' : 'direct';
}

interface Props {
  front: string;
  back?: string | null;
  alt: string;
  /** 목록에서 쓸 때처럼 상호작용 없이 정적으로만 보여줄 때 */
  priority?: boolean;
}

/**
 * 기울이면 무지개 결이 움직이는 태그 뷰어.
 *
 * 마우스/자이로 입력마다 리렌더하면 프레임이 무너지므로,
 * 각도는 React state 가 아니라 CSS 변수로 직접 쓴다.
 */
export default function PrismTag({ front, back, alt, priority }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [flipped, setFlipped] = useState(false);
  const [permission, setPermission] = useState<GyroPermission>('idle');

  // 서버 렌더에서는 항상 'none'. 기기 성질을 읽는 데 이펙트와 setState 를 쓰지 않는다.
  const capability = useSyncExternalStore<GyroCapability>(NO_SUBSCRIBE, readGyroCapability, () => 'none');
  const gyroActive = capability === 'direct' || permission === 'granted';

  const apply = useCallback((nx: number, ny: number) => {
    const card = cardRef.current;
    if (!card) return;
    const clamp = (v: number) => Math.max(-1, Math.min(1, v));
    const x = clamp(nx);
    const y = clamp(ny);

    card.style.transform = `rotateY(${x * MAX_TILT}deg) rotateX(${-y * MAX_TILT}deg)`;

    const s = card.style;
    s.setProperty('--glare-x', `${50 + x * 45}%`);
    s.setProperty('--glare-y', `${50 + y * 45}%`);
    s.setProperty('--glare-strength', String(0.32 + Math.hypot(x, y) * 0.42));
    s.setProperty('--holo-x', `${50 + x * 55}%`);
    s.setProperty('--holo-y', `${50 + y * 55}%`);
    s.setProperty('--holo-angle', `${105 + x * 40}deg`);
    s.setProperty('--holo-strength', String(0.22 + Math.hypot(x, y) * 0.5));
  }, []);

  const settle = useCallback(() => {
    const card = cardRef.current;
    if (!card) return;
    card.classList.add('is-settling');
    apply(0, 0);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => card.classList.remove('is-settling'), 620);
  }, [apply]);

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (gyroActive) return; // 자이로가 잡고 있으면 포인터는 무시
      const box = stageRef.current?.getBoundingClientRect();
      if (!box) return;
      apply(((e.clientX - box.left) / box.width) * 2 - 1, ((e.clientY - box.top) / box.height) * 2 - 1);
    },
    [apply, gyroActive],
  );

  // 모바일 자이로. iOS 13+ 는 사용자 제스처 안에서 권한을 요청해야 한다.
  useEffect(() => {
    if (!gyroActive) return;
    let base: { beta: number; gamma: number } | null = null;

    const onOrient = (e: DeviceOrientationEvent) => {
      if (e.beta == null || e.gamma == null) return;
      // 첫 자세를 기준점으로 삼아, 폰을 어떻게 들고 있든 중앙에서 시작한다
      base ??= { beta: e.beta, gamma: e.gamma };
      apply((e.gamma - base.gamma) / 30, (e.beta - base.beta) / 30);
    };

    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [gyroActive, apply]);

  const requestGyro = useCallback(async () => {
    const ctor = DeviceOrientationEvent as unknown as { requestPermission?: () => Promise<string> };
    try {
      const res = await ctor.requestPermission?.();
      setPermission(res === 'granted' ? 'granted' : 'denied');
    } catch {
      setPermission('denied');
    }
  }, []);

  const canFlip = Boolean(back);

  return (
    <div className="w-full">
      <div
        ref={stageRef}
        className="prism-stage w-full select-none"
        onPointerMove={onPointerMove}
        onPointerLeave={settle}
      >
        <div
          ref={cardRef}
          className="prism-card mx-auto w-full"
          style={{ maxWidth: 520 }}
        >
          <button
            type="button"
            onClick={() => canFlip && setFlipped((v) => !v)}
            aria-label={canFlip ? '태그 뒤집기' : alt}
            className={`prism-flipper block w-full ${flipped ? 'is-flipped' : ''} ${canFlip ? 'cursor-pointer' : 'cursor-default'}`}
            style={{ aspectRatio: '300 / 169' }}
          >
            <div className="prism-side">
              <Face src={front} alt={alt} priority={priority} />
            </div>
            {back && (
              <div className="prism-side prism-side-back">
                <Face src={back} alt={`${alt} 뒷면`} />
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-violet-200/60">
        {capability === 'needs-permission' && permission === 'idle' && (
          <button
            type="button"
            onClick={requestGyro}
            className="rounded-full border border-violet-300/40 bg-violet-400/10 px-4 py-2 font-semibold text-violet-100 transition active:scale-95"
          >
            기울여보기 켜기
          </button>
        )}
        {gyroActive && <span>폰을 기울여보세요</span>}
        {permission === 'denied' && <span>센서 권한이 꺼져 있어요. 손가락으로 문질러도 움직여요.</span>}
        {capability === 'none' && <span>마우스를 올려 기울여보세요</span>}
        {canFlip && <span className="text-violet-200/40">· 탭하면 뒤집혀요</span>}
      </div>
    </div>
  );
}

function Face({ src, alt, priority }: { src: string; alt: string; priority?: boolean }) {
  return (
    <div className="prism-face h-full w-full bg-[#0c0a1a] ring-1 ring-white/15">
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 640px) 92vw, 520px"
        className="object-contain"
      />
      <div className="prism-pattern" />
      <div className="prism-glare" />
    </div>
  );
}
