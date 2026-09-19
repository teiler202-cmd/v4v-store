import { IBM_Plex_Sans, IBM_Plex_Mono, Inter } from 'next/font/google';
import localFont from 'next/font/local';

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
 * 한글 본문 조판용 명조 — 나눔명조를 직접 싣습니다(self-host).
 *
 * 구글 폰트판은 글자 묶음 184조각이라, 그 @font-face 목록(약 30KB)이 모든 페이지의 첫 CSS 에 실리고
 * 한글 페이지마다 조각 13~25개를 받는 동안 메뉴를 누른 화면이 멈춰 있었습니다.
 * 이제 사이트에 실제로 적힌 글자만 담은 파일 하나씩(굵기당 약 60~70KB)입니다.
 * 파일은 scripts/subset-ko.mjs 가 dev 서버를 켤 때와 build 때마다 다시 뽑습니다 — 배포에는 따로 할 일이 없습니다.
 * 다만 dev 서버를 켠 채 새 한글을 쓰면 그 글자만 기기 고딕으로 보이니, dev 서버를 껐다 켜세요(npm run dev 로 켤 때 저절로 다시 뽑습니다).
 * (실행 중에 쇼피파이·DB 에서 오는 글은 목록에 없으므로 이 글꼴 영역에 넣지 마세요)
 *
 * 굵기는 400(본문)과 700(강조) 둘뿐 — font-semibold(600)는 예전처럼 700 으로 그려집니다.
 * preload:false 라서 한글을 쓰지 않는 페이지(홈·결제 등)는 내려받지 않고,
 * 한글 페이지로 가는 메뉴에 손이 닿는 순간 미리 받아 둡니다(warmNanum).
 * 글꼴이 오기 전 잠깐은 크기를 맞춘 Times New Roman 이 자리를 지킵니다(구글판과 같은 방식).
 */
export const nanum = localFont({
  src: [
    { path: '../app/fonts/nanum-myeongjo-400.woff2', weight: '400', style: 'normal' },
    { path: '../app/fonts/nanum-myeongjo-700.woff2', weight: '700', style: 'normal' },
  ],
  display: 'swap',
  preload: false,
  variable: '--v4v-font-serif-ko',
  adjustFontFallback: 'Times New Roman',
});

/** 나눔명조를 쓰는 페이지들 — 여기로 가는 링크에 손이 닿으면 글꼴을 미리 받습니다. */
const NANUM_ROUTES = ['/about', '/essay', '/telegram', '/contact', '/archives'];

let nanumWarmed = false;

/**
 * 메뉴에 마우스를 올리거나(포커스·터치 포함) 하는 순간 나눔명조 두 굵기를 받아 둡니다.
 *
 * 누른 뒤에 받기 시작하면, React 가 새 화면을 그리기 전에 글꼴을 최대 0.5초 기다리는 동안
 * 오로라까지 통째로 멈춥니다. 손이 닿고 누르기까지의 틈이면 파일 두 개(합계 약 130KB)는 대개 도착합니다.
 * 한 번 받으면 다시 부르지 않습니다.
 */
export function warmNanum(href: string) {
  if (nanumWarmed || typeof document === 'undefined' || !('fonts' in document)) return;
  if (!NANUM_ROUTES.some((route) => href === route || href.startsWith(`${route}/`))) return;
  nanumWarmed = true;
  const family = nanum.style.fontFamily;
  for (const weight of ['400', '700']) {
    // 실패해도(오프라인 등) 화면에는 영향이 없습니다 — 그때는 이동한 뒤 평소처럼 받습니다.
    document.fonts.load(`${weight} 1em ${family}`).catch(() => {
      nanumWarmed = false;
    });
  }
}

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
