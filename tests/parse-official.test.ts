import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  isKoreaCoord,
  parseJsArray,
  parsePlacePage,
  parseStagePage,
  parseTagDetail,
  regionOf,
  stageFromNo,
} from '../src/lib/parse-official.ts';

const fixture = (name: string) =>
  fs.readFileSync(path.join(import.meta.dirname, 'fixtures', name), 'utf8');

describe('stage.php 파서', () => {
  // 이 테스트가 깨지면 공식 사이트 구조가 바뀐 것이다. 조용히 넘어가면 도감이 빈다.
  it('2탄에서 등급별 태그를 모두 뽑는다', () => {
    const { stageLabel, tags } = parseStagePage(fixture('stage-cate4.html'));
    expect(stageLabel).toContain('2탄');
    expect(tags).toHaveLength(73);

    const byRarity = (r: number) => tags.filter((t) => t.rarity === r).length;
    expect(byRarity(6)).toBe(10);
    expect(byRarity(5)).toBe(15);
    expect(byRarity(4)).toBe(17);
    expect(byRarity(3)).toBe(14);
    expect(byRarity(2)).toBe(14);
    expect(byRarity(0)).toBe(3); // 레귤러
  });

  it('1탄도 같은 구조로 읽힌다', () => {
    const { stageLabel, tags } = parseStagePage(fixture('stage-cate1.html'));
    expect(stageLabel).toContain('1탄');
    expect(tags).toHaveLength(73);
    expect(tags.find((t) => t.no === '1-1-001')?.name).toBe('뮤츠');
  });

  it('태그 필드를 정확히 채운다', () => {
    const { tags } = parseStagePage(fixture('stage-cate4.html'));
    const kyogre = tags.find((t) => t.no === '1-2-001')!;
    expect(kyogre.name).toBe('가이오가');
    expect(kyogre.rarity).toBe(6);
    expect(kyogre.rarityLabel).toBe('슈퍼스타 ★6');
    expect(kyogre.stage).toBe(2);
    expect(kyogre.sourceIdx).toBe(195);
    expect(kyogre.images.thumb).toMatch(/^https:\/\/pokemontagstar\.co\.kr\/data\/goodsImages\//);
  });

  it('태그 섹션이 아닌 헤더는 등급으로 오인하지 않는다', () => {
    // 1탄 페이지에는 "이번 탄의 ... 포함되어 있어요!" 같은 헤더가 섞여 있다
    const { tags } = parseStagePage(fixture('stage-cate1.html'));
    expect(tags.every((t) => t.no.length > 0)).toBe(true);
  });
});

describe('상세 팝업 파서', () => {
  it('앞면과 뒷면을 모두 뽑는다', () => {
    const { front, back } = parseTagDetail(fixture('stage-pop-view.html'));
    expect(front).toBe('https://pokemontagstar.co.kr/data/goodsImages/17854733779.png');
    expect(back).toBe('https://pokemontagstar.co.kr/data/goodsImages/178547337710.png');
  });
});

describe('place.php 파서', () => {
  it('372곳을 한 페이지에서 전부 읽는다', () => {
    const places = parsePlacePage(fixture('place.html'));
    expect(places).toHaveLength(372);
  });

  it('위경도를 뒤집지 않는다', () => {
    // 공식 코드의 coordX 는 경도, coordY 는 위도다. 바꿔 읽으면 지도가 바다로 간다.
    const places = parsePlacePage(fixture('place.html'));
    const first = places[0];
    expect(first.name).toBe('현대아울렛 가든파이브점 (몰관)');
    expect(first.address).toBe('서울 송파구 충민로 66');
    expect(first.lat).toBeCloseTo(37.4777905, 4);
    expect(first.lng).toBeCloseTo(127.124342, 4);
    expect(places.every((p) => isKoreaCoord(p.lat, p.lng))).toBe(true);
  });

  it('주소에서 시도를 뽑는다', () => {
    const places = parsePlacePage(fixture('place.html'));
    expect(places[0].region).toBe('서울');
    expect(places.filter((p) => p.region === '기타').length).toBe(0);
  });
});

describe('보조 함수', () => {
  it('따옴표 안의 콤마를 항목 구분자로 착각하지 않는다', () => {
    const html = `var x = [ '가, 나', '다' ];`;
    expect(parseJsArray(html, 'x')).toEqual(['가, 나', '다']);
  });

  it('태그 번호에서 탄을 읽는다', () => {
    expect(stageFromNo('1-2-001')).toBe(2);
    expect(stageFromNo('1-1-034')).toBe(1);
    expect(stageFromNo('R-1-1')).toBe(1);
  });

  it('대한민국 밖 좌표를 거른다', () => {
    expect(isKoreaCoord(37.5, 127.0)).toBe(true);
    expect(isKoreaCoord(127.0, 37.5)).toBe(false); // 뒤집힌 경우
    expect(isKoreaCoord(NaN, 127)).toBe(false);
  });

  it('시도를 정규화한다', () => {
    expect(regionOf('경기 성남시 분당구 서현로210번길 17')).toBe('경기');
    expect(regionOf('서울특별시 종로구')).toBe('서울');
  });
});
