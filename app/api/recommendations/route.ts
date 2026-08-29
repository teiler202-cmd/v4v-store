import { NextResponse } from 'next/server';
import { getProducts } from '@/lib/shopify';

/**
 * 장바구니 서랍의 "추천 상품"용 목록.
 *
 * 예전에는 장바구니 컴포넌트가 lib/shopify.ts 를 직접 불러 썼습니다.
 * 그런데 그 컴포넌트는 브라우저에서 도는 클라이언트 컴포넌트라,
 * 쇼피파이 접속 주소와 액세스 토큰이 자바스크립트 파일 안에 문자열로 박제돼
 * 누구나 개발자도구로 꺼내 볼 수 있었습니다.
 * (게다가 서버 캐시를 못 타고 손님 기기에서 매번 쇼피파이를 직접 불렀습니다)
 *
 * 이제 쇼피파이와의 대화는 전부 서버에서만 일어나고,
 * 브라우저에는 화면에 그릴 최소한의 정보만 건네줍니다.
 */
export const revalidate = 60;

export async function GET() {
  const products = await getProducts();

  const slim = (products as any[]).slice(0, 8).map((product) => ({
    id: product.id,
    title: product.title,
    handle: product.handle,
    priceRange: product.priceRange,
    // 서랍에는 대표 이미지 한 장만 뜹니다 — 나머지는 보낼 이유가 없습니다.
    images: { edges: (product.images?.edges ?? []).slice(0, 1) },
    options: product.options,
    variants: product.variants,
  }));

  return NextResponse.json(
    { products: slim },
    { headers: { 'Cache-Control': 'public, max-age=0, s-maxage=60, stale-while-revalidate=300' } }
  );
}
