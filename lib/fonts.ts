import { IBM_Plex_Sans, IBM_Plex_Mono, Inter, Nanum_Myeongjo } from 'next/font/google';

/**
 * 사이트 전역 타이포그래피 시스템.
 * 모든 페이지가 같은 폰트 인스턴스를 공유하도록 한 곳에서 관리합니다.
 * (각 폰트는 CSS 변수로도 노출되어 globals.css의 @theme에서 참조됩니다.)
 */

export const plexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--v4v-font-sans',
});

/**
 * ⚠️ Mono·Inter는 미리 받지 않습니다(preload:false).
 *    globals.css의 @theme은 --font-mono 등을 :root에 두는데, 실제 폰트 이름(--v4v-font-*)은 body에만 붙어 있어
 *    font-mono·font-grotesk 클래스가 무효가 되고 지금 화면의 글자는 모두 IBM Plex Sans로 그려집니다.
 *    그런데도 두 폰트(합계 약 91KB)가 모든 페이지에서 높은 우선순위로 미리 내려받아지고 있었습니다.
 *    preload만 끄면 화면은 그대로이고, 실제로 쓰이는 순간에만 받습니다.
 */
export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-mono',
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-grotesk',
});

/**
 * 한글 본문 조판용 명조.
 *
 * 한글은 글자 수가 많아 웹폰트 파일이 무겁습니다(굵기 하나당 1MB 이상).
 * 그래서 실제로 쓰는 굵기만 남겼습니다 — 400(본문)과 700(강조) 둘뿐입니다.
 * preload:false 라서 한글을 쓰지 않는 페이지(홈·결제 등)는 내려받지 않습니다.
 *
 * ⚠️ subsets:['korean'] 을 추가하고 싶어지지만, 이 폰트는 Next의 폰트 목록에
 *    latin 서브셋만 등록되어 있어 빌드가 실패합니다. 더 줄이려면 실제 쓰는
 *    글자만 뽑아 self-host(next/font/local) 하는 방법을 써야 합니다.
 */
export const nanum = Nanum_Myeongjo({
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-serif-ko',
});

/**
 * 일본어 명조는 웹폰트로 싣지 않습니다.
 *
 * about 페이지의 장식용 3문장(불투명도 0.42)에만 쓰이는데,
 * Noto Serif JP 전체 서브셋은 빌드 자산 7MB를 차지했습니다.
 * 장식 한 줄의 대가로는 지나쳐서, 기기에 이미 있는 명조로 대체합니다.
 */
export const JP_SERIF_STACK =
  '"Hiragino Mincho ProN", "Yu Mincho", "YuMincho", "Noto Serif JP", "Noto Serif CJK JP", serif';

export const notoJp = { className: 'v4v-jp-serif' } as const;

export const fontVariables = [
  plexSans.variable,
  plexMono.variable,
  inter.variable,
  nanum.variable,
].join(' ');
