'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import ShopGrid from '@/components/ShopGrid';
import { matchesShopFilter, parseShopFilter, shopFilterLabel } from '@/lib/catalog';

/**
 * URL(?world=·?category=)을 읽어 상품을 거르는 얇은 껍데기.
 *
 * 필터링은 전부 브라우저에서 일어납니다 — 홈은 정적으로 남고,
 * 드롭다운에서 고르는 순간 서버를 기다리지 않고 그리드가 바로 바뀝니다.
 * (useSearchParams 를 쓰므로 페이지에서 <Suspense>로 감싸야 하고,
 *  그 fallback 이 필터 없는 그리드를 첫 HTML에 실어 줍니다)
 */
export default function FilteredShopGrid({ products }: { products: any[] }) {
  const params = useSearchParams();
  const filter = parseShopFilter(params.get('world'), params.get('category'));

  if (!filter) return <ShopGrid products={products} />;

  const filtered = products.filter((product) => matchesShopFilter(product, filter));

  return (
    <>
      {/* 지금 어느 방에 있는지 — 한 줄의 표식과 전체로 돌아가는 문 */}
      <div className="mb-12 flex items-baseline justify-center gap-6 font-mono text-[9px] uppercase md:mb-16 md:text-[10px]">
        <span className="tracking-[0.34em] text-ink">{shopFilterLabel(filter)}</span>
        <Link
          href="/"
          className="tracking-[0.24em] text-ash transition-colors duration-500 ease-silk hover:text-ink"
        >
          All
        </Link>
      </div>

      {/* key 로 필터마다 그리드를 새로 세웁니다 — 상품들이 계단식으로 다시 떠오릅니다 */}
      <ShopGrid key={`${filter.world ?? ''}-${filter.category ?? ''}`} products={filtered} />
    </>
  );
}
