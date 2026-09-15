import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // 이미지는 public/tags 에 내려받아 쓰는 것이 기본이다.
    // 내려받기가 실패한 태그만 공식 서버로 폴백하도록 열어둔다 — 화면이 깨지는 것보다 낫다.
    remotePatterns: [
      { protocol: 'https', hostname: 'pokemontagstar.co.kr', pathname: '/data/**' },
    ],
  },
};

export default nextConfig;
