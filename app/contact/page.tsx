"use client";

import { nanum } from '@/lib/fonts';
import { MaskUp, Reveal, RevealItem, SILK } from '@/components/Reveal';
import { motion } from 'framer-motion';

const CHANNELS = [
  {
    title: 'Customer Service',
    body: [
      '상품, 배송, 결제 및 반품과 관련된 모든 문의는 아래 공식 이메일 창구를 통해 연락해 주시면 신속하게 안내해 드리겠습니다.',
    ],
    note: '운영 시간: 평일 10:00 — 17:00 (점심시간 12:00 — 13:00 / 주말 및 공휴일 휴무)',
    email: 'cs@vision4visionary.com',
  },
  {
    title: 'Partnership & Press',
    body: [
      'V4V와의 브랜드 협업, 입점 제안, 매거진 프레스 등 비즈니스와 관련된 문의는 전용 메일로 남겨주시기 바랍니다.',
    ],
    email: 'partnership@vision4visionary.com',
  },
];

export default function ContactPage() {
  return (
    <div className="flex w-full select-none flex-col items-center bg-paper text-ink">
      {/* 최상단 타이틀 영역 */}
      <header className="mb-16 mt-20 flex w-full flex-col items-center px-6 text-center md:mb-24 md:mt-28">
        <h1 className="font-grotesk text-[16px] font-bold uppercase tracking-[0.2em] text-ink md:text-[24px] md:tracking-[0.18em]">
          <MaskUp standalone duration={1.5}>
            ( Contact )
          </MaskUp>
        </h1>
        <RevealItem standalone delay={0.26} y={16} blur={5}>
          <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash md:mt-5 md:text-[10px]">
            Reach out to Visionary
          </p>
        </RevealItem>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.2, delay: 0.55, ease: SILK }}
          className="mt-10 block h-px w-[40vw] max-w-[300px] origin-center bg-ink/15 md:mt-12"
        />
      </header>

      <main className="flex w-full max-w-[1180px] flex-col gap-20 px-6 pb-32 md:gap-24 md:px-14">
        <Reveal className="grid grid-cols-1 gap-16 md:grid-cols-2 md:gap-24" stagger={0.16} amount={0.12}>
          {CHANNELS.map((channel) => (
            <RevealItem key={channel.title} y={28} className="flex flex-col gap-6">
              <h2 className="font-grotesk text-[21px] font-bold tracking-[-0.035em] text-ink md:text-[25px]">
                {channel.title}
              </h2>

              <div className={`${nanum.className} flex flex-col gap-3 tracking-[-0.01em]`}>
                {channel.body.map((line) => (
                  <p key={line} className="break-keep text-[13px] font-bold leading-[1.85] text-ash md:text-[14px]">
                    {line}
                  </p>
                ))}
                {channel.note && (
                  <p className="break-keep font-mono text-[8.5px] uppercase leading-[2.1] tracking-[0.16em] text-ash/80">
                    {channel.note}
                  </p>
                )}
              </div>

              <a
                href={`mailto:${channel.email}`}
                className="group mt-1 w-fit font-grotesk text-[14px] font-medium tracking-[-0.01em] text-ink md:text-[15.5px]"
              >
                {channel.email}
                <span className="mt-1 block h-px w-full origin-left scale-x-100 bg-ink transition-transform duration-[600ms] ease-silk group-hover:scale-x-0" />
              </a>
            </RevealItem>
          ))}
        </Reveal>

        <Reveal className="grid grid-cols-1 gap-16 border-t border-line-soft pt-16 md:grid-cols-2 md:pt-24" stagger={0.14} amount={0.15}>
          <RevealItem y={26} className="flex flex-col gap-6">
            <h2 className="font-grotesk text-[21px] font-bold tracking-[-0.035em] text-ink md:text-[25px]">
              Headquarters
            </h2>
            <div className="flex flex-col gap-2">
              <p className={`${nanum.className} text-[13px] font-bold text-ash md:text-[14px]`}>
                비전포비저너리 (V4V)
              </p>
              <p className="font-grotesk text-[13px] font-light tracking-[-0.01em] text-ash md:text-[14px]">
                Seoul, Republic of Korea
              </p>
            </div>
          </RevealItem>
        </Reveal>
      </main>
    </div>
  );
}
