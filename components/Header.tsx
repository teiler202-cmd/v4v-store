'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { useAccount } from '@/components/AccountProvider';

const NAV = [
  { href: '/', label: 'Shop' },
  { href: '/archives', label: 'Archives' },
  { href: '/essay', label: 'Essay' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Header() {
  const { cart, setIsCartOpen } = useCart();
  const { customer } = useAccount();
  const totalItems = cart?.reduce((t, i) => t + i.quantity, 0) || 0;
  const pathname = usePathname();
  const [condensed, setCondensed] = useState(false);

  // 스크롤이 시작되면 헤더가 아주 미세하게 낮아지며 배경이 유리처럼 가라앉습니다.
  useEffect(() => {
    const onScroll = () => setCondensed(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header
      className={`v4v-chrome sticky top-0 z-40 w-full border-b bg-paper/85 text-ink backdrop-blur-xl backdrop-saturate-150 transition-[padding,border-color] duration-700 ease-silk ${
        condensed ? 'border-line-soft' : 'border-transparent'
      }`}
    >
      <div
        className={`flex items-center justify-between px-5 md:px-10 transition-[padding] duration-700 ease-silk ${
          condensed ? 'py-2.5 md:py-3' : 'py-4 md:py-6'
        }`}
      >
        <div className="flex w-[30%] justify-start">
          <span className="hidden font-mono text-[8px] uppercase tracking-[0.34em] text-ash md:block">
            V4V
          </span>
        </div>

        <div className="flex w-[40%] justify-center">
          <Link
            href="/"
            aria-label="VISION FOR VISIONARY — Home"
            className="flex items-center justify-center transition-opacity duration-500 ease-silk hover:opacity-45"
          >
            <Image
              src="/v4v-logo-horizontal.png"
              alt="V4V"
              width={400}
              height={60}
              priority
              style={{ height: condensed ? '15px' : '19px', width: 'auto' }}
              className="object-contain transition-[height] duration-700 ease-silk"
            />
          </Link>
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

      <nav className="scrollbar-hide flex items-center justify-center gap-[18px] overflow-x-auto whitespace-nowrap px-4 pb-3 md:gap-11 md:px-5 md:pb-4">
        {NAV.map(({ href, label }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group relative shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-500 ease-silk md:text-[10px] md:tracking-[0.2em] ${
                active ? 'text-ink' : 'text-ash hover:text-ink'
              }`}
            >
              {label}
              <span
                className={`absolute -bottom-1 left-0 h-px w-full origin-left bg-ink transition-transform duration-[600ms] ease-silk ${
                  active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
