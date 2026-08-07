import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import './globals.css';

// 루트(V4V-STORE) 바로 아래에 있는 components 폴더에서 장바구니 두뇌와 푸터를 가져옵니다.
import { CartProvider } from "../components/CartProvider";
import Footer from "../components/Footer"; // 🔥 Footer 컴포넌트 추가

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

// 🔥 [SEO 최적화]: 브라우저 탭, 검색 엔진 노출, 카카오톡/인스타 공유용 메타데이터 세팅
export const metadata: Metadata = {
  // 브라우저 탭 및 검색 결과에 뜰 제목
  title: {
    template: '%s | VISION FOR VISIONARY',
    default: 'VISION FOR VISIONARY (V4V)', 
  },
  description: 'Vision in Motion, Performance in Action. 고유한 비전과 본질을 바탕으로 삶을 개척하는 이들을 위한 장비.',
  // Canonical Tag (중복 문서 방지 - 원본 링크 지정)
  alternates: {
    canonical: 'https://vision4visionary.com',
  },
  // 카카오톡, 인스타그램 등 링크 공유 시 노출될 썸네일 (Open Graph)
  openGraph: {
    title: 'VISION FOR VISIONARY',
    description: 'Vision in Motion, Performance in Action.',
    url: 'https://vision4visionary.com',
    siteName: 'V4V',
    images: [
      {
        // 💡 주의: public 폴더 안에 og-image.jpg 파일(권장 1200x630 사이즈)을 꼭 넣어주세요!
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

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* 🔥 body에 flex, flex-col, min-h-screen을 추가하여 푸터를 하단에 고정시킬 뼈대를 만듭니다. */}
      <body className={`${ibmPlexSans.className} bg-white text-black m-0 p-0 flex flex-col min-h-screen`}>
        {/* 전체 사이트(children)를 장바구니 메모리(CartProvider)로 감싸줍니다. */}
        <CartProvider>
          
          {/* 🔥 main 태그에 flex-grow를 주어 메인 콘텐츠가 남는 공간을 모두 밀어내고 푸터를 바닥으로 보냅니다. */}
          <main className="flex-grow">
            {children}
          </main>

          {/* 🔥 모든 페이지 맨 밑바닥에 공통으로 나타날 푸터 장착! */}
          <Footer />
          
        </CartProvider>
      </body>
    </html>
  );
}