import { IBM_Plex_Sans, IBM_Plex_Mono, Inter, Nanum_Myeongjo, Noto_Serif_JP } from 'next/font/google';

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

export const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--v4v-font-mono',
});

export const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--v4v-font-grotesk',
});

// 한글/일본어 폰트는 subsets 옵션 없이(전체 서브셋) 불러옵니다.
export const nanum = Nanum_Myeongjo({
  weight: ['400', '700', '800'],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-serif-ko',
});

export const notoJp = Noto_Serif_JP({
  weight: ['400', '700'],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-serif-jp',
});

export const fontVariables = [
  plexSans.variable,
  plexMono.variable,
  inter.variable,
  nanum.variable,
  notoJp.variable,
].join(' ');
