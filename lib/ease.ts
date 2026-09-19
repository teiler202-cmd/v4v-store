/**
 * 사이트 공통 이징 — 비단처럼 길게 풀리는 감속 (cubic-bezier(0.16, 1, 0.3, 1)).
 * CSS 쪽 같은 곡선은 globals.css의 --ease-silk입니다.
 *
 * 따로 떼어 둔 이유: 예전엔 components/Reveal.tsx에서 가져왔는데, 그러면 이 상수 하나
 * 때문에 홈(ShopGrid)까지 Reveal의 스크롤 장치(useScroll·useSpring…)가 함께 실렸습니다.
 */
export const SILK = [0.16, 1, 0.3, 1] as const;

/** CSS transition용 같은 곡선 */
export const SILK_CSS = 'cubic-bezier(0.16, 1, 0.3, 1)';
