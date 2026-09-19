'use client';

import { motion } from 'framer-motion';
import { COMMUNITY } from '@/lib/brand';
import { nanum } from '@/lib/fonts';
import Bilingual from '@/components/Bilingual';
import { MaskUp, Reveal, RevealItem, SILK, ThreadLine } from '@/components/Reveal';

/**
 * 텔레그램 — 비전을 가진 사람들이 실제로 모이는 방.
 *
 * 이 페이지가 하는 일은 네 가지입니다.
 *   1. 누르면 바로 들어가지는 링크
 *   2. 왜 인스타그램이 아니라 텔레그램인가
 *   3. 들어오면 무엇을 얻는가
 *   4. 텔레그램이 처음인 사람을 위한 가입 → 입장 안내
 *
 * 텔레그램 로고는 파일로 두지 않고 아래에 직접 그렸습니다 —
 * CSP(img-src 'self')가 외부 이미지를 막기도 하고,
 * 벡터라 어느 크기에서도 흐려지지 않습니다.
 */

function TelegramMark({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M21.94 4.3 18.9 19.1c-.23 1.02-.84 1.27-1.7.79l-4.7-3.47-2.27 2.18c-.25.25-.46.46-.94.46l.33-4.78L18.4 6.4c.38-.34-.08-.53-.59-.19L6.05 13.5l-4.63-1.45c-1-.32-1.02-1 .21-1.5l18.1-6.98c.84-.3 1.57.2 1.3 1.73z" />
    </svg>
  );
}

/* ---------------------------------------------------------------
   왜 텔레그램인가
   --------------------------------------------------------------- */
const REASONS = [
  {
    en: 'No algorithm between us',
    ko: '우리 사이에 알고리즘이 없습니다',
    bodyEn:
      'On a feed, a machine decides who hears you. In a room, everyone hears everyone. Nothing is ranked, boosted or buried.',
    bodyKo:
      '피드에서는 기계가 누가 당신의 말을 들을지 정합니다. 방 안에서는 모두가 모두의 말을 듣습니다. 순위도, 밀어주기도, 묻히는 글도 없습니다.',
  },
  {
    en: 'Your number stays yours',
    ko: '전화번호는 당신의 것으로 남습니다',
    bodyEn:
      'Set a username once and other members never see your phone number. You can also hide it from everyone in Settings — Privacy.',
    bodyKo:
      '사용자 이름을 한 번 정해 두면 다른 멤버에게 전화번호가 보이지 않습니다. 설정 — 개인정보에서 아예 모두에게 숨길 수도 있습니다.',
  },
  {
    en: 'Nothing is sold to advertisers',
    ko: '무엇도 광고주에게 팔리지 않습니다',
    bodyEn:
      'There is no ad profile built from what you say here, and no engagement metric anyone is trying to win.',
    bodyKo:
      '이곳에서 한 말로 광고 프로필이 만들어지지 않습니다. 누군가 이기려고 매달릴 지표도 없습니다.',
  },
  {
    en: 'It works everywhere, and it keeps',
    ko: '어디서나 열리고, 사라지지 않습니다',
    bodyEn:
      'Phone, laptop, tablet — the same room, always in sync. Everything said stays searchable, so the archive grows on its own.',
    bodyKo:
      '휴대폰, 노트북, 태블릿 — 같은 방이 항상 이어집니다. 오간 말은 검색되는 채로 남아, 기록이 저절로 쌓입니다.',
  },
];

/* ---------------------------------------------------------------
   들어오면 무엇을 얻는가
   --------------------------------------------------------------- */
const BENEFITS = [
  {
    numeral: 'I',
    en: 'First access to every drop',
    ko: '모든 드롭에 가장 먼저',
    bodyEn: 'Release dates, sizes and quantities land here before anywhere else.',
    bodyKo: '발매 일정과 사이즈, 수량이 다른 어느 곳보다 먼저 이 방에 올라옵니다.',
  },
  {
    numeral: 'II',
    en: 'The work before it is finished',
    ko: '완성되기 전의 작업',
    bodyEn:
      'Fabric swatches, rejected samples, the reasoning behind a decision. The parts a finished product never shows.',
    bodyKo:
      '원단 스와치, 탈락한 샘플, 어떤 결정을 내린 이유. 완성된 제품이 결코 보여주지 않는 부분들입니다.',
  },
  {
    numeral: 'III',
    en: 'Essays first, and answered',
    ko: '에세이를 먼저, 그리고 답이 오가는 곳에서',
    bodyEn:
      'New writing is posted here before the site, and you can argue with it. That conversation shapes the next one.',
    bodyKo:
      '새 글은 사이트보다 먼저 이곳에 올라오고, 반박할 수 있습니다. 그 대화가 다음 글을 만듭니다.',
  },
  {
    numeral: 'IV',
    en: 'People building something',
    ko: '무언가를 만들고 있는 사람들',
    bodyEn:
      'Post what you are working on. Ask for what you are missing. This room exists so that no one has to do it alone.',
    bodyKo:
      '지금 만들고 있는 것을 올리고, 부족한 것을 구하세요. 이 방은 아무도 혼자 하지 않게 하려고 있습니다.',
  },
  {
    numeral: 'V',
    en: 'A voice in what comes next',
    ko: '다음에 올 것에 대한 목소리',
    bodyEn:
      'Colours, cuts, collaborations and open calls are decided with the room, not announced to it.',
    bodyKo:
      '색과 패턴, 협업과 오픈 콜은 방에 통보되는 것이 아니라 방과 함께 정해집니다.',
  },
];

/* ---------------------------------------------------------------
   가입 → 입장
   --------------------------------------------------------------- */
const STEPS = [
  {
    en: 'Install Telegram',
    ko: '텔레그램 설치',
    bodyEn:
      'Search "Telegram" in the App Store or Google Play and install the one by Telegram FZ-LLC. It is free, and there is a desktop app at telegram.org too.',
    bodyKo:
      'App Store나 Google Play에서 "텔레그램"을 검색해 Telegram FZ-LLC가 만든 앱을 설치하세요. 무료이고, telegram.org에서 PC용도 받을 수 있습니다.',
  },
  {
    en: 'Sign up with your number',
    ko: '전화번호로 가입',
    bodyEn:
      'Choose your country, enter your phone number, and type in the code that arrives by SMS. No email, no password.',
    bodyKo:
      '국가를 고르고 전화번호를 입력한 뒤, 문자로 오는 인증 번호를 넣으세요. 이메일도 비밀번호도 필요하지 않습니다.',
  },
  {
    en: 'Set a username',
    ko: '사용자 이름 정하기',
    bodyEn:
      'Settings — Edit Profile — Username. Do this before joining: once you have a username, other members see that instead of your phone number.',
    bodyKo:
      '설정 — 프로필 수정 — 사용자 이름. 들어오기 전에 해두세요. 사용자 이름이 있으면 다른 멤버에게 전화번호 대신 그것이 보입니다.',
  },
  {
    en: 'Hide your number',
    ko: '전화번호 숨기기',
    bodyEn:
      'Settings — Privacy and Security — Phone Number — set "Who can see my phone number" to Nobody. One tap, and it is done for good.',
    bodyKo:
      '설정 — 개인정보 및 보안 — 전화번호 — "내 전화번호를 볼 수 있는 사람"을 아무도 없음으로. 한 번만 해두면 끝입니다.',
  },
  {
    en: 'Open the invite and press Join',
    ko: '초대 링크를 열고 참여 누르기',
    bodyEn:
      'Tap the button on this page. Telegram opens, shows the room, and a Join button appears at the bottom. That is all.',
    bodyKo:
      '이 페이지의 버튼을 누르세요. 텔레그램이 열리며 방이 보이고, 아래에 참여 버튼이 나타납니다. 그게 전부입니다.',
  },
  {
    en: 'Say who you are',
    ko: '당신이 누구인지 말하기',
    bodyEn:
      'One line is enough: your name, and the one thing you are building. Nobody here is a stranger for long.',
    bodyKo:
      '한 줄이면 충분합니다. 이름, 그리고 지금 만들고 있는 하나. 이곳에서 오래 낯선 사람으로 남는 이는 없습니다.',
  },
];

/* ---------------------------------------------------------------
   방의 규칙
   --------------------------------------------------------------- */
const RULES = [
  { en: 'Build, do not broadcast.', ko: '광고하지 말고, 만드세요.' },
  { en: 'Disagree with the idea, never the person.', ko: '생각에 반대하되, 사람을 공격하지 마세요.' },
  { en: 'What is said here is not repeated outside.', ko: '이곳의 말은 밖으로 옮기지 않습니다.' },
  { en: 'Ask for help before you need it.', ko: '필요해지기 전에 도움을 구하세요.' },
];

export default function TelegramPage() {
  const invite = COMMUNITY.telegram;

  return (
    <div className="flex w-full flex-col items-center text-ink">
      {/* ---------- 표제 ---------- */}
      <header className="mb-14 mt-20 flex w-full flex-col items-center px-6 text-center md:mb-20 md:mt-28">
        <h1 className="font-grotesk text-[16px] font-bold uppercase tracking-[0.2em] text-ink md:text-[24px] md:tracking-[0.18em]">
          <MaskUp standalone duration={1.5}>
            ( Telegram )
          </MaskUp>
        </h1>
        <RevealItem standalone delay={0.26} y={16}>
          <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash md:mt-5 md:text-[10px]">
            The room where visionaries gather
          </p>
        </RevealItem>
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 2.2, delay: 0.55, ease: SILK }}
          className="mt-10 block h-px w-[40vw] max-w-[300px] origin-center bg-ink/15 md:mt-12"
        />
      </header>

      <main className="flex w-full max-w-[1180px] flex-col gap-24 px-6 pb-32 md:gap-32 md:px-14">
        {/* ---------- 들어가는 문 ---------- */}
        <Reveal className="flex flex-col items-center gap-7 text-center" stagger={0.14} amount={0.2}>
          <RevealItem y={20}>
            <Bilingual
              en="A brand ends at the product. A culture does not. This is where ours continues — a single room, no feed, no algorithm, everyone building something."
              ko="브랜드는 제품에서 끝나지만 문화는 그렇지 않습니다. 우리의 문화가 이어지는 곳입니다. 피드도 알고리즘도 없는 하나의 방, 저마다 무언가를 만들고 있는 사람들."
              className="mx-auto max-w-[560px] text-[13px] leading-[1.85] tracking-[-0.012em] text-ash md:text-[14px]"
              koClassName={`${nanum.className} break-keep`}
            />
          </RevealItem>

          <RevealItem y={24}>
            <a
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 bg-ink px-9 py-4 font-mono text-[9.5px] uppercase tracking-[0.26em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 md:px-11 md:text-[10px]"
            >
              <TelegramMark className="h-[15px] w-[15px] transition-transform duration-700 ease-silk group-hover:translate-x-0.5" />
              <Bilingual en="Join the room" ko="방에 들어가기" inline className="justify-center" />
            </a>
          </RevealItem>

          <RevealItem y={16}>
            <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
              {COMMUNITY.telegramLabel} · Free · No account with us required
            </p>
          </RevealItem>
        </Reveal>

        {/* ---------- 왜 텔레그램인가 ---------- */}
        <section className="grid grid-cols-1 gap-10 border-t border-line-soft pt-16 md:grid-cols-12 md:gap-10 md:pt-24 lg:gap-14">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-36">
              <RevealItem standalone y={10} duration={1} className="mb-4 md:mb-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
                  Why here
                </span>
              </RevealItem>
              <h2 className="font-grotesk text-[34px] font-bold uppercase leading-[0.9] tracking-[-0.045em] text-ink md:text-[clamp(30px,3.7vw,54px)]">
                <MaskUp standalone duration={1.4}>
                  Why
                </MaskUp>
                <MaskUp standalone duration={1.4} delay={0.12}>
                  Telegram
                </MaskUp>
              </h2>
            </div>
          </div>

          <div className="relative flex flex-col gap-9 pt-2 md:col-span-7 md:gap-11 md:pt-0">
            <ThreadLine className="-left-5 hidden md:block" />

            <Reveal className="flex flex-col gap-9 md:gap-11" stagger={0.13} amount={0.14}>
              {REASONS.map((reason) => (
                <RevealItem key={reason.en} y={22} className="flex flex-col gap-2">
                  <h3 className="font-grotesk text-[19px] font-bold leading-[1.15] tracking-[-0.032em] text-ink md:text-[23px]">
                    {reason.en}
                  </h3>
                  <span
                    className={`${nanum.className} text-[13px] font-bold leading-[1.5] tracking-[-0.02em] text-ash/80 break-keep md:text-[14px]`}
                  >
                    {reason.ko}
                  </span>
                  <Bilingual
                    en={reason.bodyEn}
                    ko={reason.bodyKo}
                    className="mt-1.5 text-[13px] leading-[1.75] tracking-[-0.012em] text-ash md:text-[13.5px]"
                    koClassName={`${nanum.className} break-keep`}
                  />
                </RevealItem>
              ))}
            </Reveal>

            {/* 과장하지 않습니다 — 정직한 한 줄이 신뢰를 만듭니다 */}
            <RevealItem standalone y={18}>
              <Bilingual
                en="One honest note: group chats on Telegram are encrypted to the server, not end to end — only one-to-one Secret Chats are. Treat this room as a private gathering, not a vault. Nothing you would not say aloud in a room of friends."
                ko="한 가지는 솔직히 적어 둡니다. 텔레그램의 그룹 대화는 서버까지 암호화되지만 종단간 암호화는 아닙니다 — 1:1 비밀 대화만 그렇습니다. 이 방은 금고가 아니라 사적인 모임으로 여겨 주세요. 친구들 앞에서 소리 내어 말하지 않을 것은 이곳에도 적지 마세요."
                className="border-l border-line pl-5 text-[12px] leading-[1.85] tracking-[-0.01em] text-ash md:text-[12.5px]"
                koClassName={`${nanum.className} break-keep`}
              />
            </RevealItem>
          </div>
        </section>

        {/* ---------- 무엇을 얻는가 ---------- */}
        <section className="grid grid-cols-1 gap-10 border-t border-line-soft pt-16 md:grid-cols-12 md:gap-10 md:pt-24 lg:gap-14">
          <div className="md:col-span-5">
            <div className="md:sticky md:top-36">
              <RevealItem standalone y={10} duration={1} className="mb-4 md:mb-5">
                <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
                  What you get
                </span>
              </RevealItem>
              <h2 className="font-grotesk text-[34px] font-bold uppercase leading-[0.9] tracking-[-0.045em] text-ink md:text-[clamp(30px,3.7vw,54px)]">
                <MaskUp standalone duration={1.4}>
                  Inside
                </MaskUp>
                <MaskUp standalone duration={1.4} delay={0.12}>
                  The Room
                </MaskUp>
              </h2>
            </div>
          </div>

          <Reveal
            className="flex flex-col md:col-span-7"
            stagger={0.12}
            amount={0.12}
          >
            {BENEFITS.map((benefit) => (
              <RevealItem
                key={benefit.en}
                y={22}
               
                className="flex gap-5 border-b border-line-soft py-6 first:pt-0 last:border-0 md:gap-8 md:py-8"
              >
                <span className="mt-1 shrink-0 font-mono text-[9px] uppercase tracking-[0.28em] text-ash">
                  {benefit.numeral}
                </span>
                <div className="flex flex-col gap-2">
                  <h3 className="font-grotesk text-[17px] font-bold leading-[1.2] tracking-[-0.03em] text-ink md:text-[20px]">
                    {benefit.en}
                  </h3>
                  <span
                    className={`${nanum.className} text-[12.5px] font-bold leading-[1.5] tracking-[-0.02em] text-ash/80 break-keep md:text-[13.5px]`}
                  >
                    {benefit.ko}
                  </span>
                  <Bilingual
                    en={benefit.bodyEn}
                    ko={benefit.bodyKo}
                    className="mt-1 text-[12.5px] leading-[1.75] tracking-[-0.012em] text-ash md:text-[13px]"
                    koClassName={`${nanum.className} break-keep`}
                  />
                </div>
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* ---------- 가입 안내 ---------- */}
        <section className="flex flex-col gap-12 border-t border-line-soft pt-16 md:gap-16 md:pt-24">
          <div className="flex flex-col items-center gap-4 text-center">
            <RevealItem standalone y={10} duration={1}>
              <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
                Step by step
              </span>
            </RevealItem>
            <h2 className="font-grotesk text-[28px] font-bold uppercase leading-[0.95] tracking-[-0.04em] text-ink md:text-[40px]">
              <MaskUp standalone duration={1.4}>
                How to join
              </MaskUp>
            </h2>
            <RevealItem standalone y={16}>
              <Bilingual
                en="Never used Telegram before? It takes about two minutes, and you will not need an email or a password."
                ko="텔레그램이 처음이신가요? 2분이면 됩니다. 이메일도 비밀번호도 필요하지 않습니다."
                className="mx-auto max-w-[480px] text-[12.5px] leading-[1.8] tracking-[-0.012em] text-ash md:text-[13px]"
                koClassName={`${nanum.className} break-keep`}
              />
            </RevealItem>
          </div>

          <Reveal
            className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3"
            stagger={0.1}
            amount={0.1}
          >
            {STEPS.map((step, index) => (
              <RevealItem
                key={step.en}
                y={20}
               
                className="flex flex-col gap-3 p-7 md:p-8"
              >
                <span className="font-mono text-[9px] uppercase tracking-[0.28em] tabular-nums text-ash">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h3 className="font-grotesk text-[16px] font-bold leading-[1.2] tracking-[-0.03em] text-ink md:text-[17px]">
                  {step.en}
                </h3>
                <span
                  className={`${nanum.className} text-[12px] font-bold leading-[1.5] tracking-[-0.02em] text-ash/80 break-keep`}
                >
                  {step.ko}
                </span>
                <Bilingual
                  en={step.bodyEn}
                  ko={step.bodyKo}
                  className="mt-1 text-[12px] leading-[1.8] tracking-[-0.012em] text-ash"
                  koClassName={`${nanum.className} break-keep`}
                />
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* ---------- 방의 규칙 ---------- */}
        <section className="flex flex-col items-center gap-10 border-t border-line-soft pt-16 md:pt-24">
          <RevealItem standalone y={10} duration={1}>
            <span className="font-mono text-[9px] uppercase tracking-[0.34em] text-ash">
              House rules
            </span>
          </RevealItem>

          <Reveal
            className="flex w-full max-w-[720px] flex-col"
            stagger={0.11}
            amount={0.15}
          >
            {RULES.map((rule, index) => (
              <RevealItem
                key={rule.en}
                y={18}
               
                className="flex items-baseline gap-5 border-b border-line-soft py-5 last:border-0 md:gap-8"
              >
                <span className="shrink-0 font-mono text-[9px] tabular-nums text-ash">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <Bilingual
                  en={rule.en}
                  ko={rule.ko}
                  className="text-[14px] leading-[1.6] tracking-[-0.02em] text-ink md:text-[16px]"
                  koClassName={`${nanum.className} font-bold break-keep`}
                />
              </RevealItem>
            ))}
          </Reveal>
        </section>

        {/* ---------- 닫는 문 ---------- */}
        <Reveal
          className="flex flex-col items-center gap-7 border-t border-line-soft pt-16 text-center md:pt-24"
          stagger={0.14}
          amount={0.2}
        >
          <RevealItem y={20}>
            <h2 className="font-grotesk text-[22px] font-bold uppercase leading-[1.05] tracking-[-0.04em] text-ink md:text-[32px]">
              One vision is a thought.
              <br />
              A hundred is a culture.
            </h2>
          </RevealItem>

          <RevealItem y={18}>
            <Bilingual
              en="Culture reaches deeper into a life than any law or institution. That is why we are building one, and why it starts with a room."
              ko="문화는 어떠한 법과 제도보다 삶에 깊이 닿습니다. 우리가 문화를 만들려는 이유이고, 그것이 하나의 방에서 시작되는 이유입니다."
              className="mx-auto max-w-[520px] text-[13px] leading-[1.85] tracking-[-0.012em] text-ash md:text-[13.5px]"
              koClassName={`${nanum.className} break-keep`}
            />
          </RevealItem>

          <RevealItem y={22}>
            <a
              href={invite}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 border border-ink px-9 py-4 font-mono text-[9.5px] uppercase tracking-[0.26em] text-ink transition-colors duration-700 ease-silk hover:bg-ink hover:text-paper md:px-11 md:text-[10px]"
            >
              <TelegramMark className="h-[15px] w-[15px] transition-transform duration-700 ease-silk group-hover:translate-x-0.5" />
              <Bilingual en="Join the room" ko="방에 들어가기" inline className="justify-center" />
            </a>
          </RevealItem>
        </Reveal>
      </main>
    </div>
  );
}
