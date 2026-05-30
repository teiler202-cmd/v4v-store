'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '@/lib/shopify';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import Header from '@/components/Header';
import { IBM_Plex_Mono } from 'next/font/google';

const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

// 🔥 [핵심 수정]: sessionStorage 대신 '전역 변수'를 사용합니다.
// 이렇게 하면 새로고침(새로운 접속) 시에는 초기화되고, 사이트 내에서 버튼으로 이동할 때만 유지됩니다!
let isIntroSeen = false;

export default function Home() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [step, setStep] = useState<'logo' | 'quote' | 'home'>('logo');
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLogoExploded, setIsLogoExploded] = useState(false);
  
  const quoteText = "VISION IN MOTION, PERFORMANCE IN ACTION";
  const [verse, setVerse] = useState('');
  const { cart } = useCart();
  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);

  // 1. 처음 마운트 될 때 전역 변수 검사
  useEffect(() => {
    if (isIntroSeen) {
      setStep('home'); // 이미 본 상태면 바로 홈으로 직행
    }
    setIsInitialized(true);
  }, []);

  // 2. 홈 화면에 도달하면 '오프닝 봤음'으로 기록
  useEffect(() => {
    if (step === 'home') {
      isIntroSeen = true;
    }
  }, [step]);

  // 3. Shopify 상품 가져오기
  useEffect(() => {
    if (step === 'home') {
      const fetchProducts = async () => {
        setIsLoading(true);
        const data = await getProducts();
        setProducts(data);
        setIsLoading(false);
      };
      fetchProducts();
    }
  }, [step]);

  // 4. 철학 문구 타이머
  useEffect(() => {
    if (step === 'quote') {
      const timer = setTimeout(() => {
        setStep('home'); 
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  // 5. 성경 구절 API
  useEffect(() => {
    const fetchRandomVerse = async () => {
      try {
        const response = await fetch('https://labs.bible.org/api/?passage=random&type=json');
        const data = await response.json();
        const randomPick = data[0];
        setVerse(`${randomPick.text} - ${randomPick.bookname} ${randomPick.chapter}:${randomPick.verse}`);
      } catch (error) {
        setVerse("I can do all things through him who strengthens me. - Philippians 4:13");
      }
    };
    fetchRandomVerse();
  }, []);

  // 6. 거대 로고 폭발 클릭 핸들러 (100개 파티클 유지)
  const handleLogoClick = () => {
    if (isLogoExploded) return;
    setIsLogoExploded(true); 
    setTimeout(() => setStep('quote'), 2200); 
  };

  if (!isInitialized) return <main className="min-h-screen bg-black" />;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-black text-white overflow-x-hidden select-none font-sans">
      <AnimatePresence mode="wait">
        
        {/* 오프닝 1: V4V 로고 폭발 */}
        {step === 'logo' && (
          <motion.div
            key="logo-step"
            className="cursor-pointer flex flex-col items-center"
            onClick={handleLogoClick}
          >
            <div className="flex">
              {["V", "4", "V"].map((char, index) => (
                <span key={index} className="relative inline-flex justify-center items-center">
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={isLogoExploded ? { opacity: 0, scale: 0.9, filter: "blur(12px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
                    transition={{ duration: isLogoExploded ? 1.0 : 1.2, ease: "easeOut" }}
                    className="text-[180px] font-bold tracking-tighter leading-none"
                  >
                    {char}
                  </motion.span>

                  {isLogoExploded && [...Array(100)].map((_, i) => {
                    const angle = Math.random() * Math.PI * 2;
                    const distance = 80 + Math.random() * 400; 
                    const tx = Math.cos(angle) * distance;
                    const ty = Math.sin(angle) * distance;
                    const size = 1.5 + Math.random() * 3; 

                    return (
                      <motion.span
                        key={i}
                        initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                        animate={{ x: tx, y: ty, opacity: 0, scale: 0 }}
                        transition={{ duration: 1.5 + Math.random() * 1.5, ease: "easeOut" }}
                        className="absolute bg-white rounded-full"
                        style={{ width: size, height: size }}
                      />
                    );
                  })}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* 오프닝 2: 철학 문구 */}
        {step === 'quote' && (
          <motion.div
            key="quote-step" exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}
            className="flex flex-wrap justify-center max-w-5xl px-10"
          >
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              initial="hidden" animate="visible" className="flex flex-wrap justify-center"
            >
              {quoteText.split("").map((char, index) => (
                <motion.span
                  key={index} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3, ease: "linear" }}
                  className="text-[45px] font-medium tracking-[-0.1em] uppercase inline-block"
                  style={{ minWidth: char === " " ? "20px" : "auto" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* 메인 3: 홈 화면 (헤더 & 상품 리스트) */}
        {step === 'home' && (
          <motion.div
            key="home-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="w-full min-h-screen flex flex-col items-center relative"
          >
            <Header />

            <div className="w-[80%] md:w-[60%] flex justify-center items-center py-6 mb-8 border-b border-zinc-900/50 min-h-[80px]">
              <p className={`${ibm.className} text-xs md:text-sm text-zinc-500 tracking-[0.15em] uppercase text-center transition-opacity duration-1000 ${verse ? 'opacity-100' : 'opacity-0'}`}>
                {verse}
              </p>
            </div>

            <div className="mt-8 w-full max-w-[1000px] px-10 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-16 pb-20">
              {isLoading ? (
                <div className="col-span-full h-64 flex items-center justify-center text-[10px] tracking-[0.5em] text-zinc-600 uppercase">
                  Loading performance gear...
                </div>
              ) : products.length > 0 ? (
                products.map((product: any) => (
                  <Link href={`/products/${product.handle}`} key={product.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                      className="flex flex-col gap-4 group cursor-pointer"
                    >
                      <div className="aspect-[3/4] bg-zinc-900 overflow-hidden border border-white/5 relative">
                        {product.images?.edges[0] && (
                          <img 
                            src={product.images.edges[0].node.url} alt={product.title}
                            sizes="(max-width: 768px) 100vw, 33vw"
                            className="w-full h-full object-cover grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                          />
                        )}
                      </div>
                      <div className="flex justify-between items-start pt-2">
                        <h3 className="text-[12px] font-medium tracking-tight uppercase leading-tight max-w-[70%]">{product.title}</h3>
                        <p className="text-[12px] font-light text-zinc-400">
                          {product.priceRange.minVariantPrice.currencyCode} {Math.floor(product.priceRange.minVariantPrice.amount).toLocaleString()}
                        </p>
                      </div>
                    </motion.div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full h-64 flex items-center justify-center text-[10px] tracking-[0.5em] text-zinc-600 uppercase">
                  No products found.
                </div>
              )}
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </main>
  );
}