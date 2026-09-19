'use client';

import { ViewTransition, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
// SILK는 lib/ease에서 — Reveal에서 가져오면 홈 청크에 Reveal의 스크롤 장치까지 실립니다.
import { SILK } from '@/lib/ease';
import { heroSources, sizedImage, sizedSrcSet } from '@/lib/image';
import { parseModelSpec } from '@/lib/modelSpec';

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

/* 상세 페이지 첫 사진 미리 받기 — 타일을 누르면 React는 상세 히어로 사진이 다 받아질 때까지
   (최대 0.8초 + 전환 중 0.5초) 옛 화면을 붙잡고 있다가 모프를 시작합니다. 사진이 내려앉을 자리가
   비어 있지 않게 하려는 의도라 그 대기는 그대로 두고, 마우스가 타일에 머무는 순간부터 같은 사진을 먼저 받아 둡니다.
   - 주소는 상세 페이지 ZoomImage와 똑같아야 캐시가 맞습니다 → 같은 heroSources를 씁니다.
     모델컷(alt가 'model:'로 시작)은 ModelShot이 원본 주소를 그대로 쓰므로 원본을 받습니다.
   - sizes를 srcset보다 먼저: 사파리는 srcset을 넣는 순간 후보를 고르므로, 순서가 바뀌면 100vw 기준의 큰 사진을 받습니다.
   - 터치에는 걸지 않습니다: 휴대폰에선 그리드 스크롤이 거의 다 타일 위에서 시작돼, 스크롤 한 번에
     상품마다 수백 KB짜리 히어로를 끌어오게 됩니다. (마우스 호버와 키보드 포커스만)
   한 번 받은 주소는 기억하고 이미지 객체도 계속 붙잡아 둡니다 — 상세 페이지에서 React가 히어로의 decode()를
   기다리는데, 풀어 둔 비트맵이 살아 있으면 그 대기가 거의 0이 됩니다. (상품 24개 상한이라 메모리는 묶여 있습니다) */
const warmed = new Map<string, HTMLImageElement>();
let intentTimer: number | undefined;

function warmHero(url?: string, altText?: string | null) {
  if (!url || warmed.has(url)) return;
  const img = new Image();
  img.decoding = 'async';
  img.fetchPriority = 'high';
  if (parseModelSpec(altText)) {
    img.src = url;
  } else {
    const hero = heroSources(url);
    img.sizes = hero.sizes;
    if (hero.srcSet) img.srcset = hero.srcSet;
    img.src = hero.src;
  }
  warmed.set(url, img);
  img.decode().catch(() => {});
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
        const firstAlt: string | null = product.images?.edges?.[0]?.node?.altText ?? null;
        const secondImage = product.images?.edges?.[1]?.node?.url;

        const tile = (
          <TilePhotos first={firstImage} second={secondImage} title={product.title} />
        );

        return (
          <motion.div
            key={product.id}
            /* filter(blur) 진입은 쓰지 않습니다 — 일부 합성기가 블러 시점의 래스터를
               캐시해 사진이 계속 흐려 보일 수 있고, 사파리 스크롤 비용도 큽니다. */
            /* y 대신 transform 문자열 — framer는 y를 자바스크립트로 매 프레임 쓰지만, transform·opacity는
               브라우저 애니메이션(사파리는 Core Animation)으로 넘겨 메인 스레드가 잠깐 막혀도 끊기지 않습니다.
               끝나면 transform을 'none'으로 되돌립니다 — 예전 y:0과 같은 최종 상태(쌓임 맥락 없음). */
            initial={{ opacity: 0, transform: 'translateY(26px)' }}
            whileInView={{ opacity: 1, transform: 'translateY(0px)', transitionEnd: { transform: 'none' } }}
            /* 화면에 들어오는 순간에만 떠오릅니다 — 아래쪽 상품은 스크롤을 기다립니다.
               같은 줄 안에서는 왼쪽부터 반 박자씩 늦게, 계단처럼. */
            viewport={{ once: true, amount: 0.18, margin: '0px 0px -6% 0px' }}
            transition={{ duration: 1.15, ease: SILK, delay: 0.08 + (index % 4) * 0.08 }}
            /* 타일 폭을 못 박아 두었기 때문에 상품이 늘어나도 옷이 커지지 않습니다 */
            className="w-[calc(50%-10px)] max-w-[240px] md:w-[188px] lg:w-[208px] xl:w-[220px]"
          >
            <Link
              href={`/products/${product.handle}`}
              className="group block"
              // 80ms 머무를 때만 — 그리드 위를 스치듯 지나가는 커서로는 받지 않습니다.
              onPointerEnter={(e) => {
                if (e.pointerType !== 'mouse') return;
                window.clearTimeout(intentTimer);
                intentTimer = window.setTimeout(() => warmHero(firstImage, firstAlt), 80);
              }}
              onPointerLeave={() => window.clearTimeout(intentTimer)}
              // 키보드도 같은 80ms — Tab으로 그리드를 훑고 지나가는 동안 타일마다 히어로를 받지 않습니다.
              onFocus={() => {
                window.clearTimeout(intentTimer);
                intentTimer = window.setTimeout(() => warmHero(firstImage, firstAlt), 80);
              }}
              onBlur={() => window.clearTimeout(intentTimer)}
            >
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
