'use client';

import { ViewTransition, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SILK } from '@/components/Reveal';
import { sizedImage, sizedSrcSet } from '@/lib/image';

/* 상품 사진은 언제나 불투명 — 배경(공기·오로라·커서 빛)과 블렌드하지 않습니다.
   multiply로 얹으면 세계의 공기색이 사진 전체에 곱해져 제품색이 바뀝니다
   (광야에선 누렇게, 동산에선 민트빛으로).
   호버 교차도 배경이 비치지 않게: 둘째 사진이 첫 사진 '위로' 완전히 차오른 뒤에야
   첫 사진이 빠집니다(--v4v-swap 지연). 반투명 두 장이 겹치는 순간이 없습니다.
   확대는 Tailwind v4의 scale-* 가 개별 속성 `scale`이라, 전이도 transform이 아니라 scale에 겁니다. */
const ZOOM_EASE = 'cubic-bezier(0.16,1,0.3,1)';
const UNDER_LAYER = {
  transition: `opacity 0s linear var(--v4v-swap, 0s), scale 1600ms ${ZOOM_EASE}`,
} as const;
const OVER_LAYER = {
  transition: `opacity 650ms ${ZOOM_EASE}, scale 1600ms ${ZOOM_EASE}`,
} as const;

function TilePhotos({ first, second, title }: { first?: string; second?: string; title: string }) {
  // 둘째 사진이 아직 도착하지 않았으면 교차하지 않습니다 — 첫 사진만 빠지고
  // 빈 액자(공기)만 남는 일이 없게. 하이드레이션 전에 이미 받아 둔 경우는 onLoad가 오지 않아 직접 확인합니다.
  const altRef = useRef<HTMLImageElement>(null);
  const [altReady, setAltReady] = useState(false);
  useEffect(() => {
    const el = altRef.current;
    if (el?.complete && el.naturalWidth > 0) setAltReady(true);
  }, []);
  const swap = Boolean(second) && altReady;

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden">
      {first && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={sizedImage(first, 360)}
          srcSet={sizedSrcSet(first, [240, 360, 480])}
          sizes={"(max-width: 768px) 50vw, 220px"}
          width={240}
          height={300}
          // 첫 방문엔 인트로가 이 그리드를 덮고 있습니다 — 구체 사진이 먼저 오도록 순서를 양보합니다.
          fetchPriority="low"
          alt={title}
          style={UNDER_LAYER}
          className={`absolute inset-0 h-full w-full object-contain group-hover:scale-[1.045] ${
            swap ? 'group-hover:opacity-0 group-hover:[--v4v-swap:650ms]' : ''
          }`}
        />
      )}
      {second && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          ref={altRef}
          src={sizedImage(second, 360)}
          srcSet={sizedSrcSet(second, [240, 360, 480])}
          sizes={"(max-width: 768px) 50vw, 220px"}
          width={240}
          height={300}
          loading="lazy"
          alt={`${title} — alternate view`}
          onLoad={() => setAltReady(true)}
          style={OVER_LAYER}
          className={`absolute inset-0 h-full w-full object-contain opacity-0 group-hover:scale-[1.045] ${
            swap ? 'group-hover:opacity-100' : ''
          }`}
        />
      )}
    </div>
  );
}

/**
 * @param morph 썸네일 → 상세 히어로로 이어지는 공유 요소 모프(ViewTransition) 참여 여부.
 *   Suspense fallback으로 그릴 때는 꺼야 합니다 — 하이드레이션 때 fallback이 본문으로
 *   바뀌는 순간에도 이름이 짝을 이루면 브라우저 최상층(top layer)에 타일 스냅샷이 떠서,
 *   인트로 베일 '위로' 상품 사진이 번쩍 스치는 현상이 생깁니다.
 */
export default function ShopGrid({ products, morph = true }: { products: any[]; morph?: boolean }) {
  if (!products || products.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center font-mono text-[8.5px] uppercase tracking-[0.4em] text-ash">
        No products found
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-x-5 gap-y-14 md:gap-x-10 md:gap-y-24">
      {products.map((product: any, index: number) => {
        const firstImage = product.images?.edges?.[0]?.node?.url;
        const secondImage = product.images?.edges?.[1]?.node?.url;

        const tile = (
          <TilePhotos first={firstImage} second={secondImage} title={product.title} />
        );

        return (
          <motion.div
            key={product.id}
            /* filter(blur) 진입은 쓰지 않습니다 — 일부 합성기가 블러 시점의 래스터를
               캐시해 사진이 계속 흐려 보일 수 있고, 사파리 스크롤 비용도 큽니다. */
            initial={{ opacity: 0, y: 26 }}
            whileInView={{ opacity: 1, y: 0 }}
            /* 화면에 들어오는 순간에만 떠오릅니다 — 아래쪽 상품은 스크롤을 기다립니다.
               같은 줄 안에서는 왼쪽부터 반 박자씩 늦게, 계단처럼. */
            viewport={{ once: true, amount: 0.18, margin: '0px 0px -6% 0px' }}
            transition={{ duration: 1.15, ease: SILK, delay: 0.08 + (index % 4) * 0.08 }}
            /* 타일 폭을 못 박아 두었기 때문에 상품이 늘어나도 옷이 커지지 않습니다 */
            className="w-[calc(50%-10px)] max-w-[240px] md:w-[188px] lg:w-[208px] xl:w-[220px]"
          >
            <Link href={`/products/${product.handle}`} className="group block">
              {morph ? (
                <ViewTransition name={`product-${product.handle}`} default="none" share="v4v-morph">
                  {tile}
                </ViewTransition>
              ) : (
                tile
              )}

              <div className="flex flex-col items-center gap-1.5 pt-5 md:pt-6">
                <h3 className="text-center font-mono text-[8.5px] font-medium uppercase tracking-[0.18em] text-ink transition-opacity duration-500 group-hover:opacity-50 md:text-[9px]">
                  {product.title}
                </h3>
                <p className="text-center font-mono text-[8.5px] tracking-[0.18em] text-ash md:text-[9px]">
                  {product.priceRange.minVariantPrice.currencyCode}{' '}
                  {Math.floor(product.priceRange.minVariantPrice.amount).toLocaleString()}
                </p>
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}
