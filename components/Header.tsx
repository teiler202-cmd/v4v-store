'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function Header() {
  // 🔥 setIsCartOpen 리모콘을 가져옵니다.
  const { cart, setIsCartOpen } = useCart();
  const totalItems = cart?.reduce((t, i) => t + i.quantity, 0) || 0;

  return (
    <header className="w-full border-b border-zinc-200 bg-white text-black sticky top-0 z-40 transition-all duration-300">
      
      <div className="flex justify-between items-center px-4 md:px-10 py-3 md:py-4">
        
        <div className="w-[33%] flex justify-start">
          <span className={`${inter.className} text-[10px] text-gray-500 hidden md:block`}>
          </span>
        </div>

        <div className="w-[34%] flex justify-center">
          <Link href="/" className="hover:opacity-60 transition-opacity flex justify-center items-center">
            <Image 
              src="/V4V_SlubTee_로고(가로쭉).png"  
              alt="V4V Logo"
              width={400}
              height={60}               
              priority 
              style={{ height: '24px', width: 'auto' }} 
              className="object-contain" 
            />
          </Link>
        </div>

        <div className="w-[33%] flex justify-end items-center">
          {/* 🔥 Link 대신 button 태그를 사용하여 팝업을 띄웁니다! */}
          <button 
            onClick={() => setIsCartOpen(true)} 
            className={`${inter.className} text-[11px] md:text-sm font-medium hover:text-gray-500 transition-colors uppercase`}
          >
            BAG ({totalItems})
          </button>
        </div>
        
      </div>

      <nav className="flex justify-center items-center pb-3 gap-6 md:gap-10 overflow-x-auto whitespace-nowrap px-4 scrollbar-hide">
        <Link href="/" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>Shop</Link>
        <Link href="/archives" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>Archives</Link>
        <Link href="/essay" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>Essay</Link>
        <Link href="/about" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>About</Link>
        <Link href="/contact" className={`${inter.className} text-[11px] md:text-[13px] font-normal hover:text-gray-500 transition-colors capitalize`}>Contact</Link>
      </nav>
      
    </header>
  );
}