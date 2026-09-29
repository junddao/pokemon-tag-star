'use client';

import { useEffect, useState } from 'react';
import { asset } from '@/lib/site';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export default function InstallApp() {
  const [promptEvent, setPromptEvent] = useState<InstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    const syncInstalled = () => setInstalled(window.matchMedia('(display-mode: standalone)').matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    const timer = window.setTimeout(syncInstalled, 0);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register(asset('/sw.js'), { scope: asset('/') }).catch(() => {});
    }
    const onPrompt = (event: Event) => {
      event.preventDefault();
      setPromptEvent(event as InstallPromptEvent);
    };
    const onInstalled = () => { setInstalled(true); setShowGuide(false); };
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (!promptEvent) { setShowGuide(true); return; }
    await promptEvent.prompt();
    const choice = await promptEvent.userChoice;
    setPromptEvent(null);
    if (choice.outcome === 'accepted') setShowGuide(false);
  };

  return (
    <div className="mx-auto mt-6 max-w-md rounded-2xl border border-amber-300/25 bg-amber-300/[0.07] p-4 text-left sm:p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden="true" className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 via-fuchsia-400 to-sky-400 text-2xl font-black text-[#07060f]">★</span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-white">휴대폰 홈 화면에 추가</p>
          <p className="mt-0.5 text-xs text-violet-200/65">아이콘을 눌러 태그스타 도감을 바로 열어요.</p>
        </div>
      </div>
      <button type="button" onClick={install} className="mt-3 w-full rounded-xl bg-amber-300 px-4 py-2.5 text-sm font-extrabold text-[#171123] transition hover:bg-amber-200">
        홈 화면에 설치하기
      </button>
      {showGuide && (
        <p role="status" className="mt-3 text-xs leading-relaxed text-violet-100/85">
          {/iPad|iPhone|iPod/.test(navigator.userAgent)
            ? 'Safari에서 공유 버튼을 누른 뒤 ‘홈 화면에 추가’를 선택하세요.'
            : '브라우저 메뉴에서 ‘앱 설치’ 또는 ‘홈 화면에 추가’를 선택하세요.'}
        </p>
      )}
    </div>
  );
}
