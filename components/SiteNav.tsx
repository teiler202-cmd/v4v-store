'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getWorld, prefetchRail, setWorld, type WorldId } from '@/components/orb/world';
import { SHOP_CATEGORIES, SHOP_WORLDS } from '@/lib/catalog';

/* -----------------------------------------------------------
   사이트 메뉴 — 두 자리에 같은 메뉴가 놓입니다.
   · TopNav : 모바일·태블릿 — 로고 아래 가로 한 줄
   · RailNav: 데스크톱 — 화면 왼쪽에 걸린 큰 구체(OrbRail) 위에 세로로
   한 화면에는 둘 중 하나만 보입니다(나머지는 display:none이라 낭독에서도 빠집니다).
   ----------------------------------------------------------- */

export const NAV = [
  { href: '/', label: 'Shop' },
  { href: '/archives', label: 'Archives' },
  // 커뮤니티가 모이는 방 — 아카이브와 에세이 사이, 브랜드의 '지금'이 있는 자리입니다.
  { href: '/telegram', label: 'Telegram' },
  { href: '/essay', label: 'Essay' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

/** 두 세계를 알리는 작은 점 — 메뉴에서 컬렉션 이름 곁에 세계의 색이 함께 놓입니다. */
const WORLD_DOT: Record<string, string> = {
  midbar: 'bg-[#c9ab6e]',
  eden: 'bg-[#8fbf98]',
};

/** 고른 뒤에는 문이 닫히도록 — 클릭이 남긴 포커스가 focus-within으로 패널을 붙들지 않게 합니다. */
const releaseFocus = (event: { currentTarget: HTMLElement }) => event.currentTarget.blur();

function useIsActive() {
  const pathname = usePathname();
  return (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href));
}

/**
 * Shop 메뉴 — 마우스를 올리면 세계(컬렉션)와 품목이 스윽 나옵니다.
 * below: 가로 메뉴 아래로 내려옵니다(태블릿). side: 레일에서 오른쪽으로 펼쳐집니다(데스크톱).
 * hover·키보드 포커스 전용이라 터치 화면(모바일)에서는 나타나지 않고,
 * Shop을 누르면 언제나 전체 매장으로 갑니다.
 */
function ShopMenu({ placement }: { placement: 'below' | 'side' }) {
  // below: Shop 글자 바로 아래, 18px 다리(pt)를 건너 내려옵니다.
  // side : 메뉴 열의 오른쪽 끝(Shop 줄은 열 폭만큼 늘여 둠)에서 28px 다리(pl)를 건너 펼쳐집니다 —
  //        긴 항목(ARCHIVES·TELEGRAM)을 가리지 않고, 첫 줄(MIDBAR)이 SHOP과 같은 높이에 섭니다.
  const position =
    placement === 'below'
      ? 'left-1/2 top-full hidden -translate-x-1/2 -translate-y-1.5 pt-[18px] group-hover/shop:translate-y-0 group-focus-within/shop:translate-y-0 md:block'
      : 'left-full -top-[27px] block -translate-x-1.5 pl-7 group-hover/shop:translate-x-0 group-focus-within/shop:translate-x-0';

  return (
    <div
      className={`pointer-events-none absolute z-50 opacity-0 transition-[opacity,translate] delay-200 duration-500 ease-silk group-hover/shop:pointer-events-auto group-hover/shop:opacity-100 group-hover/shop:delay-75 group-focus-within/shop:pointer-events-auto group-focus-within/shop:opacity-100 ${position}`}
    >
      {/* 배경은 거의 불투명한 종이(--v4v-menu-bg) — 이미 불투명하므로 backdrop-blur는 비용만 남아 뺐습니다. */}
      <div className="flex min-w-[172px] flex-col items-center border border-line bg-[var(--v4v-menu-bg)] px-10 pb-7 pt-6 shadow-[0_28px_70px_-34px_rgba(11,11,11,0.42)]">
        {SHOP_WORLDS.map(({ key, label }) => (
          <Link
            key={key}
            href={`/?world=${key}`}
            // 건너가기 전에 그 세계의 큰 구체 그림을 미리 받아 둡니다 — 마우스든 키보드든.
            onPointerEnter={() => {
              if (getWorld() !== key) prefetchRail(key as WorldId);
            }}
            onFocus={() => {
              if (getWorld() !== key) prefetchRail(key as WorldId);
            }}
            onClick={(event) => {
              releaseFocus(event);
              // 상품만 거르는 게 아니라 세계 자체가 함께 건너갑니다 —
              // 공기·구체(로고 옆, 왼쪽 레일)가 그 세계로 물들고, 빛 스윕도 한 번 번집니다.
              if (getWorld() !== key) setWorld(key as WorldId);
            }}
            className="relative py-[7px] font-mono text-[9.5px] uppercase tracking-[0.26em] text-ink transition-opacity duration-500 ease-silk hover:opacity-45"
          >
            {/* 점은 글자 왼쪽 바깥에 띄웁니다 — 이름은 품목들과 같은 축으로 가운데 정렬됩니다 */}
            <span
              aria-hidden
              className={`absolute -left-4 top-1/2 h-[5px] w-[5px] -translate-y-1/2 rounded-full opacity-90 ${WORLD_DOT[key]}`}
            />
            {label}
          </Link>
        ))}

        <span aria-hidden className="my-3.5 h-px w-9 bg-line-soft" />

        {SHOP_CATEGORIES.map(({ key, label }) => (
          <Link
            key={key}
            href={`/?category=${key}`}
            onClick={releaseFocus}
            className="py-[6px] font-mono text-[8.5px] uppercase tracking-[0.24em] text-ash transition-colors duration-500 ease-silk hover:text-ink"
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/** 글자 밑으로 스며드는 한 줄 — 지금 페이지엔 늘, 나머지는 마우스를 올릴 때만. */
function Underline({ active, isShop, className = '' }: { active: boolean; isShop: boolean; className?: string }) {
  return (
    <span
      aria-hidden
      className={`absolute left-0 h-px w-full origin-left bg-ink transition-transform duration-[600ms] ease-silk ${className} ${
        active ? 'scale-x-100' : `scale-x-0 group-hover:scale-x-100 ${isShop ? 'group-hover/shop:scale-x-100' : ''}`
      }`}
    />
  );
}

/** 모바일·태블릿 — 로고 아래 가로 한 줄. 좁은 화면에서는 가로로 밀어 넘깁니다. */
export function TopNav({ className = '' }: { className?: string }) {
  const isActive = useIsActive();
  return (
    /* md 이상에서는 가로 스크롤이 필요 없으므로 overflow를 풀어 드롭다운이 잘리지 않게 합니다. */
    <nav
      aria-label="Main"
      className={`scrollbar-hide flex items-center justify-center gap-[18px] overflow-x-auto whitespace-nowrap px-4 pb-3 md:gap-11 md:overflow-visible md:px-5 md:pb-4 ${className}`}
    >
      {NAV.map(({ href, label }) => {
        const active = isActive(href);
        const isShop = label === 'Shop';
        const link = (
          <Link
            key={isShop ? undefined : href}
            href={href}
            aria-current={active ? 'page' : undefined}
            className={`group relative shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] transition-colors duration-500 ease-silk md:text-[10px] md:tracking-[0.2em] ${
              active ? 'text-ink' : 'text-ash hover:text-ink'
            } ${isShop ? 'group-hover/shop:text-ink' : ''}`}
          >
            {label}
            <Underline active={active} isShop={isShop} className="-bottom-1" />
          </Link>
        );

        if (!isShop) return link;

        // Shop만은 컬렉션·품목이 내려오는 문이 됩니다 — 올리면 열리고, 벗어나면 한 호흡 뒤 닫힙니다.
        return (
          <div key={href} className="group/shop relative shrink-0">
            {link}
            <ShopMenu placement="below" />
          </div>
        );
      })}
    </nav>
  );
}

/**
 * 데스크톱 — 왼쪽 레일의 큰 구체 위에 세로로 놓이는 메뉴.
 * 구체는 계속 돌고 대리석의 짙은 결·동산의 청록 유리가 그 밑을 지나가므로, 글자 자체를 온전한 먹색·
 * Medium으로 세우고 메뉴 뒤에 세계별로 옅은 공기 웅덩이(.v4v-rail-nav::before)를 고정해 둡니다.
 * Shop 메뉴는 오른쪽으로 펼쳐집니다.
 */
export function RailNav({ className = '' }: { className?: string }) {
  const isActive = useIsActive();
  return (
    <nav aria-label="Main" className={className}>
      <ul className="flex flex-col items-start gap-[clamp(14px,2.6vh,24px)]">
        {NAV.map(({ href, label }) => {
          const active = isActive(href);
          const isShop = label === 'Shop';
          return (
            // Shop 줄만 메뉴 열 폭으로 늘립니다 — 글자 오른쪽 빈자리까지 Shop의 자리가 되어,
            // 오른쪽에 펼쳐지는 메뉴로 마우스를 옮기는 길이 끊기지 않습니다.
            <li key={href} className={isShop ? 'group/shop relative self-stretch' : undefined}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                // 구체 위의 글자는 온전한 먹색·Medium — 흐린 먹(ink/70)은 대리석 결에 묻혔습니다.
                // 지금 자리·마우스는 밑줄이 알립니다.
                className="group block py-1 font-mono text-[11.5px] font-medium uppercase tracking-[0.22em] text-ink"
              >
                {/* 밑줄은 글자 폭만큼만 — 줄이 늘어난 Shop에서도 글자 밑에만 긋습니다 */}
                <span className="relative inline-block">
                  {label}
                  <Underline active={active} isShop={isShop} className="-bottom-1" />
                </span>
              </Link>
              {isShop && <ShopMenu placement="side" />}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
