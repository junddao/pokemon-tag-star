import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

// 실제 배포 산출물을 검사한다. NEXT_PUBLIC_SITE_URL을 지정해 빌드한 뒤 실행한다.
const root = path.resolve('out');
const sitemap = await readFile(path.join(root, 'sitemap.xml'), 'utf8');
const urls = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map((match) => new URL(match[1]));
assert(urls.length > 0, '사이트맵에 URL이 없습니다.');
assert.equal(new Set(urls.map(String)).size, urls.length, '사이트맵에 중복 URL이 있습니다.');
const robots = await readFile(path.join(root, 'robots.txt'), 'utf8');
assert(robots.includes(`Sitemap: ${urls[0].href}sitemap.xml`), 'robots.txt의 사이트맵 주소가 다릅니다.');

for (const url of urls) {
  assert.equal(url.protocol, 'https:', `배포 URL은 HTTPS여야 합니다: ${url}`);
  assert.equal(url.origin, urls[0].origin, `사이트맵 도메인이 다릅니다: ${url}`);
  const pathname = decodeURIComponent(url.pathname.slice(urls[0].pathname.length));
  const html = await readFile(path.join(root, pathname, 'index.html'), 'utf8');
  const canonicals = [...html.matchAll(/<link\b[^>]*rel="canonical"[^>]*href="([^"]+)"[^>]*>/g)];
  assert.equal(canonicals.length, 1, `대표 주소는 하나여야 합니다: ${url}`);
  assert.equal(canonicals[0][1], url.href, `대표 주소가 해당 페이지와 다릅니다: ${url}`);
  assert(!/<meta\b[^>]*name="robots"[^>]*content="[^"]*noindex/.test(html), `색인이 차단되었습니다: ${url}`);
  const schemas = [...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gs)];
  if (pathname === '' || /^dex\/[^/]+\/$/.test(pathname)) {
    assert.equal(schemas.length, 1, `구조화 데이터가 누락되거나 중복되었습니다: ${url}`);
  }
  for (const match of schemas) {
    const data = JSON.parse(match[1]);
    assert.equal(data['@context'], 'https://schema.org', `구조화 데이터 context 오류: ${url}`);
    if (pathname === '') {
      assert.equal(data['@type'], 'WebSite', '홈페이지 WebSite 구조화 데이터가 없습니다.');
      assert.equal(data.url, url.href, '홈페이지 구조화 데이터 URL이 다릅니다.');
    }
    if (pathname.startsWith('dex/')) {
      const page = data['@graph']?.find((node) => node['@type'] === 'WebPage');
      assert.equal(page?.url, url.href, `구조화 데이터 URL 오류: ${url}`);
      assert(!JSON.stringify(data).includes('AggregateOffer'), `참고 시세를 판매 제안으로 표시합니다: ${url}`);
    }
  }
}

const places = JSON.parse(await readFile('public/data/places.json', 'utf8'));
const mapHtml = await readFile(path.join(root, 'map/index.html'), 'utf8');
const escape = (value) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#x27;');
for (const place of places) {
  assert(mapHtml.includes(escape(place.address)), `매장 주소가 HTML에 없습니다: ${place.address}`);
}
console.log(`SEO 검사 통과: ${urls.length}개 URL의 대표 주소·색인 허용·구조화 데이터, ${places.length}개 매장 주소.`);
