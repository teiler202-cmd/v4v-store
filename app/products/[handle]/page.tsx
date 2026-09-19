import { notFound } from 'next/navigation';
import { getProduct, getProducts } from '@/lib/shopify';
// 🔥 방금 만든 클라이언트 뷰 컴포넌트를 불러옵니다!
import ProductClientView from '@/components/ProductClientView';

// 상품 페이지는 미리 구워 두고(ISR) 60초마다 다시 확인합니다 — getProduct의 fetch 주기와 같습니다.
//
// 예전엔 generateStaticParams가 없어 요청마다 서버에서 그렸습니다(no-store).
// 그러면 홈의 <Link>가 이 페이지를 미리 받아 둘 수 없어서, 타일을 누를 때마다
// 서버 왕복(운영에선 서울→미국 동부 함수)이 끝나야 화면이 움직였습니다.
// 정적 페이지는 타일이 화면에 보이는 동안 통째로 미리 받아 두므로 누르는 즉시 모프가 시작됩니다.
//
// loading.tsx(스켈레톤)로 대신하면 안 됩니다 — 목적지가 fallback으로 먼저 그려지면
// 썸네일→히어로 모프 짝이 맺어지지 않습니다.
export const revalidate = 60;

// dynamicParams는 기본값(true) 그대로 — 빌드 뒤에 추가된 상품도 첫 방문 때 그려져 캐시되고,
// 없는 상품은 아래 notFound()가 그대로 404를 돌려줍니다.
export async function generateStaticParams() {
  try {
    const products = await getProducts();
    return products.map((p: { handle: string }) => ({ handle: p.handle }));
  } catch {
    // 목록을 못 받은 경우만 지킵니다 — 빈 목록이면 모든 상품이 첫 방문 때 구워집니다.
    // (각 상품을 그리는 getProduct나 홈의 getProducts가 빌드 중 실패하면 빌드는 여전히 멈춥니다)
    return [];
  }
}

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
    <main className="min-h-screen text-ink font-sans">

      {/* 데이터를 통째로 뷰 컴포넌트에 넘겨줍니다 */}
      <ProductClientView product={product} handle={handle} />

    </main>
  );
}
