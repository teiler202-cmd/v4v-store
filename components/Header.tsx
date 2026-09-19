'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/CartProvider';
import { useAccount } from '@/components/AccountProvider';
import HeaderOrb from '@/components/HeaderOrb';
import { TopNav } from '@/components/SiteNav';

export default function Header() {
  const { cart, setIsCartOpen } = useCart();
  const { customer } = useAccount();
  const totalItems = cart?.reduce((t, i) => t + i.quantity, 0) || 0;

  return (
    <header
      /* 상자 없는 헤더 — 오로라 캔버스 위에 글자가 그대로 놓입니다.
         유리·보더·backdrop-blur를 걷어내고(사파리 스크롤 최대 비용) 스크림 그라디언트만 남깁니다:
         공기색이 위에서 아래로 풀려 스크롤 콘텐츠와의 겹침을 부드럽게 가라앉히고, 경계선은 없습니다.
         높이도 한 값으로 고정 — 스크롤 순간 padding·height가 움직이며 문서 전체를
         다시 놓던(reflow) 예전 'condensed' 전환이 스크롤 첫 프레임을 끊던 원인이었습니다.
         데스크톱(lg~)에서는 메뉴가 왼쪽 레일의 큰 구체(OrbRail) 위로 옮겨 가고,
         이 줄에는 로고·세계 스위치·계정·가방만 남습니다. 폭은 레일을 뺀 본문 폭입니다(body 여백). */
      className="v4v-chrome v4v-scrim v4v-scrim-rail sticky top-0 z-40 w-full text-ink"
    >
      <div className="flex items-center justify-between px-5 py-3 md:px-10 md:py-4">
        <div className="flex w-[30%] justify-start" />

        <div className="flex w-[40%] justify-center">
          <div className="relative flex min-w-0 items-center">
            {/* 세계 스위치(구체) — 로고 바로 왼쪽, 로고의 세로 가운데에 맞춰 섭니다.
                로고 높이(18px·모바일 10px)에 맞추면 너무 작아 누르기도 알아보기도 어려워,
                심볼 + 로고타입 한 벌처럼 44px(모바일 28px)로 키웠습니다 — 헤더 줄 높이 안에 들어갑니다.
                흐름에서 빼 두어(absolute) 로고가 제자리(본문 가운데)를 지킵니다. */}
            <HeaderOrb className="absolute right-full top-1/2 mr-2 h-7 w-7 -translate-y-1/2 md:mr-3 md:h-11 md:w-11" />
            <Link
              href="/"
              aria-label="VISION FOR VISIONARY — Home"
              className="flex min-w-0 items-center justify-center transition-opacity duration-500 ease-silk hover:opacity-45"
            >
              {/* 폭 248px(높이 18px), 좁은 화면에선 칸에 맞춰 비율대로 줄어듭니다 —
                  높이가 글자에 딱 맞아야 옆 구체가 같은 높이로 섭니다. (너비·높이 속성은 실제 비율 1377:100) */}
              <Image
                src="/v4v-logo-horizontal.png"
                alt="V4V"
                width={400}
                height={29}
                priority
                style={{ width: '248px', height: 'auto' }}
                className="block max-w-full"
              />
            </Link>
          </div>
        </div>

        <div className="flex w-[30%] items-center justify-end gap-4 md:gap-5">
          {/* 마이페이지 — 로그인 전에는 로그인 화면으로, 로그인 후에는 마이페이지로 이어집니다.
              (/account 가 서버에서 세션을 확인해 알아서 갈라줍니다) */}
          <Link
            href="/account"
            aria-label={customer ? 'My account' : 'Sign in'}
            title={customer ? customer.displayName || customer.email : 'Sign in'}
            className="relative flex items-center text-ink transition-opacity duration-300 hover:opacity-45"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-[15px] w-[15px] md:h-4 md:w-4"
              aria-hidden
            >
              <circle cx="12" cy="8.2" r="3.9" />
              <path d="M4.6 20.2c0-3.7 3.3-6.2 7.4-6.2s7.4 2.5 7.4 6.2" />
            </svg>
            {customer && (
              <span
                aria-hidden
                className="absolute -right-[3px] -top-[1px] h-[3px] w-[3px] rounded-full bg-ink"
              />
            )}
          </Link>

          <button
            onClick={() => setIsCartOpen(true)}
            className="font-mono text-[9px] uppercase tracking-[0.24em] text-ink transition-opacity duration-300 hover:opacity-45 md:text-[10px]"
          >
            Bag<span className="ml-1 tabular-nums text-ash">({totalItems})</span>
          </button>
        </div>
      </div>

      {/* 모바일·태블릿의 메뉴 — 데스크톱에서는 왼쪽 레일의 구체 위로 옮겨 갑니다. */}
      <TopNav className="lg:hidden" />
    </header>
  );
}
