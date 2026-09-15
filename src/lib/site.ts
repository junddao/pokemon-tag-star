/** 배포 위치. 빌드할 때 주입하고, 없으면 로컬을 가리킨다. */
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
export const CANONICAL = SITE_URL + BASE_PATH;

/** public/ 안의 파일을 basePath 를 붙여 가리킨다. */
export function asset(path: string): string {
  return BASE_PATH + path;
}
