import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * 모바일 손가락 조작에 대한 규칙 두 가지를 소스에서 확인한다.
 *
 * 1) 아이콘만 든 정사각 버튼은 눈에 보이는 크기가 곧 터치 영역이다.
 *    24px 짜리 +/- 는 어린이 손가락으로는 거의 못 누른다. Apple 권장치인 44px 을 모바일 기준으로 둔다.
 * 2) 바텀시트가 열리자마자 입력창에 포커스를 주면 키보드가 목록을 덮는다.
 *    물리 키보드가 있는 환경에서만 자동 포커스한다.
 */

const SRC = join(process.cwd(), 'src');

/** Tailwind 의 h-11 = 44px. 한 칸은 4px 이다. */
const MIN_TAP_STEPS = 11;

function tsxFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const path = join(dir, e.name);
    if (e.isDirectory()) return tsxFiles(path);
    return e.name.endsWith('.tsx') ? [path] : [];
  });
}

/** 여는 <button 태그마다 className 문자열을 뽑는다 */
function buttonClasses(source: string): string[] {
  const found: string[] = [];
  let from = 0;
  for (;;) {
    const at = source.indexOf('<button', from);
    if (at === -1) break;
    from = at + 7;
    const match = /className={?[`"]([^`"]*)[`"]/.exec(source.slice(at, at + 1200));
    if (match) found.push(match[1]);
  }
  return found;
}

/** 프리픽스 없는(=모바일) 정사각 크기를 찾는다. 높이와 너비가 같을 때만 아이콘 버튼으로 본다. */
function mobileSquareSize(className: string): number | undefined {
  const plain = className.split(/\s+/).filter((c) => !c.includes(':'));
  const h = plain.find((c) => /^h-\d+$/.test(c));
  const w = plain.find((c) => /^w-\d+$/.test(c));
  if (!h || !w) return undefined;
  const hn = Number(h.slice(2));
  const wn = Number(w.slice(2));
  return hn === wn ? hn : undefined;
}

describe('모바일 터치 영역', () => {
  it.each(tsxFiles(SRC))('%s 의 아이콘 버튼은 모바일에서 44px 이상이다', (file) => {
    for (const className of buttonClasses(readFileSync(file, 'utf8'))) {
      const size = mobileSquareSize(className);
      if (size === undefined) continue; // 정사각 아이콘 버튼이 아니면 이 규칙의 대상이 아니다
      expect(
        size >= MIN_TAP_STEPS,
        `아이콘 버튼이 모바일에서 ${size * 4}px 이라 누르기 어렵다. ` +
          `h-11 w-11 을 기본으로 두고 데스크톱 크기는 sm: 프리픽스로 줄일 것.`,
      ).toBe(true);
    }
  });
});

describe('바텀시트 자동 포커스', () => {
  const picker = readFileSync(join(SRC, 'components/TagPicker.tsx'), 'utf8');

  it('물리 키보드가 있을 때만 포커스한다', () => {
    expect(picker).toMatch(/pointer:\s*fine/);
  });

  it('포커스 호출이 조건 없이 실행되지 않는다', () => {
    const focusLines = picker.split('\n').filter((l) => l.includes('.focus()'));
    expect(focusLines.length).toBeGreaterThan(0);
    for (const line of focusLines) {
      expect(line, `"${line.trim()}" 이 무조건 실행된다`).toMatch(/matches/);
    }
  });
});
