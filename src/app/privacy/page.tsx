import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: '개인정보처리방침',
  description: '태그스타 도감이 수집하는 방문 통계와 쿠키, 기기에만 저장되는 정보, 수집 거부 방법을 안내합니다.',
  alternates: { canonical: '/privacy/' },
  robots: { index: true, follow: true },
};

const SECTIONS = [
  {
    title: '무엇을 수집하나요',
    body: [
      '이 사이트는 방문 통계를 보기 위해 Google Firebase(Google Analytics 4)를 씁니다. 이때 브라우저에 쿠키가 저장되고, 어떤 페이지를 열었는지·기기와 브라우저 종류·접속 국가와 대략적 지역·유입 경로가 Google 서버로 전송됩니다.',
      '기능이 실제로 쓰이는지 보려고 다음 세 가지 행동도 함께 기록합니다. 태그 상세 페이지 열람(태그 번호·등급), 트레이드 계산 실행(양쪽 장수·판정 결과), 내 주변 찾기 버튼의 위치 권한 허용 여부.',
      '이름·연락처·계정처럼 개인을 특정할 수 있는 정보는 받지도, 요구하지도 않습니다. 로그인 기능이 없습니다.',
    ],
  },
  {
    title: '내 위치는 어떻게 되나요',
    body: [
      '지도에서 "내 주변 찾기"를 누르면 브라우저가 위치 권한을 묻습니다. 허용한 좌표는 가까운 매장을 계산하는 데에만 쓰이고 브라우저 안에서 처리되며, 어디로도 전송하거나 저장하지 않습니다.',
      '통계로 남는 것은 좌표가 아니라 "허용했는지 거부했는지"뿐입니다.',
    ],
  },
  {
    title: '기기에만 남는 정보',
    body: [
      '보유 태그와 트레이드 목록은 브라우저의 로컬 저장소(pokestar:owned, pokestar:trade)에 저장됩니다. 이 값은 사용자의 기기를 떠나지 않으며, 브라우저 데이터를 지우면 함께 사라집니다.',
    ],
  },
  {
    title: '수집을 거부하려면',
    body: [
      '브라우저 설정에서 쿠키를 차단하거나, 추적 차단 기능·확장 프로그램을 쓰면 통계 수집이 이루어지지 않습니다. 이 경우에도 도감·시세·계산기·지도 기능은 그대로 동작합니다.',
      'Google이 제공하는 차단 도구를 쓰려면 Google Analytics 옵트아웃 브라우저 부가기능을 설치하면 됩니다.',
    ],
  },
  {
    title: '보관과 제공',
    body: [
      '수집된 통계는 Google Analytics에 쌓이며 Google의 보관 정책에 따라 처리됩니다. 운영자는 집계된 통계 화면만 열람합니다.',
      '통계를 제3자에게 판매하거나 광고 목적으로 제공하지 않습니다. 데이터 처리는 Google에 위탁되며, 자세한 내용은 Google 개인정보처리방침을 따릅니다.',
    ],
  },
];

export default function PrivacyPage() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">개인정보처리방침</h1>
      <p className="mt-2 text-sm text-violet-200/55">
        비공식 팬사이트이며 회원 가입이나 로그인 없이 이용할 수 있습니다.
      </p>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-base font-bold text-violet-100">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph} className="mt-2 text-sm leading-relaxed text-violet-200/70">
                {paragraph}
              </p>
            ))}
          </section>
        ))}

        <section>
          <h2 className="text-base font-bold text-violet-100">문의</h2>
          <p className="mt-2 text-sm leading-relaxed text-violet-200/70">
            이 방침에 관한 문의나 삭제 요청은{' '}
            <a
              href="https://github.com/junddao/pokemon-tag-star/issues"
              className="underline hover:text-violet-200"
              target="_blank"
              rel="noreferrer noopener"
            >
              GitHub 저장소 이슈
            </a>
            로 남겨 주세요.
          </p>
        </section>
      </div>
    </article>
  );
}
