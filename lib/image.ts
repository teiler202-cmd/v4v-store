/**
 * 쇼피파이 CDN 이미지 크기 조절.
 *
 * 쇼피파이는 업로드한 원본(이 스토어는 2000x2000)을 그대로 돌려줍니다.
 * 그런데 화면에서 실제로 차지하는 자리는 200픽셀 남짓이라,
 * 받은 데이터의 90% 가까이가 그려지지도 못한 채 버려집니다.
 *
 * 쇼피파이 CDN은 주소 끝의 width 인자를 보고 그 크기로 잘라 주므로,
 * "필요한 만큼만" 달라고 요청하면 전송량이 한 자릿수 퍼센트대로 떨어집니다.
 */

/** cdn.shopify.com 및 그 하위 도메인만 손댑니다 */
function isShopifyCdn(hostname: string) {
  return hostname === 'cdn.shopify.com' || hostname.endsWith('.cdn.shopify.com');
}

/** 주어진 가로 픽셀로 리사이즈된 이미지 주소 */
export function sizedImage(url: string | undefined | null, width: number): string {
  if (!url) return '';
  try {
    const parsed = new URL(url);
    if (!isShopifyCdn(parsed.hostname)) return url; // 외부 이미지는 그대로 둡니다
    parsed.searchParams.set('width', String(Math.round(width)));
    return parsed.toString();
  } catch {
    return url; // 상대경로 등 파싱 불가한 주소는 건드리지 않습니다
  }
}

/**
 * 고해상도 화면까지 고려한 srcset.
 * 브라우저가 기기 화면에 맞는 크기 하나만 골라 받습니다.
 */
export function sizedSrcSet(url: string | undefined | null, widths: readonly number[]): string | undefined {
  if (!url) return undefined;
  const entries = widths.map((w) => `${sizedImage(url, w)} ${w}w`);
  return entries.length ? entries.join(', ') : undefined;
}

/**
 * 상품 상세 사진(히어로) 한 장의 크기 규칙 — 상세 페이지(ZoomImage)와 홈 그리드의
 * 미리 받기(ShopGrid warmHero)가 반드시 같은 값을 써야 해서 여기 한 곳에 둡니다.
 * 한 글자라도 다르면 브라우저가 다른 후보 주소를 골라, 미리 받은 사진을 두고 또 받습니다.
 *
 * 사진 칸은 md 이상에서 (화면폭−여백)의 48%, 최대 500px — 45vw는 768~1279 어디서나
 * 그 칸보다 좁지 않고, 1280 이상은 정확히 500px입니다. 선명도는 그대로, 2배 화면에선
 * 1280 대신 1000을 받습니다. 767/768 경계는 Tailwind md와 같습니다.
 */
export const HERO_WIDTHS: readonly number[] = [640, 900, 1000, 1280];
export const HERO_SIZES = '(max-width: 767px) 100vw, (max-width: 1279px) 45vw, 500px';
/** srcset을 모르는 환경용 기본 주소의 폭 */
export const HERO_SRC_WIDTH = 900;

/** 히어로 <img>에 그대로 얹을 src·srcSet·sizes */
export function heroSources(url: string) {
  return {
    src: sizedImage(url, HERO_SRC_WIDTH),
    srcSet: sizedSrcSet(url, HERO_WIDTHS),
    sizes: HERO_SIZES,
  };
}
