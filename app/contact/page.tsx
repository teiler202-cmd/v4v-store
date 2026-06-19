"use client";

import Header from '@/components/Header';
import { IBM_Plex_Mono, Inter, Nanum_Myeongjo } from 'next/font/google';
import { motion } from 'framer-motion';

// 1. 글로벌 폰트 세팅
const ibm = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });
const inter = Inter({ subsets: ['latin'] });
const nanum = Nanum_Myeongjo({ weight: '800', preload: false });

export default function ContactPage() {
  return (
    <div className="w-full bg-black text-white select-none min-h-screen flex flex-col items-center overflow-hidden">
      <Header />
      
      {/* 최상단 타이틀 영역 */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full mt-32 mb-16 md:mb-24 flex flex-col items-center text-center px-6"
      >
        <h1 className={`${inter.className} text-xl md:text-3xl font-bold tracking-widest mb-1`}>
          ( CONTACT )
        </h1>
        <p className={`${ibm.className} text-sm md:text-lg text-zinc-500 tracking-[0.1em] uppercase`}>
          Reach out to Visionary
        </p>
      </motion.div>

      {/* 메인 콘텐츠 영역 */}
      <main className="w-full max-w-[1200px] px-6 md:px-16 pb-40 flex flex-col gap-20">
        
        {/* Section 1: Customer Service & Partnership */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 border-t border-white/10 pt-16"
        >
          {/* Customer Service */}
          <div className="flex flex-col gap-6">
            <h2 className={`${inter.className} text-2xl md:text-3xl font-bold tracking-tighter`}>
              Customer Service
            </h2>
            <div className={`${nanum.className} text-zinc-400 flex flex-col gap-3 tracking-tight`}>
              <p className="text-base md:text-lg font-extrabold break-keep leading-relaxed">
                상품, 배송, 결제 및 반품과 관련된 모든 문의는 아래 공식 이메일 창구를 통해 연락해 주시면 신속하게 안내해 드리겠습니다.
              </p>
              <p className="text-base md:text-lg font-extrabold break-keep leading-relaxed text-zinc-500">
                운영 시간: 평일 10:00 - 17:00<br />
                (점심시간 12:00 - 13:00 / 주말 및 공휴일 휴무)
              </p>
            </div>
            <a 
              href="mailto:cs@vision4visionary.com" 
              className={`${inter.className} text-lg md:text-xl font-medium mt-2 text-white hover:text-zinc-500 transition-colors duration-500 w-fit`}
            >
              cs@vision4visionary.com
            </a>
          </div>

          {/* Partnership & Press */}
          <div className="flex flex-col gap-6">
            <h2 className={`${inter.className} text-2xl md:text-3xl font-bold tracking-tighter`}>
              Partnership & Press
            </h2>
            <div className={`${nanum.className} text-zinc-400 flex flex-col gap-3 tracking-tight`}>
              <p className="text-base md:text-lg font-extrabold break-keep leading-relaxed">
                V4V와의 브랜드 협업, 입점 제안, 매거진 프레스 등 비즈니스와 관련된 문의는 전용 메일로 남겨주시기 바랍니다.
              </p>
            </div>
            <a 
              href="mailto:partnership@vision4visionary.com" 
              className={`${inter.className} text-lg md:text-xl font-medium mt-2 text-white hover:text-zinc-500 transition-colors duration-500 w-fit`}
            >
              partnership@vision4visionary.com
            </a>
          </div>
        </motion.section>

        {/* Section 2: Headquarters */}
        <motion.section 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-16 border-t border-white/10 pt-16"
        >
          <div className="flex flex-col gap-6">
            <h2 className={`${inter.className} text-2xl md:text-3xl font-bold tracking-tighter`}>
              Headquarters
            </h2>
            <div className={`${nanum.className} text-zinc-400 flex flex-col gap-2 tracking-tight`}>
              <p className="text-base md:text-lg font-extrabold">비전포비저너리 (V4V)</p>
              <p className={`${inter.className} font-light text-base md:text-lg tracking-tight`}>
                Seoul, Republic of Korea
              </p>
            </div>
          </div>
        </motion.section>

      </main>
    </div>
  );
}