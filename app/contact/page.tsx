"use client";

import { nanum } from '@/lib/fonts';
import { MaskUp, Reveal, RevealItem, SILK } from '@/components/Reveal';
import { motion } from 'framer-motion';
import SocialLinks from '@/components/SocialLinks';
import Bilingual from '@/components/Bilingual';
import { BRAND, BUSINESS, CONTACT } from '@/lib/brand';

const CHANNELS = [
  {
    title: 'Customer Service',
    titleKo: '고객 문의',
    body: {
      en: 'For anything about products, shipping, payment or returns, write to the address below and we will get back to you promptly.',
      ko: '상품, 배송, 결제 및 반품과 관련된 모든 문의는 아래 공식 이메일 창구를 통해 연락해 주시면 신속하게 안내해 드리겠습니다.',
    },
    note: {
      en: `${CONTACT.hours} · Closed weekends & public holidays · ${CONTACT.phone}`,
      ko: `운영 시간: ${CONTACT.hoursKo} · 고객센터 ${CONTACT.phoneKo}`,
    },
    email: CONTACT.cs,
  },
  {
    title: 'Partnership & Press',
    titleKo: '제휴 및 프레스',
    body: {
      en: 'For brand collaborations, wholesale proposals and press enquiries, please use the dedicated address below.',
      ko: 'V4V와의 브랜드 협업, 입점 제안, 매거진 프레스 등 비즈니스와 관련된 문의는 전용 메일로 남겨주시기 바랍니다.',
    },
    email: CONTACT.partnership,
  },
];

export default function ContactPage() {
  return (
    <div className="flex w-full select-none flex-col items-center text-ink">
      {/* 최상단 타이틀 영역 */}
      <header className="mb-16 mt-20 flex w-full flex-col items-center px-6 text-center md:mb-24 md:mt-28">
        <h1 className="font-grotesk text-[16px] font-bold uppercase tracking-[0.2em] text-ink md:text-[24px] md:tracking-[0.18em]">
          <MaskUp standalone duration={1.5}>
            ( Contact )
          </MaskUp>
        </h1>
        <RevealItem standalone delay={0.26} y={16}>
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
            <RevealItem key={channel.title} y={28} className="flex flex-col gap-5">
              <div className="flex flex-col gap-1.5">
                <h2 className="font-grotesk text-[21px] font-bold tracking-[-0.035em] text-ink md:text-[25px]">
                  {channel.title}
                </h2>
                <span className={`${nanum.className} text-[12px] font-bold tracking-[-0.02em] text-ash md:text-[13px]`}>
                  {channel.titleKo}
                </span>
              </div>

              <Bilingual
                en={channel.body.en}
                ko={channel.body.ko}
                className="text-[13px] leading-[1.75] tracking-[-0.012em] text-ash md:text-[13.5px]"
                koClassName={nanum.className}
              />

              {channel.note && (
                <Bilingual
                  en={channel.note.en}
                  ko={channel.note.ko}
                  className="font-mono text-[8.5px] uppercase leading-[1.95] tracking-[0.1em] text-ash/80"
                />
              )}

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
          <RevealItem y={26} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-grotesk text-[21px] font-bold tracking-[-0.035em] text-ink md:text-[25px]">
                Headquarters
              </h2>
              <span className={`${nanum.className} text-[12px] font-bold tracking-[-0.02em] text-ash md:text-[13px]`}>
                본사
              </span>
            </div>
            <Bilingual
              en={`${BRAND.name} · ${BUSINESS.address}`}
              ko={`${BRAND.nameKo} (${BRAND.short}) · ${BUSINESS.addressKo}`}
              className="text-[13px] leading-[1.75] tracking-[-0.012em] text-ash md:text-[13.5px]"
              koClassName={nanum.className}
            />
            {/* 전자상거래법 제10조 표기 — 사업자등록증과 같은 값이어야 합니다 */}
            <Bilingual
              en={`Representative ${BUSINESS.representative} · Business Reg. No. ${BUSINESS.registrationNo} · Mail-order Licence ${BUSINESS.mailOrderNo}`}
              ko={`대표자 ${BUSINESS.representativeKo} · 사업자등록번호 ${BUSINESS.registrationNo} · 통신판매업신고 ${BUSINESS.mailOrderNoKo}`}
              className="font-mono text-[8.5px] uppercase leading-[1.95] tracking-[0.1em] text-ash/80"
            />
          </RevealItem>

          <RevealItem y={26} className="flex flex-col gap-5">
            <div className="flex flex-col gap-1.5">
              <h2 className="font-grotesk text-[21px] font-bold tracking-[-0.035em] text-ink md:text-[25px]">
                Follow
              </h2>
              <span className={`${nanum.className} text-[12px] font-bold tracking-[-0.02em] text-ash md:text-[13px]`}>
                소셜
              </span>
            </div>
            <SocialLinks />
          </RevealItem>
        </Reveal>
      </main>
    </div>
  );
}
