'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Header() {
  const { cart } = useCart();
  const totalItems = cart?.reduce((t, i) => t + i.quantity, 0) || 0;

  return (
    <header className="w-full border-b border-zinc-200 bg-white text-black sticky top-0 z-40 transition-all duration-300">
      
      {/* 1열: 상단 (좌측 여백, 중앙 로고, 우측 장바구니) */}
      <div className="flex justify-between items-center px-4 md:px-10 py-3 md:py-4">
        
        {/* 좌측: 작은 텍스트 */}
        <div className="w-[33%] flex justify-start">
          <span className={`${inter.className} text-[10px] text-gray-500 hidden md:block`}>
           
          </span>
        </div>

        {/* 중앙: V4V 로고 */}
        <div className="w-[34%] flex justify-center">
          <Link href="/" className="hover:opacity-60 transition-opacity flex justify-center items-center">
            {/* 🔥 기존 로고 파일명을 새 그래픽 이미지로 변경 완료 */}
            <Image 
              src="/V4V_SlubTee_로고_정방향.png"  
              alt="V4V Logo"
              width={200} // 그래픽 비율을 고려해 width를 넉넉하게 확보 
              height={40}               
              priority 
              // 🔥 슬림한 헤더 유지를 위해 높이를 24px로 제한
              style={{ width: 'auto', height: '24px' }} 
              className="object-contain" 
            />
          </Link>
        </div>

        {/* 우측: 장바구니 */}
        <div className="w-[33%] flex justify-end items-center">
          <Link href="/checkout" className={`${inter.className} text-[11px] md:text-sm font-medium hover:text-gray-500 transition-colors`}>
            BAG ({totalItems})
          </Link>
        </div>
        
      </div>

      {/* 2열: 하단 메인 네비게이션 (메뉴) */}
      <nav className="flex justify-center items-center pb-3 gap-6 md:gap-10 overflow-x-auto whitespace-nowrap px-4 scrollbar-hide">
        <Link href="/" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>
          Shop
        </Link>
        <Link href="/archives" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>
          Archives
        </Link>
        <Link href="/essay" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>
          Essay
        </Link>
        <Link href="/about" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>
          About
        </Link>
        <Link href="/contact" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>
          Contact
        </Link>
      </nav>
      
    </header>
  );
}