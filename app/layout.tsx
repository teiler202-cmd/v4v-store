import type { Metadata } from "next";
import { ViewTransition } from "react";
import './globals.css';

import { fontVariables, plexSans } from "@/lib/fonts";
import { CartProvider } from "@/components/CartProvider";
import Header from "@/components/Header";
import ChromeGate from "@/components/ChromeGate";
import Footer from "@/components/Footer";

// 🔥 [SEO 최적화]: 브라우저 탭, 검색 엔진 노출, 카카오톡/인스타 공유용 메타데이터 세팅
export const metadata: Metadata = {
  metadataBase: new URL('https://vision4visionary.com'),
  title: {
    template: '%s | VISION FOR VISIONARY',
    default: 'VISION FOR VISIONARY (V4V)',
  },
  description: 'Vision in Motion, Performance in Action. 고유한 비전과 본질을 바탕으로 삶을 개척하는 이들을 위한 장비.',
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

        <CartProvider>
          {/* 헤더는 레이아웃에 상주합니다 — 페이지를 옮겨도 다시 그려지지 않아 흐름이 끊기지 않습니다. */}
          <ChromeGate>
            <Header />
          </ChromeGate>

          <main className="flex-grow">
            {/* 페이지 본문만 크로스페이드 — 헤더/푸터는 제자리를 지킵니다. */}
            <ViewTransition default="v4v-page">
              {children}
            </ViewTransition>
          </main>

          <ChromeGate>
            <Footer />
          </ChromeGate>
        </CartProvider>
      </body>
    </html>
  );
}
