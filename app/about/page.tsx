"use client";

import Header from '@/components/Header';
import { IBM_Plex_Mono, Nanum_Myeongjo, Noto_Serif_JP } from 'next/font/google';
import { motion, Variants } from 'framer-motion';

// 1. 글로벌 폰트 세팅
const ibm = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500', '600', '700'] });

// 한글/일본어 폰트는 subsets: ['latin'] 옵션을 제거하여 500 에러 방지
const nanum = Nanum_Myeongjo({ weight: '800', preload: false });
const noto = Noto_Serif_JP({ weight: ['400', '700'], preload: false });

// 2. 스크롤 모션 애니메이션 세팅 
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
    <div className="w-full bg-white text-black select-none min-h-screen flex flex-col items-center overflow-hidden">
      <Header />
      
      {/* 타이틀 영역 */}
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: "easeOut" }}
        className="w-full mt-32 mb-16 md:mb-24 flex flex-col items-center text-center px-6"
      >
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
            Section 1: Our Philosophy
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16">
          <div className="md:col-span-4">
            {/* 🔥 [수정]: md(태블릿)에서는 text-5xl로 유지하여 오버랩 방지, lg(데스크톱)에서만 text-7xl로 확장, 만약을 위해 break-words 추가 */}
            <h2 
              className="text-5xl md:text-5xl lg:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32 text-zinc-900 break-words pr-4" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              Our<br />Philosophy
            </h2>
          </div>
          
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-2" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <h3 className="text-2xl md:text-[32px] font-bold tracking-tighter leading-none text-zinc-900">
                I believe the essence of humanity is the ability to imagine a vision and turn it into reality
              </h3>
              <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">
                — We live in an age shaped by materialism and hedonism, where many have lost a deep reverence for God. I believe it is possible to return to a truly knowing God and to realize vision through acts of creation, as God Himself created.
              </p>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-2`}
            >
              <h3 className="text-xl md:text-[26px] font-extrabold tracking-tighter leading-tight break-keep text-zinc-900">
                인간성의 본질이 비전을 상상하고 그것을 현실로 구현하는 능력에 있다고 믿습니다
              </h3>
              <p className="font-extrabold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">
                — 우리는 물질주의와 쾌락주의에 의해 형성된, 많은 이들이 신에 대한 경외심을 잃어버린 시대에 살고 있습니다. 우리는 다시 참된 신을 알아가고 창조하는 것이 가능하다고 믿으며 창조주가 그러하셨듯 창조적 행위를 통해 비전을 실현하고자 합니다.
              </p>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-2`}
            >
              <h3 className="text-lg md:text-[22px] font-bold tracking-tighter leading-tight text-zinc-900">
                私は、人間性の本質とはビジョンを想像し、それを現実に具現化する能力にあると信じている
              </h3>
              <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">
                — 私たちは物質主義と快楽主義に形作られた時代を生きており、多くの者が神への深い畏敬の念を失ってしまった。私は再び真理(神)を知ることができると信じており、創造主がそうされたように、創造の行為を通じてビジョンを実現しようと思う。
              </p>
            </motion.div>
          </div>
        </section>

        {/* =====================================
            Section 2: What We Do
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 border-t border-black/10 pt-16 md:pt-32">
          <div className="md:col-span-4">
            {/* 🔥 [수정]: 동일하게 반응형 폰트 사이즈 적용 */}
            <h2 
              className="text-5xl md:text-5xl lg:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32 text-zinc-900 break-words pr-4" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              What We<br />Do
            </h2>
          </div>
          
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">Empowering Vision</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— We believe that unique visions and individuality enrich the world. We empower individuals to break free from the noise and live authentically according to their own vision.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">Building Infrastructure</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— We provide a robust infrastructure and community where individuals can share ideas, inspire one another, and collaborate as they manifest their visions.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">Manifesting Imagination</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— Our products are the tangible results of pure imagination. Through them, we continually remind the world of the infinite value found in absolute belief and imagination.</p>
              </div>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-6`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">비전의 지지</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 우리는 고유한 비전과 개성이 세상을 더욱 풍요롭게 한다고 믿습니다. 타인의 시선에서 벗어나, 더 많은 이들이 오직 자신만의 비전대로 삶을 개척할 수 있도록 돕습니다.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">창조적 연대의 구축</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 각자의 비전을 실현해 나가는 과정에서, 사람들과 영감을 나누고 서로가 성장의 발판이 될 수 있는 견고한 커뮤니티와 인프라를 제공합니다.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">상상의 실체화</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 우리의 제품은 순수한 상상력에서 비롯된 실체적인 결과물입니다. 이를 통해 사람들에게 굳건한 믿음과 상상력이 지닌 무한한 가치를 끊임없이 상기시키며 나아갑니다.</p>
              </div>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-6`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">ビジョンの支持</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 私たちは、独自のビジョンと個性が世界をより豊かにすると信じています。他人の目から解放され、より多くの人々が自分だけのビジョンに従って真に生きることができるよう支援します。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">創造的連帯の構築</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 各自のビジョンを実現していく過程で、人々とインスピレーションを共有し、互いの成長の基盤となる強固なコミュニティとインフラを提供します。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">想像の具現化</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 私たちの製品は、純粋な想像力から生まれた具体的な結果です。これらを通じて、確固たる信念と想像力が持つ無限の価値を人々に絶えず思い起こさせながら前進します。</p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* =====================================
            Section 3: Who We Find
            ===================================== */}
        <section className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 border-t border-black/10 pt-16 md:pt-32">
          <div className="md:col-span-4">
            {/* 🔥 [수정]: 동일하게 반응형 폰트 사이즈 적용 */}
            <h2 
              className="text-5xl md:text-5xl lg:text-7xl font-bold tracking-tighter leading-none md:sticky md:top-32 text-zinc-900 break-words pr-4" 
              style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              Who We<br />Find
            </h2>
          </div>
          
          <div className="md:col-span-8 flex flex-col gap-8 md:gap-10 pt-4 md:pt-0">
            {/* English */}
            <motion.div 
              variants={slideUpVariant(1, 0)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className="flex flex-col gap-6" style={{ fontFamily: 'Helvetica, Arial, sans-serif' }}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">The Creative Visionary</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— Those who live guided by their own vision and essence, rather than the currents of fleeting trends.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">The Philosopher in Action</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— Those who do not merely rest on thought and philosophy, but forge their lives through action.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-2xl md:text-3xl font-bold tracking-tighter leading-none text-zinc-900">The Relentless Pioneer</h3>
                <p className="font-light text-lg md:text-xl tracking-tight leading-tight text-zinc-500">— Those who reject impossibility and negativity, employing a pioneering spirit to better themselves, their surroundings, and the world.</p>
              </div>
            </motion.div>

            {/* Korean */}
            <motion.div 
              variants={slideUpVariant(0.65, 0.15)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${nanum.className} flex flex-col gap-6`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">창조하는 비전가</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 시대의 흐름, 트렌드가 아닌 스스로의 비전과 본질에서 비롯한 삶을 살아가는 사람.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">행동하는 철학가</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 생각, 철학에 그치지 않고 이를 토대로 행동하며 살아가는 사람.</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-xl md:text-2xl font-extrabold tracking-tighter leading-tight text-zinc-900">끊임없는 개척자</h3>
                <p className="font-bold text-base md:text-lg tracking-tight leading-tight break-keep text-zinc-500">— 불가능과 부정적인 것에서 멀어져 개척 정신으로 자신, 그리고 주변, 세상을 더욱 이롭게 만들어가는 사람.</p>
              </div>
            </motion.div>

            {/* Japanese */}
            <motion.div 
              variants={slideUpVariant(0.35, 0.3)} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }}
              className={`${noto.className} flex flex-col gap-6`}
            >
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">創造するビジョナリー</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 時代の流れやトレンドではなく、自らのビジョンと本質に基づいた人生を歩む者。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">行動する哲学者</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 思考や哲学にとどまらず、それを土台として行動し生きる者。</p>
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="text-lg md:text-xl font-bold tracking-tighter leading-tight text-zinc-900">絶え間なき開拓者</h3>
                <p className="font-normal text-sm md:text-base tracking-tight leading-tight text-zinc-500">— 不可能や否定的なものから遠ざかり、開拓精神をもって自らと周囲、そして世界をより良くしていく者。</p>
              </div>
            </motion.div>
          </div>
        </section>

      </main>
    </div>
  );
}