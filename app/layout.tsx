import type { Metadata } from "next";
import { IBM_Plex_Sans } from "next/font/google";
import './globals.css';

// 루트(V4V-STORE) 바로 아래에 있는 components 폴더에서 장바구니 두뇌를 가져옵니다.
import { CartProvider } from "../components/CartProvider";

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
      <body className={`${ibmPlexSans.className} bg-black text-white m-0 p-0`}>
        {/* 전체 사이트(children)를 장바구니 메모리(CartProvider)로 감싸줍니다. */}
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}