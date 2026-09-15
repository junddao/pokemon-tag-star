import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * iOS Safari 는 포커스된 입력 요소의 글자가 16px 보다 작으면 화면을 강제로 확대하고,
 * 포커스가 풀려도 배율을 되돌리지 않는다. 그래서 모바일에서 입력창을 한 번 누르면
 * 페이지 전체가 폰 화면을 넘어간 채로 남는다.
 *
 * 확대를 막는 maximum-scale 은 손가락 확대까지 죽여서 접근성을 해치므로,
 * 모바일 기준 글자 크기를 16px 이상으로 두는 쪽으로 해결한다.
 * (데스크톱은 sm: 이상에서 원래 크기로 되돌려도 안전하다.)
 */

const SRC = join(process.cwd(), 'src');
const FORM_TAGS = ['<input', '<select', '<textarea'];

/** 16px 이상이라 iOS 가 확대하지 않는 Tailwind 글자 크기 */
const SAFE_SIZES = new Set(['text-base', 'text-lg', 'text-xl', 'text-2xl', 'text-3xl']);

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return tsxFiles(path);
    return e.name.endsWith('.tsx') ? [path] : [];
  });
}

/** 파일 안의 모든 폼 요소에서 className 문자열을 뽑는다 */
function formControlClasses(source: string): { tag: string; className: string }[] {
  const found: { tag: string; className: string }[] = [];
  for (const tag of FORM_TAGS) {
    let from = 0;
    for (;;) {
      const at = source.indexOf(tag, from);
      if (at === -1) break;
      from = at + tag.length;
      // 여는 태그 안의 className 만 본다. 다음 형제 태그 전까지 훑으면 충분하다.
      const chunk = source.slice(at, at + 1200);
      const match = /className="([^"]*)"/.exec(chunk);
      if (match) found.push({ tag: tag.slice(1), className: match[1] });
    }
  }
  return found;
}

/** 모바일(프리픽스 없는) 글자 크기 토큰만 남긴다 */
function mobileTextSize(className: string): string | undefined {
  return className
    .split(/\s+/)
    .filter((c) => !c.includes(':'))
    .find((c) => c.startsWith('text-') && /^text-(xs|sm|base|lg|xl|\d|\[)/.test(c));
}

describe('모바일 입력 확대 방지', () => {
  const files = tsxFiles(SRC);

  it('스캔할 폼 요소를 실제로 찾는다', () => {
    const total = files.flatMap((f) => formControlClasses(readFileSync(f, 'utf8')));
    expect(total.length).toBeGreaterThan(0);
  });

  it.each(files)('%s 의 입력 요소는 모바일에서 16px 이상이다', (file) => {
    const controls = formControlClasses(readFileSync(file, 'utf8'));
    for (const { tag, className } of controls) {
      const size = mobileTextSize(className);
      expect(
        size !== undefined && SAFE_SIZES.has(size),
        `<${tag}> 의 모바일 글자 크기가 "${size ?? '지정 없음'}" 이라 iOS 가 화면을 확대한다. ` +
          `text-base 를 기본으로 두고 데스크톱 크기는 sm: 프리픽스로 지정할 것.`,
      ).toBe(true);
    }
  });
});
