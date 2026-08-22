"use client";

import { useRef } from 'react';
import { motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { nanum, notoJp } from '@/lib/fonts';
import { MaskUp, Reveal, RevealItem, ScrollProgress, SILK } from '@/components/Reveal';

type Block = { heading: string; body: string };
type Lang = 'en' | 'ko' | 'jp';
type Group = { lang: Lang; blocks: Block[] };
type Section = { title: [string, string]; groups: Group[] };

const SECTIONS: Section[] = [
  {
    title: ['Our', 'Philosophy'],
    groups: [
      {
        lang: 'en',
        blocks: [
          {
            heading: 'I believe the essence of humanity is the ability to imagine a vision and turn it into reality',
            body: '— We live in an age shaped by materialism and hedonism, where many have lost a deep reverence for God. I believe it is possible to return to a truly knowing God and to realize vision through acts of creation, as God Himself created.',
          },
        ],
      },
      {
        lang: 'ko',
        blocks: [
          {
            heading: '인간성의 본질이 비전을 상상하고 그것을 현실로 구현하는 능력에 있다고 믿습니다',
            body: '— 우리는 물질주의와 쾌락주의에 의해 형성된, 많은 이들이 신에 대한 경외심을 잃어버린 시대에 살고 있습니다. 우리는 다시 참된 신을 알아가고 창조하는 것이 가능하다고 믿으며 창조주가 그러하셨듯 창조적 행위를 통해 비전을 실현하고자 합니다.',
          },
        ],
      },
      {
        lang: 'jp',
        blocks: [
          {
            heading: '私は、人間性の本質とはビジョンを想像し、それを現実に具現化する能力にあると信じている',
            body: '— 私たちは物質主義と快楽主義に形作られた時代を生きており、多くの者が神への深い畏敬の念を失ってしまった。私は再び真理(神)を知ることができると信じており、創造主がそうされたように、創造の行為を通じてビジョンを実現しようと思う。',
          },
        ],
      },
    ],
  },
  {
    title: ['What We', 'Do'],
    groups: [
      {
        lang: 'en',
        blocks: [
          { heading: 'Empowering Vision', body: '— We believe that unique visions and individuality enrich the world. We empower individuals to break free from the noise and live authentically according to their own vision.' },
          { heading: 'Building Infrastructure', body: '— We provide a robust infrastructure and community where individuals can share ideas, inspire one another, and collaborate as they manifest their visions.' },
          { heading: 'Manifesting Imagination', body: '— Our products are the tangible results of pure imagination. Through them, we continually remind the world of the infinite value found in absolute belief and imagination.' },
        ],
      },
      {
        lang: 'ko',
        blocks: [
          { heading: '비전의 지지', body: '— 우리는 고유한 비전과 개성이 세상을 더욱 풍요롭게 한다고 믿습니다. 타인의 시선에서 벗어나, 더 많은 이들이 오직 자신만의 비전대로 삶을 개척할 수 있도록 돕습니다.' },
          { heading: '창조적 연대의 구축', body: '— 각자의 비전을 실현해 나가는 과정에서, 사람들과 영감을 나누고 서로가 성장의 발판이 될 수 있는 견고한 커뮤니티와 인프라를 제공합니다.' },
          { heading: '상상의 실체화', body: '— 우리의 제품은 순수한 상상력에서 비롯된 실체적인 결과물입니다. 이를 통해 사람들에게 굳건한 믿음과 상상력이 지닌 무한한 가치를 끊임없이 상기시키며 나아갑니다.' },
        ],
      },
      {
        lang: 'jp',
        blocks: [
          { heading: 'ビジョンの支持', body: '— 私たちは、独自のビジョンと個性が世界をより豊かにすると信じています。他人の目から解放され、より多くの人々が自分だけのビジョンに従って真に生きることができるよう支援します。' },
          { heading: '創造的連帯の構築', body: '— 各自のビジョンを実現していく過程で、人々とインスピレーションを共有し、互いの成長の基盤となる強固なコミュニティとインフラを提供します。' },
          { heading: '想像の具現化', body: '— 私たちの製品は、純粋な想像力から生まれた具体的な結果です。これらを通じて、確固たる信念と想像力が持つ無限の価値を人々に絶えず思い起こさせながら前進します。' },
        ],
      },
    ],
  },
  {
    title: ['Who We', 'Find'],
    groups: [
      {
        lang: 'en',
        blocks: [
          { heading: 'The Creative Visionary', body: '— Those who live guided by their own vision and essence, rather than the currents of fleeting trends.' },
          { heading: 'The Philosopher in Action', body: '— Those who do not merely rest on thought and philosophy, but forge their lives through action.' },
          { heading: 'The Relentless Pioneer', body: '— Those who reject impossibility and negativity, employing a pioneering spirit to better themselves, their surroundings, and the world.' },
        ],
      },
      {
        lang: 'ko',
        blocks: [
          { heading: '창조하는 비전가', body: '— 시대의 흐름, 트렌드가 아닌 스스로의 비전과 본질에서 비롯한 삶을 살아가는 사람.' },
          { heading: '행동하는 철학가', body: '— 생각, 철학에 그치지 않고 이를 토대로 행동하며 살아가는 사람.' },
          { heading: '끊임없는 개척자', body: '— 불가능과 부정적인 것에서 멀어져 개척 정신으로 자신, 그리고 주변, 세상을 더욱 이롭게 만들어가는 사람.' },
        ],
      },
      {
        lang: 'jp',
        blocks: [
          { heading: '創造するビジョナリー', body: '— 時代の流れやトレンドではなく、自らのビジョンと本質に基づいた人生を歩む者。' },
          { heading: '行動する哲学者', body: '— 思考や哲学にとどまらず、それを土台として行動し生きる者。' },
          { heading: '絶え間なき開拓者', body: '— 不可能や否定的なものから遠ざかり、開拓精神をもって自らと周囲、そして世界をより良くしていく者。' },
        ],
      },
    ],
  },
];

/** 언어별 조판 — 영문이 가장 선명하고, 국문·일문 순으로 잦아듭니다 */
const TYPE: Record<Lang, { wrap: string; heading: string; body: string; opacity: number }> = {
  en: {
    wrap: 'font-grotesk',
    heading: 'text-[21px] md:text-[26px] font-bold tracking-[-0.035em] leading-[1.12] text-ink',
    body: 'font-light text-[14.5px] md:text-[16.5px] tracking-[-0.012em] leading-[1.45] text-ash',
    opacity: 1,
  },
  ko: {
    wrap: `${nanum.className}`,
    heading: 'text-[16px] md:text-[20px] font-extrabold tracking-[-0.03em] leading-[1.4] break-keep text-ink',
    body: 'font-bold text-[13px] md:text-[14.5px] tracking-[-0.015em] leading-[1.7] break-keep text-ash',
    opacity: 0.72,
  },
  jp: {
    wrap: `${notoJp.className}`,
    heading: 'text-[14.5px] md:text-[17px] font-bold tracking-[-0.025em] leading-[1.45] text-ink',
    body: 'font-normal text-[12.5px] md:text-[14px] tracking-[-0.015em] leading-[1.7] text-ash',
    opacity: 0.42,
  },
};

function SectionTitle({ lines }: { lines: [string, string] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [26, -26]);

  return (
    <div ref={ref} className="md:col-span-5">
      <motion.h2
        style={reduced ? undefined : { y }}
        className="font-grotesk text-[34px] font-bold uppercase leading-[0.9] tracking-[-0.045em] text-ink md:sticky md:top-36 md:text-[clamp(30px,3.7vw,54px)]"
      >
        <MaskUp standalone duration={1.3}>
          {lines[0]}
        </MaskUp>
        <MaskUp standalone duration={1.3} delay={0.1}>
          {lines[1]}
        </MaskUp>
      </motion.h2>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="flex w-full select-none flex-col items-center bg-paper text-ink">
      <ScrollProgress />

      {/* ---------- 표제 ---------- */}
      <header className="mb-16 mt-20 flex w-full flex-col items-center px-6 text-center md:mb-24 md:mt-28">
        <h1 className="font-grotesk text-[16px] font-bold uppercase tracking-[0.2em] text-ink md:text-[24px] md:tracking-[0.18em]">
          <MaskUp standalone duration={1.5}>
            ( Vision for Visionary )
          </MaskUp>
        </h1>
        <RevealItem standalone delay={0.28} y={16} blur={5}>
          <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash md:mt-5 md:text-[10px]">
            Vision in Motion, Performance in Action.
          </p>
        </RevealItem>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.2, delay: 0.6, ease: SILK }}
          className="mt-10 block h-px w-[40vw] max-w-[300px] origin-center bg-ink/15 md:mt-12"
        />
      </header>

      {/* ---------- 본문 ---------- */}
      <main className="flex w-full max-w-[1280px] flex-col gap-24 px-6 pb-32 md:gap-36 md:px-14">
        {SECTIONS.map((section, sectionIndex) => (
          <section
            key={section.title.join(' ')}
            className={`grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-10 lg:gap-14 ${
              sectionIndex > 0 ? 'border-t border-line-soft pt-14 md:pt-24' : ''
            }`}
          >
            <SectionTitle lines={section.title} />

            <div className="flex flex-col gap-12 pt-2 md:col-span-7 md:gap-14 md:pt-0">
              {section.groups.map((group, groupIndex) => {
                const t = TYPE[group.lang];
                return (
                  <Reveal
                    key={group.lang}
                    className={`${t.wrap} flex flex-col gap-7`}
                    style={{ opacity: t.opacity }}
                    stagger={0.13}
                    delay={groupIndex * 0.06}
                    amount={0.14}
                  >
                    {group.blocks.map((block) => (
                      <div key={block.heading} className="flex flex-col gap-2">
                        <MaskUp innerClassName={t.heading} duration={1.3}>
                          {block.heading}
                        </MaskUp>
                        <RevealItem y={22} blur={6} duration={1.4}>
                          <p className={t.body}>{block.body}</p>
                        </RevealItem>
                      </div>
                    ))}
                  </Reveal>
                );
              })}
            </div>
          </section>
        ))}
      </main>
    </div>
  );
}
