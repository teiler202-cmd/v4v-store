import type { Metadata } from "next";
import { ViewTransition } from "react";
import './globals.css';

import { fontVariables, plexSans } from "@/lib/fonts";
import { CartProvider } from "@/components/CartProvider";
import { AccountProvider } from "@/components/AccountProvider";
import Header from "@/components/Header";
import ChromeGate from "@/components/ChromeGate";
import Footer from "@/components/Footer";
import CSChat from "@/components/CSChat";

// 🔥 [SEO 최적화]: 브라우저 탭, 검색 엔진 노출, 카카오톡/인스타 공유용 메타데이터 세팅
export const metadata: Metadata = {
  metadataBase: new URL('https://vision4visionary.com'),
  title: {
    template: '%s | VISION FOR VISIONARY',
    default: 'VISION FOR VISIONARY (V4V)',
  },
  description: 'Vision in Motion, Performance in Action. V4V의 PRODUCT는 고유한 비전과 본질을 바탕으로 삶을 개척하는 이들을 위해 만들어집니다.',
  alternates: {
    canonical: 'https://vision4visionary.com',
  },
  openGraph: {
    title: 'VISION FOR VISIONARY',
    description: 'Vision in Motion, Performance in Action.',
    url: 'https://vision4visionary.com',
    siteName: 'V4V',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'V4V Brand Image',
      },
    ],
    locale: 'ko_KR',
    type: 'website',
  },
};

/**
 * 첫 페인트 전에 실행되어 인트로 재생 여부를 결정합니다.
 * - 홈(/)에 '이번 세션에서 처음' 들어온 경우에만 인트로가 재생됩니다.
 * - 새로고침이나 다른 페이지에서의 이동에서는 인트로가 나타나지 않습니다.
 */
const INTRO_BOOTSTRAP = `(function(){try{var d=document.documentElement;var p=location.pathname;var home=(p==="/"||p==="");var seen=window.sessionStorage.getItem("v4v:intro")==="1";d.setAttribute("data-intro",(home&&!seen)?"playing":"done");}catch(e){document.documentElement.setAttribute("data-intro","done");}})();`;

/**
 * 언어 우선순위도 첫 페인트 전에 정합니다.
 * 저장해 둔 선택이 있으면 그것을, 없으면 브라우저 언어를 따릅니다.
 * (두 언어 모두 화면에 있고 순서·농도만 달라지므로 깜빡임이 없습니다.)
 */
const LANG_BOOTSTRAP = `(function(){try{var d=document.documentElement;var saved=window.localStorage.getItem("v4v:lang");var langs=(navigator.languages&&navigator.languages.length?navigator.languages:[navigator.language||"en"]);var ko=langs.some(function(l){return /^ko/i.test(l)});d.setAttribute("data-lang",saved==="ko"||saved==="en"?saved:(ko?"ko":"en"));}catch(e){document.documentElement.setAttribute("data-lang","en");}})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${fontVariables} ${plexSans.className} bg-paper text-ink m-0 p-0 flex flex-col min-h-screen antialiased`}
      >
        <script dangerouslySetInnerHTML={{ __html: INTRO_BOOTSTRAP }} />
        <script dangerouslySetInnerHTML={{ __html: LANG_BOOTSTRAP }} />

        <AccountProvider>
          <CartProvider>
          {/* 헤더는 레이아웃에 상주합니다 — 페이지를 옮겨도 다시 그려지지 않아 흐름이 끊기지 않습니다. */}
          {/* 헤더에 이름을 붙여 두면 (1) 페이지 이동마다 전환이 시작되고
              (2) 헤더 자신은 스냅샷에서 제외되어 이동 중에도 미동이 없습니다. */}
          <ViewTransition name="v4v-header">
            <ChromeGate>
              <Header />
            </ChromeGate>
          </ViewTransition>

          {/* 페이지 전환은 뷰포트 크기의 root 스냅샷으로 처리합니다.
              (본문 전체를 감싸면 페이지 높이만큼 늘어난 상자에 화면 크기 스냅샷이
               억지로 채워지면서, position:fixed 요소가 거대하게 부풀어 오릅니다) */}
          <main className="flex-grow">{children}</main>

          <ChromeGate>
            <Footer />
          </ChromeGate>

          {/* 상담 도우미도 결제 화면에서는 비웁니다 — 그 화면은 스스로 완결됩니다. */}
          <ChromeGate>
            <CSChat />
          </ChromeGate>
          </CartProvider>
        </AccountProvider>
      </body>
    </html>
  );
}
