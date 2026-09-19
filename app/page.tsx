import { Suspense } from 'react';
import { getProducts } from '@/lib/shopify';
import { getDailyVerse } from '@/lib/verse';
import Intro from '@/components/Intro';
import DailyVerse from '@/components/DailyVerse';
import ShopGrid from '@/components/ShopGrid';
import FilteredShopGrid from '@/components/FilteredShopGrid';

export default async function Home() {
  // 상품과 오늘의 구절을 서버에서 함께 받아옵니다 —
  // 인트로가 끝나는 순간 화면이 이미 채워져 있습니다.
  const [products, verse] = await Promise.all([getProducts(), getDailyVerse()]);

  return (
    <>
      <Intro />

      <div className="w-full select-none text-ink">
        <DailyVerse verse={verse} />

        {/* 상품 그리드 — 옷이 화면을 압도하지 않도록 타일 폭을 묶어둡니다.
            필터(?world=·?category=)는 브라우저가 읽으므로 홈은 정적으로 남습니다 —
            Suspense fallback 이 전체 그리드를 첫 HTML에 그대로 실어 줍니다.
            (fallback은 morph를 끕니다: 하이드레이션 때 fallback→본문 교체가
             ViewTransition을 깨워 타일 스냅샷이 인트로 위로 번쩍이지 않게) */}
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-40 pt-12 md:px-10 md:pt-20">
          <Suspense fallback={<ShopGrid products={products} morph={false} />}>
            <FilteredShopGrid products={products} />
          </Suspense>
        </div>
      </div>
    </>
  );
}
