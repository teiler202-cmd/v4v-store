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
export function sizedSrcSet(url: string | undefined | null, widths: number[]): string | undefined {
  if (!url) return undefined;
  const entries = widths.map((w) => `${sizedImage(url, w)} ${w}w`);
  return entries.length ? entries.join(', ') : undefined;
}
