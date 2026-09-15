import type { Tag } from './types.ts';

export const IMAGE_KINDS = ['thumb', 'front', 'back'] as const;

export function isLocal(src: string | null): src is string {
  return Boolean(src?.startsWith('/'));
}

/**
 * 이미 내려받아 둔 로컬 이미지 경로를 새로 긁은 태그에 이어붙인다.
 *
 * 공식 사이트를 다시 파싱하면 이미지 주소가 항상 원격 URL로 돌아온다.
 * 이 이어붙이기가 없으면 이미지 수집을 건너뛴 실행 한 번에
 * 화면의 모든 이미지가 공식 서버 직링크로 되돌아간다.
 */
export function reuseLocalImages(tags: Tag[], previous: Tag[]): void {
  const before = new Map(previous.map((t) => [t.no, t.images]));
  for (const tag of tags) {
    const old = before.get(tag.no);
    if (!old) continue;
    for (const kind of IMAGE_KINDS) {
      const previous = old[kind];
      if (isLocal(previous)) tag.images[kind] = previous;
    }
  }
}
