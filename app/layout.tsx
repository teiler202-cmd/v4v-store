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

export const metadata: Metadata = {
  title: "V4V STORE",
  description: "Vision in Motion, Performance in Action",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      {/* 🔥 body에 flex, flex-col, min-h-screen을 추가하여 푸터를 하단에 고정시킬 뼈대를 만듭니다. */}
      <body className={`${ibmPlexSans.className} bg-black text-white m-0 p-0 flex flex-col min-h-screen`}>
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