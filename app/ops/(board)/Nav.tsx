'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TABLES, TABLE_ORDER } from '@/lib/ops/schema';

/**
 * 위쪽 한 줄에 모든 표.
 *
 * 왼쪽 기둥을 쓰다가 위로 올렸습니다. 첫 화면이 '한 화면에 다 보이는 흐름'이
 * 되면서 세로가 한 픽셀도 아깝기 때문입니다. 가로는 넓고, 표 이름은 짧습니다.
 *
 * 지금 있는 곳만 잉크색입니다 — 나머지는 전부 재색. 어디에 있는지 묻지 않아도
 * 알 수 있는 것이 메뉴가 하는 유일한 일입니다.
 */
export default function Nav() {
  const pathname = usePathname();

  const items = [
    { href: '/ops', label: '흐름' },
    ...TABLE_ORDER.map((name) => ({ href: `/ops/${name}`, label: TABLES[name].label })),
    { href: '/ops/docs', label: '문서' },
  ];

  return (
    <nav className="scrollbar-hide -mx-1 flex min-w-0 flex-1 items-center gap-x-3 overflow-x-auto px-1">
      {items.map((item) => {
        const active =
          item.href === '/ops' ? pathname === '/ops' : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={`shrink-0 whitespace-nowrap font-mono text-[10.5px] transition-colors duration-200 ${
              active ? 'text-ink' : 'text-ash hover:text-ink'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
