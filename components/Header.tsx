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
    <header className="w-full h-[60px] md:h-[90px] lg:h-[120px] flex justify-between items-center px-4 md:px-10 border-b border-zinc-900/50 bg-black text-white sticky top-0 z-40 relative transition-all duration-300">
      
      {/* 1. 좌측: V4V 로고 (🔥 화면의 20%만 차지하게 고정) */}
      <div className="w-[20%] flex justify-start">
        <Link href="/" className="hover:opacity-70 transition-opacity flex items-center w-[80px] md:w-[140px] lg:w-[200px]">
          <Image 
            src="/V4V_logo_black.jpeg"  
            alt="V4V Logo"
            width={200}                
            height={120}               
            className="w-full h-auto object-contain" 
            
          />
        </Link>
      </div>

      {/* 2. 중앙: 데스크톱 메뉴 
          🔥 w-[60%] : 화면의 60%를 거대하게 차지함 (빨간 박스 영역)
          🔥 justify-between : 양 끝(Shop, Contact)을 벽에 딱 붙이고 나머지는 균일하게 찢어발김! 
      */}
      <nav className="w-[60%] flex flex-row justify-between items-center px-4 whitespace-nowrap">
        <Link href="/" className={`${ibm.className} text-[20px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Shop
        </Link>
        <Link href="/archives" className={`${ibm.className} text-[20px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Archives
        </Link>
        <Link href="/about" className={`${ibm.className} text-[20px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          About
        </Link>
        <Link href="/contact" className={`${ibm.className} text-[20px] md:text-[18px] lg:text-[25px] font-bold uppercase tracking-[0.1em] text-zinc-400 hover:text-white transition-all`}>
          Contact
        </Link>
      </nav>

      {/* 3. 우측: 장바구니 (🔥 화면의 20%만 차지하게 고정) */}
      <div className="w-[20%] flex justify-end items-center">
        <Link href="/checkout" className={`${ibm.className} text-[24px] md:text-[18px] lg:text-[25px] font-black text-white hover:text-zinc-400 uppercase tracking-[0.1em] transition-all flex items-center whitespace-nowrap`}>
          BAG [{totalItems}]
        </Link>
      </div>
      
    </header>
  );
}