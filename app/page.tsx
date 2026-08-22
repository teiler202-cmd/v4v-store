import { getProducts } from '@/lib/shopify';
import Intro from '@/components/Intro';
import DailyVerse from '@/components/DailyVerse';
import ShopGrid from '@/components/ShopGrid';

export default async function Home() {
  // 상품은 서버에서 미리 받아옵니다 — 인트로가 끝나는 순간 화면이 이미 채워져 있습니다.
  const products = await getProducts();

  return (
    <>
      <Intro />

      <div className="w-full select-none bg-paper text-ink">
        <DailyVerse />

        {/* 상품 그리드 — 옷이 화면을 압도하지 않도록 타일 폭을 묶어둡니다 */}
        <div className="mx-auto w-full max-w-[1280px] px-5 pb-40 pt-12 md:px-10 md:pt-20">
          <ShopGrid products={products} />
        </div>
      </div>
    </>
  );
}
