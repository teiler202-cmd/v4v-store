'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';

import { IBM_Plex_Mono } from 'next/font/google';

const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

export default function Header() {
  const { cart } = useCart();
  const totalItems = cart?.reduce((t, i) => t + i.quantity, 0) || 0;

  return (
    <header className="w-full h-[60px] md:h-[90px] lg:h-[120px] flex justify-between items-center px-4 md:px-10 border-b border-zinc-900/50 bg-black text-white sticky top-0 z-40 transition-all duration-300">
      
      {/* 1. 좌측: V4V 로고 */}
      <div className="w-[20%] flex justify-start">
        <Link href="/" className="hover:opacity-70 transition-opacity flex items-center w-[60px] md:w-[140px] lg:w-[200px]">
          <Image 
            src="/V4V_logo_black.jpeg"  
            alt="V4V Logo"
            width={100}                
            height={150}               
            priority // 🔥 [수선 포인트]: LCP 최우선 로딩 적용
            style={{ width: 'auto', height: 'auto' }} // 🔥 [수선 포인트]: 원본 비율 유지 적용
            className="w-full object-contain" 
          />
        </Link>
      </div>

      {/* 2. 중앙: 데스크톱 메뉴 
          🔥 모바일에서는 양옆 px-1로 여백을 줄이고, 폰트 크기를 text-[10px]로 축소! 
      */}
      <nav className="w-[60%] flex flex-row justify-between items-center px-1 md:px-4 whitespace-nowrap">
        <Link href="/" className={`${ibm.className} text-[10px] sm:text-[12px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.05em] md:tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Shop
        </Link>
        <Link href="/archives" className={`${ibm.className} text-[10px] sm:text-[12px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.05em] md:tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Archives
        </Link>
        <Link href="/about" className={`${ibm.className} text-[10px] sm:text-[12px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.05em] md:tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          About
        </Link>
        <Link href="/contact" className={`${ibm.className} text-[10px] sm:text-[12px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.05em] md:tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Contact
        </Link>
      </nav>

      {/* 3. 우측: 장바구니 
          🔥 모바일 폰트 text-[12px]로 축소 
      */}
      <div className="w-[20%] flex justify-end items-center">
        <Link href="/checkout" className={`${ibm.className} text-[12px] md:text-[18px] lg:text-[25px] font-black text-white hover:text-zinc-400 uppercase tracking-[0.05em] md:tracking-[0.1em] transition-all flex items-center whitespace-nowrap`}>
          BAG [{totalItems}]
        </Link>
      </div>
      
    </header>
  );
}