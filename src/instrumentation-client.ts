import { readFirebaseConfig, setSink } from '@/lib/analytics';

/**
 * 앱 코드보다 먼저 실행되는 자리(Next 16 instrumentation-client).
 * 여기서 firebase 를 띄우고 analytics 래퍼에 전송 경로를 꽂아 준다.
 *
 * 환경변수는 `process.env.NEXT_PUBLIC_*` 를 그대로 써야 빌드 때 값이 박힌다.
 * 객체로 묶어 넘기거나 키를 변수로 돌려 읽으면 인라인되지 않고 undefined 가 된다.
 */
const config = readFirebaseConfig({
  NEXT_PUBLIC_FIREBASE_API_KEY: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  NEXT_PUBLIC_FIREBASE_APP_ID: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
});

/**
 * firebase 는 초기 렌더를 붙잡을 이유가 없으니 동적으로 불러온다.
 * 이 파일은 16ms 안에 끝나야 개발 서버가 경고하지 않는다.
 */
async function start(): Promise<void> {
  if (!config) return;

  try {
    const [{ initializeApp }, { getAnalytics, isSupported, logEvent }] = await Promise.all([
      import('firebase/app'),
      import('firebase/analytics'),
    ]);

    // 쿠키·indexedDB 가 막힌 브라우저에서는 false 다. 여기서 멈추면 래퍼는 계속 버퍼에만 쌓는다.
    if (!(await isSupported())) return;

    const analytics = getAnalytics(initializeApp(config));
    setSink((name, params) => logEvent(analytics, name, params));
  } catch {
    // 광고차단기가 스크립트를 끊는 경우가 가장 흔하다. 분석이 없다고 화면이 멈추면 안 된다.
  }
}

void start();
