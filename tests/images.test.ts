import { describe, expect, it } from 'vitest';
import { reuseLocalImages } from '../src/lib/images.ts';
import type { Tag } from '../src/lib/types.ts';

function tag(no: string, images: Tag['images']): Tag {
  return { no, name: no, stage: 1, stageLabel: '1탄', rarity: 6, rarityLabel: '★6', sourceIdx: 0, images };
}

const REMOTE = 'https://pokemontagstar.co.kr/data/goodsImages/1.png';

describe('로컬 이미지 이어붙이기', () => {
  // 이미지 수집을 건너뛴 실행이 화면의 모든 이미지를 공식 서버 직링크로
  // 되돌려버린 적이 있다. 이 테스트가 그 회귀를 막는다.
  it('지난 실행의 로컬 경로를 새 태그에 잇는다', () => {
    const fresh = [tag('a', { thumb: REMOTE, front: REMOTE, back: REMOTE })];
    reuseLocalImages(fresh, [tag('a', { thumb: '/tags/a-thumb.png', front: '/tags/a-front.png', back: null })]);

    expect(fresh[0].images.thumb).toBe('/tags/a-thumb.png');
    expect(fresh[0].images.front).toBe('/tags/a-front.png');
    expect(fresh[0].images.back).toBe(REMOTE); // 받아둔 적 없으면 원격 유지
  });

  it('새로 생긴 태그는 그대로 둔다', () => {
    const fresh = [tag('new', { thumb: REMOTE, front: null, back: null })];
    reuseLocalImages(fresh, []);
    expect(fresh[0].images.thumb).toBe(REMOTE);
  });

  it('지난 값이 원격이면 덮어쓰지 않는다', () => {
    const fresh = [tag('a', { thumb: '/tags/a-thumb.png', front: null, back: null })];
    reuseLocalImages(fresh, [tag('a', { thumb: REMOTE, front: null, back: null })]);
    expect(fresh[0].images.thumb).toBe('/tags/a-thumb.png');
  });
});
