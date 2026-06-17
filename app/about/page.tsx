"use client";

import Header from '@/components/Header';
import { IBM_Plex_Mono, Nanum_Myeongjo, Noto_Serif_JP } from 'next/font/google';
import { motion, Variants } from 'framer-motion';

// 1. 글로벌 폰트 세팅
const ibm = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// 한글/일본어 폰트는 subsets: ['latin'] 옵션을 제거하여 500 에러 방지
const nanum = Nanum_Myeongjo({ weight: '800', preload: false });
const noto = Noto_Serif_JP({ weight: ['400', '700'], preload: false });

// 2. 스크롤 모션 애니메이션 세팅 (타입스크립트 Variants 에러 해결)
const slideUpVariant = (targetOpacity: number, delayTime: number): Variants => ({
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: targetOpacity, 
    y: 0, 
    transition: { 
      duration: 0.9,
      ease: [0.16, 1, 0.3, 1],
      delay: delayTime 
    } 
  }
});

export default function AboutPage() {
  return (
    <div className="w-full bg-black text-white select-none min-h-screen flex flex-col items-center overflow-hidden">
      <Header />
      
      {/* 🔥 [수선 1]: 타이틀 하단 여백 대폭 축소 (mb-40 -> mb-24) */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full mt-32 mb-16 md:mb-24 flex flex-col items-center text-center px-6"
      >
        {/* 🔥 [수선 2]: ( VISION... ) 과 슬로건 사이 간격 바짝 붙임 (mb-2 -> mb-1) */}
        <h1 className="text-xl md:text-3xl font-bold tracking-widest mb-0 md:mb-1" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}>
          ( VISION FOR VISIONARY )
        </h1>
        <p className={`${ibm.className} text-sm md:text-lg text-zinc-500 tracking-[0.1em]`}>
          Vision in Motion, Performance in Action.
        </p>
      </motion.div>

      {/* 메인 콘텐츠 영역 */}
      <main className="w-full max-w-[1400px] px-6 md:px-16 pb-40 flex flex-col gap-32 md:gap-40">
        
        {/* =====================================
            Section 1: Why I Am Here? 
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-4">
            <h2 
              className="text-5xl md:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              Why I Am<br />Here?
            </h2>
          </div>
          
          {/* 🔥 [수선 3]: 언어별 문단 상하 간격 축소 (gap-16 -> gap-10) */}
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <h3 className="text-2xl md:text-[32px] font-bold tracking-tighter leading-none">
                I believe the essence of humanity is the ability to imagine a vision and turn it into reality
              </h3>
              <p className="font-light text-lg md:text-xl tracking-tight leading-tight">
                — We live in an age shaped by materialism and hedonism, where many have lost a deep reverence for God. I believe it is possible to return to a truly knowing God and to realize vision through acts of creation, as God Himself created.
              </p>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-2`}
            >
              <h3 className="text-xl md:text-[26px] font-extrabold tracking-tighter leading-tight break-keep">
                인간성의 본질이 비전을 상상하고 그것을 현실로 구현하는 능력에 있다고 믿습니다
              </h3>
              <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">
                — 우리는 물질주의와 쾌락주의에 의해 형성된, 많은 이들이 신에 대한 깊은 경외심을 잃어버린 시대에 살고 있습니다. 나는 다시 참된 신을 알아가고 창조하는 것이 가능하다고 믿으며 창조주가 그러하셨듯 창조적 행위를 통해 비전을 실현하고자 합니다.
              </p>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-2`}
            >
              <h3 className="text-lg md:text-[22px] font-bold tracking-tighter leading-tight">
                私は、人間性の本質とはビジョンを想像し、それを現実に具現化する能力にあると信じている
              </h3>
              <p className="font-normal text-sm md:text-base tracking-tight leading-tight">
                — 私たちは物質主義と快楽主義に形作られた時代を生きており、多くの者が神への深い畏敬の念を失ってしまった。私は再び真理(神)を知ることができると信じており、創造主がそうされたように、創造の行為を通じてビジョンを実現しようと思う。
              </p>
            </motion.div>
          </div>
        </section>

        {/* =====================================
            Section 2: What I do? 
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 border-t border-white/10 pt-16 md:pt-32">
          <div className="md:col-span-4">
            <h2 
              className="text-5xl md:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              What I do?
            </h2>
          </div>
          
          {/* 🔥 [수선 3]: 언어별 문단 상하 간격 축소 (gap-16 -> gap-10) */}
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-5" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">Contextualizing Truth</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— Translate eternal values into modern aesthetics, filtering noise to reveal the essence.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">Building Systems of Creation</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— Design functional infrastructures—products and platforms—that bridge vision and reality.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">Manifesting Vision</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— I prove belief through execution, providing the tools for visionaries to build and conquer.</p>
              </div>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-5`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">진리의 맥락화</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 영원한 가치를 현대적 미학으로 번역하여, 본질을 드러내기 위해 모든 소음을 여과합니다.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">창조의 시스템 구축</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 비전과 실제 사이를 잇는 기능적 인프라 - 제품과 플랫폼 - 를 설계합니다.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">비전의 발현</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 행동으로 믿음을 증명하며, 선구자들이 구축하고 정복할 수 있는 도구를 제공합니다.</p>
              </div>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-5`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">真理の文脈化</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— 永遠の価値を現代的な美学へと翻訳し、本質を露わにするためにあらゆるノイズを濾過する。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">創造のシステム構築</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— ビジョンと現実を繋ぐ機能的なインフラ（製品とプラットフォーム）を設計する。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">ビジョンの現出</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— 行動を通じて信念を証明し、先駆者たちが構築し征服するための道具を提供する。</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =====================================
            Section 3: Who I find? 
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 border-t border-white/10 pt-16 md:pt-32">
          <div className="md:col-span-4">
            <h2 
              className="text-5xl md:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              Who I find?
            </h2>
          </div>
          
          {/* 🔥 [수선 3]: 언어별 문단 상하 간격 축소 (gap-16 -> gap-10) */}
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-5" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">The Silent Builder</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— Those who pursue essence and core principles over loud marketing and fleeting trends.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">The Creative Believer</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— Those who view creation as an act of faith and seek to prove their convictions through their work.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none">The Truth Seeker</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight">— Those who demand authenticity and use aesthetics and technology as tools for true freedom.</p>
              </div>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-5`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">침묵하는 구축자</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 시대의 흐름, 얕은 마케팅보다 본질과 핵심 원칙을 우선시하는 자들.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">창조적 신앙가</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 창조를 신앙의 행위로 간주하며, 자신의 행동을 통해 신념을 증명하고자 하는 자들.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight">진리 추구자</h3>
                <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep">— 진정성을 요구하며, 미학과 기술을 도구 삼아 진정한 자유를 요구하는 자들.</p>
              </div>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-5`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">沈黙の構築者</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— 華やかなマーケティングや刹那的な流行よりも、本質と核心的な原則を優先する者たち。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">創造的な信仰家</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— 創造を信仰の行為と見なし、自らの仕事を通じて信念を証明しようとする者たち。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight">真理の探求者</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight">— 真の自由のために、美学と技術を道具として真正性を求める者たち。</p>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
}