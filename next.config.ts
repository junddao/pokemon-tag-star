import type { NextConfig } from 'next';

/**
 * GitHub Pages 는 사용자 페이지가 아닌 이상 /<레포명> 하위에 붙는다.
 * 로컬 개발에서는 빈 값이라 주소가 / 로 유지된다.
 */
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

const nextConfig: NextConfig = {
  // 전 페이지가 정적이라 서버 없이 그대로 올릴 수 있다.
  output: 'export',
  basePath,
  assetPrefix: basePath || undefined,
  // Pages 에는 이미지 최적화 서버가 없다. 원본이 300x169 라 최적화가 없어도 가볍다.
  images: { unoptimized: true },
  // /dex/index.html 형태로 떨어져야 Pages 가 경로를 그대로 서빙한다.
  trailingSlash: true,
};

export default nextConfig;
