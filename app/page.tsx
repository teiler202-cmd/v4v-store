'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '@/lib/shopify';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import Header from '@/components/Header';
import { IBM_Plex_Mono } from 'next/font/google';
import Image from 'next/image'; // 🔥 [추가]: Next.js 이미지 컴포넌트 임포트

const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

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

  useEffect(() => {
    if (isIntroSeen) {
      setStep('home');
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (step === 'home') {
      isIntroSeen = true;
    }
  }, [step]);

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

  // 🔥 [추가된 핵심 코드]: 오프닝 중 푸터(Footer) 투명인간 만들기
  useEffect(() => {
    const footer = document.querySelector('footer');
    
    if (footer) {
      // step이 'home'일 때만 보이게 하고, 오프닝(logo, quote)일 때는 숨깁니다.
      footer.style.display = step === 'home' ? 'block' : 'none';
    }

    // 컴포넌트가 언마운트(다른 페이지로 이동)될 때는 푸터 상태를 원래대로 복구
    return () => {
      if (footer) footer.style.display = 'block';
    };
  }, [step]);

  useEffect(() => {
    if (step === 'quote') {
      const timer = setTimeout(() => {
        setStep('home'); 
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

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

  const handleLogoClick = () => {
    if (isLogoExploded) return;
    setIsLogoExploded(true); 
    setTimeout(() => setStep('quote'), 1200); // 텍스트 폭발 효과가 빠졌으므로 대기 시간을 조금 줄여 속도감을 높임
  };

  if (!isInitialized) return <div className="min-h-screen bg-white w-full" />;

  return (
    <div className="w-full bg-white text-black select-none font-sans min-h-screen">
      <AnimatePresence mode="wait">
        
        {/* 오프닝 1: 로고 오프닝 (fixed inset-0 z-50으로 화면 전체를 절대 좌표로 덮음) */}
        {step === 'logo' && (
          <motion.div
            key="logo-step"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white cursor-pointer"
            onClick={handleLogoClick}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* 🔥 기존 텍스트(V4V) 코드 삭제 및 이미지 코드로 교체 완료 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={isLogoExploded ? { opacity: 0, scale: 0.95, filter: "blur(10px)" } : { opacity: 1, scale: 1, filter: "blur(0px)" }}
              transition={{ duration: isLogoExploded ? 1.0 : 1.2, ease: "easeOut" }}
              className="flex justify-center items-center"
            >
              <Image 
                src="/V4V_SlubTee_로고_정방향 copy.png"
                alt="V4V Landing Graphic"
                width={800}
                height={400}
                priority
                className="w-auto h-auto max-w-[90vw] md:max-w-3xl object-contain"
              />
            </motion.div>
          </motion.div>
        )}

        {/* 오프닝 2: 철학 문구 (fixed로 화면 위에 띄워두기) */}
        {step === 'quote' && (
          <motion.div
            key="quote-step"
            className="fixed inset-0 z-50 flex flex-wrap items-center justify-center bg-white px-10"
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}
          >
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              initial="hidden" animate="visible" className="flex flex-wrap justify-center max-w-5xl"
            >
              {quoteText.split("").map((char, index) => (
                <motion.span
                  key={index} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3, ease: "linear" }}
                  className="text-[18px] md:text-[45px] font-medium tracking-[-0.1em] uppercase inline-block"
                  style={{ minWidth: char === " " ? "0.3em" : "auto" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* 메인 3: 홈 화면 (일반 문서 흐름) */}
        {step === 'home' && (
          <motion.div
            key="home-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}
            className="w-full flex flex-col items-center relative"
          >
            <Header />

            <div className="w-[80%] md:w-[60%] flex justify-center items-center py-2 md:py-6 mb-2 md:mb-8 border-b border-zinc-900/50 min-h-[40px] md:min-h-[80px]">
              <p className={`${ibm.className} text-[9px] md:text-sm text-zinc-500 tracking-[0.05em] md:tracking-[0.15em] uppercase text-center transition-opacity duration-1000 ${verse ? 'opacity-100' : 'opacity-0'}`}>
                {verse}
              </p>
            </div>

            <div className="mt-2 md:mt-8 w-full max-w-[1000px] px-2 md:px-10 grid grid-cols-3 gap-x-2 md:gap-x-8 gap-y-8 md:gap-y-16 pb-20">
              {isLoading ? (
                <div className="col-span-full h-64 flex items-center justify-center text-[10px] tracking-[0.5em] text-zinc-600 uppercase">
                  Loading performance gear...
                </div>
              ) : products.length > 0 ? (
                products.map((product: any) => (
                  <Link href={`/products/${product.handle}`} key={product.id}>
                    <motion.div 
                      initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                      className="flex flex-col gap-1 md:gap-4 group cursor-pointer"
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
                      
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center pt-1 md:pt-2 gap-1 md:gap-0">
                        <h3 className="text-[8px] md:text-[12px] font-medium tracking-tighter md:tracking-tight uppercase leading-tight max-w-full md:max-w-[70%]">{product.title}</h3>
                        <p className="text-[8px] md:text-[12px] font-light text-zinc-400 whitespace-nowrap">
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
    </div>
  );
}