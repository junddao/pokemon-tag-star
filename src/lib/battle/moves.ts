import type { PokemonType } from '../pokemon-types.ts';

/**
 * 기술의 타입·분류·위력표.
 *
 * 태그 뒷면에는 기술 «이름»과 타입 아이콘만 찍혀 있고 위력도, 물리/특수 구분도 없다.
 * 그런데 데미지는 기술 타입으로 상성을 따지고, 물리면 공격/방어를, 특수면 특수공격/특수방어를
 * 쓴다. 그래서 이 표가 없으면 전투 자체가 성립하지 않는다.
 *
 * 값은 본가 포켓몬 기준이다. 아케이드가 자체 수치를 쓸 가능성이 있지만 공개된 바가 없고,
 * 본가 기준이 유일하게 검증 가능한 출처다. SPECIES_TYPES 와 같은 수동 관리 표다.
 */
export type MoveCategory = 'physical' | 'special';

export interface Move {
  type: PokemonType;
  category: MoveCategory;
  power: number;
}

/** 연속기는 평균 타수를 곱해 1회 위력으로 환산한다. 턴당 1회 공격만 모델링하기 때문이다. */
export const MOVES: Record<string, Move> = {
  '10만볼트': { type: '전기', category: 'special', power: 90 },
  '가지찌르기': { type: '풀', category: 'physical', power: 40 },
  '강철날개': { type: '강철', category: 'physical', power: 70 },
  '거수참': { type: '강철', category: 'physical', power: 100 },
  '거수탄': { type: '강철', category: 'physical', power: 100 },
  '거품': { type: '물', category: 'special', power: 40 },
  '거품광선': { type: '물', category: 'special', power: 65 },
  '고드름떨구기': { type: '얼음', category: 'physical', power: 85 },
  '고드름침': { type: '얼음', category: 'physical', power: 75 }, // 25 × 평균 3타
  '그래스믹서': { type: '풀', category: 'physical', power: 55 },
  '기가임팩트': { type: '노말', category: 'physical', power: 150 },
  '기합구슬': { type: '격투', category: 'special', power: 120 },
  '깜짝베기': { type: '악', category: 'physical', power: 70 },
  '깨트리기': { type: '격투', category: 'physical', power: 75 },
  '나뭇잎': { type: '풀', category: 'physical', power: 40 },
  '날개치기': { type: '비행', category: 'physical', power: 60 },
  '노려맞히기': { type: '물', category: 'special', power: 80 },
  '놀래키기': { type: '고스트', category: 'physical', power: 30 },
  '눈보라': { type: '얼음', category: 'special', power: 110 },
  '눈사태': { type: '얼음', category: 'physical', power: 60 },
  '눈싸라기': { type: '얼음', category: 'special', power: 40 },
  '니트로차지': { type: '불꽃', category: 'physical', power: 50 },
  '다이빙': { type: '물', category: 'physical', power: 80 },
  '드래곤다이브': { type: '드래곤', category: 'physical', power: 100 },
  '드래곤클로': { type: '드래곤', category: 'physical', power: 80 },
  '드래곤테일': { type: '드래곤', category: 'physical', power: 60 },
  '드럼어택': { type: '풀', category: 'physical', power: 80 },
  '드레인키스': { type: '페어리', category: 'special', power: 50 },
  '땅고르기': { type: '땅', category: 'physical', power: 60 },
  '라이트닝드라이브': { type: '전기', category: 'special', power: 100 },
  '러스터캐논': { type: '강철', category: 'special', power: 80 },
  '로킥': { type: '격투', category: 'physical', power: 60 },
  '리프블레이드': { type: '풀', category: 'physical', power: 90 },
  '리프스톰': { type: '풀', category: 'special', power: 130 },
  '마하펀치': { type: '격투', category: 'physical', power: 40 },
  '매지컬리프': { type: '풀', category: 'special', power: 60 },
  '매지컬샤인': { type: '페어리', category: 'special', power: 80 },
  '메가드레인': { type: '풀', category: 'special', power: 40 },
  '모래지옥': { type: '땅', category: 'physical', power: 35 },
  '몸통박치기': { type: '노말', category: 'physical', power: 40 },
  '문포스': { type: '페어리', category: 'special', power: 95 },
  '물기': { type: '악', category: 'physical', power: 60 },
  '물대포': { type: '물', category: 'special', power: 40 },
  '물의파동': { type: '물', category: 'special', power: 60 },
  '바람일으키기': { type: '비행', category: 'special', power: 40 },
  '바크아웃': { type: '악', category: 'special', power: 55 },
  '번개': { type: '전기', category: 'special', power: 110 },
  '벌레먹기': { type: '벌레', category: 'physical', power: 60 },
  '벌레의야단법석': { type: '벌레', category: 'special', power: 90 },
  '베놈쇼크': { type: '독', category: 'special', power: 65 },
  '병상첨병': { type: '고스트', category: 'special', power: 65 },
  '보복': { type: '악', category: 'physical', power: 50 },
  '볼부비부비': { type: '전기', category: 'physical', power: 20 },
  '분연': { type: '불꽃', category: 'special', power: 60 },
  '분함의발구르기': { type: '땅', category: 'physical', power: 75 },
  '불꽃세례': { type: '불꽃', category: 'special', power: 40 },
  '불대문자': { type: '불꽃', category: 'special', power: 110 },
  '불태우기': { type: '불꽃', category: 'special', power: 130 },
  '블레이즈킥': { type: '불꽃', category: 'physical', power: 85 },
  '사과산': { type: '풀', category: 'special', power: 80 },
  '사이코브레이크': { type: '에스퍼', category: 'special', power: 100 },
  '사이코쇼크': { type: '에스퍼', category: 'special', power: 80 },
  '사이코키네시스': { type: '에스퍼', category: 'special', power: 90 },
  '섀도볼': { type: '고스트', category: 'special', power: 80 },
  '섀도펀치': { type: '고스트', category: 'physical', power: 60 },
  '성스러운칼': { type: '격투', category: 'physical', power: 90 },
  '스톤에지': { type: '바위', category: 'physical', power: 100 },
  '스파크': { type: '전기', category: 'physical', power: 65 },
  '스피드스타': { type: '노말', category: 'special', power: 60 },
  '승부굳히기': { type: '악', category: 'physical', power: 75 },
  '시저크로스': { type: '벌레', category: 'physical', power: 80 },
  '씨기관총': { type: '풀', category: 'physical', power: 75 }, // 25 × 평균 3타
  '아이언헤드': { type: '강철', category: 'physical', power: 80 },
  '악의파동': { type: '악', category: 'special', power: 80 },
  '액셀브레이크': { type: '격투', category: 'physical', power: 100 },
  '양날박치기': { type: '바위', category: 'physical', power: 150 },
  '에어슬래시': { type: '비행', category: 'special', power: 75 },
  '열탕': { type: '물', category: 'special', power: 80 },
  '염동력': { type: '에스퍼', category: 'special', power: 50 },
  '오로라빔': { type: '얼음', category: 'special', power: 65 },
  '인파이트': { type: '격투', category: 'physical', power: 120 },
  '잎날가르기': { type: '풀', category: 'physical', power: 55 },
  '잠재파워': { type: '노말', category: 'special', power: 60 },
  '전기쇼크': { type: '전기', category: 'special', power: 40 },
  '지옥찌르기': { type: '악', category: 'physical', power: 70 },
  '지진': { type: '땅', category: 'physical', power: 100 },
  '쪼기': { type: '비행', category: 'physical', power: 35 },
  '쪼아대기': { type: '비행', category: 'physical', power: 80 },
  '차밍보이스': { type: '페어리', category: 'special', power: 40 },
  '코멧펀치': { type: '강철', category: 'physical', power: 90 },
  '크로스썬더': { type: '전기', category: 'physical', power: 100 },
  '크로스플레임': { type: '불꽃', category: 'special', power: 100 },
  '탁류': { type: '물', category: 'special', power: 90 },
  '파동탄': { type: '격투', category: 'special', power: 80 },
  '폭풍': { type: '비행', category: 'special', power: 110 },
  '프리즈드라이': { type: '얼음', category: 'special', power: 70 },
  '하이드로펌프': { type: '물', category: 'special', power: 110 },
  '할퀴기': { type: '노말', category: 'physical', power: 40 },
  '화염방사': { type: '불꽃', category: 'special', power: 90 },
  '화염볼': { type: '불꽃', category: 'physical', power: 120 },
  '환상빔': { type: '에스퍼', category: 'special', power: 65 },
  '흡수': { type: '풀', category: 'special', power: 20 },

  // 다이맥스 기술 — 본가에서 원 기술의 위력 구간에 따라 고정값이 정해진다.
  '다이너클': { type: '격투', category: 'physical', power: 95 },
  '다이록': { type: '바위', category: 'physical', power: 130 },
  '다이스틸': { type: '강철', category: 'physical', power: 130 },
  '다이썬더': { type: '전기', category: 'special', power: 130 },
  '다이어스': { type: '땅', category: 'physical', power: 130 },
  '다이어택': { type: '노말', category: 'physical', power: 150 },

  // Z기술 — 배틀당 한 번뿐이라 위력이 통상기를 크게 웃돈다.
  '다이내믹풀플레임': { type: '불꽃', category: 'special', power: 185 },
  '라이징랜드오버': { type: '땅', category: 'physical', power: 180 },
  '레이징지오프리즈': { type: '얼음', category: 'special', power: 175 },
  '스파킹기가볼트': { type: '전기', category: 'special', power: 175 },
  '전력무쌍격렬권': { type: '격투', category: 'physical', power: 170 },
  '초월나선연격': { type: '강철', category: 'special', power: 180 },
};

export function moveOf(name: string): Move | null {
  return MOVES[name] ?? null;
}
