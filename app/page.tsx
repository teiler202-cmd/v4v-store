'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getProducts } from '@/lib/shopify';
import Link from 'next/link';
import { useCart } from '@/components/CartProvider';
import Header from '@/components/Header';
import { IBM_Plex_Mono } from 'next/font/google';
import Image from 'next/image';

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

  useEffect(() => {
    const footer = document.querySelector('footer');
    if (footer) {
      footer.style.display = step === 'home' ? 'block' : 'none';
    }
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
    const fetchDailyVerse = async () => {
      try {
        const response = await fetch('https://beta.ourmanna.com/api/v1/get?format=json&order=daily');
        const data = await response.json();
        
        const verseText = data.verse.details.text;
        const verseRef = data.verse.details.reference;
        
        setVerse(`${verseText} - ${verseRef}`);
      } catch (error) {
        setVerse("I can do all things through him who strengthens me. - Philippians 4:13");
      }
    };
    fetchDailyVerse();
  }, []);

  const handleLogoClick = () => {
    if (isLogoExploded) return;
    setIsLogoExploded(true); 
    setTimeout(() => setStep('quote'), 1200); 
  };

  if (!isInitialized) return <div className="min-h-screen bg-white w-full" />;

  return (
    <div className="w-full bg-white text-black select-none font-sans min-h-screen">
      <AnimatePresence mode="wait">
        
        {step === 'logo' && (
          <motion.div
            key="logo-step"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-white cursor-pointer"
            onClick={handleLogoClick}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
          >
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

        {step === 'quote' && (
          <motion.div
            key="quote-step"
            className="fixed inset-0 z-50 flex items-center justify-center bg-white px-2 md:px-10"
            exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.8 }}
          >
            <motion.div
              variants={{ visible: { transition: { staggerChildren: 0.03 } } }}
              initial="hidden" animate="visible" className="flex justify-center max-w-5xl whitespace-nowrap overflow-hidden"
            >
              {quoteText.split("").map((char, index) => (
                <motion.span
                  key={index} variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
                  transition={{ duration: 0.3, ease: "linear" }}
                  className="text-[10px] min-[390px]:text-[12px] sm:text-[14px] md:text-[45px] font-medium tracking-[-0.1em] uppercase inline-block"
                  style={{ minWidth: char === " " ? "0.3em" : "auto" }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>
          </motion.div>
        )}

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

            <div className="mt-2 md:mt-8 w-full max-w-[1200px] px-2 md:px-10 grid grid-cols-3 gap-x-2 md:gap-x-4 gap-y-12 md:gap-y-20 pb-32">
              {isLoading ? (
                <div className="col-span-full h-64 flex items-center justify-center text-[10px] tracking-[0.5em] text-zinc-600 uppercase">
                  Loading performance gear...
                </div>
              ) : products.length > 0 ? (
                products.map((product: any) => {
                  const firstImage = product.images?.edges[0]?.node?.url;
                  const secondImage = product.images?.edges[1]?.node?.url;

                  return (
                    <Link href={`/products/${product.handle}`} key={product.id}>
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
                        className="flex flex-col group cursor-pointer"
                      >
                        {/* 🔥 1. 호버 이미지 스왑 영역: 반응 속도 극대화 */}
                        <div className="aspect-[3/4] bg-[#f5f5f5] overflow-hidden relative border border-black/5">
                          {firstImage && (
                            <img 
                              src={firstImage} alt={product.title}
                              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ease-out ${secondImage ? 'group-hover:opacity-0' : ''}`}
                            />
                          )}
                          {secondImage && (
                            <img 
                              src={secondImage} alt={`${product.title} view 2`}
                              className="absolute inset-0 w-full h-full object-cover transition-opacity duration-150 ease-out opacity-0 group-hover:opacity-100"
                            />
                          )}
                        </div>
                        
                        {/* 🔥 2. 미니멀 텍스트 영역 (중앙 정렬, 자간 확대) */}
                        <div className="flex flex-col items-center justify-center pt-4 md:pt-5 gap-1.5">
                          <h3 className={`${ibm.className} text-[9px] md:text-[11px] font-semibold tracking-[0.15em] uppercase text-zinc-900 text-center`}>
                            {product.title}
                          </h3>
                          <p className={`${ibm.className} text-[9px] md:text-[11px] font-medium text-zinc-500 tracking-widest text-center`}>
                            {product.priceRange.minVariantPrice.currencyCode} {Math.floor(product.priceRange.minVariantPrice.amount).toLocaleString()}
                          </p>
                        </div>

                      </motion.div>
                    </Link>
                  );
                })
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