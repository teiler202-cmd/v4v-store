import { notFound } from 'next/navigation';
import { getProduct } from '@/lib/shopify';
// 🔥 방금 만든 클라이언트 뷰 컴포넌트를 불러옵니다!
import ProductClientView from '@/components/ProductClientView'; 

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const handle = resolvedParams.handle;
  const product = await getProduct(handle);

  // 없는 상품은 진짜 404로 응답합니다.
  // 예전에는 "상품 없음" 화면을 보여주면서도 HTTP 200을 돌려줘서,
  // 검색엔진이 이 빈 페이지를 정상 페이지로 알고 색인했습니다.
  //
  // (쇼피파이 통신이 실패한 경우는 예외로 올라가 app/error.tsx 가 받습니다 —
  //  장애를 404로 둔갑시키지 않기 위해 둘을 구분합니다)
  if (!product) notFound();

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-zinc-200 selection:text-black">
      
      {/* 데이터를 통째로 뷰 컴포넌트에 넘겨줍니다 */}
      <ProductClientView product={product} handle={handle} />
      
    </main>
  );
}