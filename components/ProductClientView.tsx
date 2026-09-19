'use client';

import { useEffect, useRef, useState } from 'react';
import { ViewTransition } from 'react';
import Link from 'next/link';
import ProductForm from '@/components/ProductForm';
import Bilingual from '@/components/Bilingual';
import { CONTACT } from '@/lib/brand';
import ModelShot from '@/components/ModelShot';
import { parseModelSpec } from '@/lib/modelSpec';
import { sizedImage, sizedSrcSet } from '@/lib/image';

// 기존 backgroundSize: '220%'와 같은 배율 — 시각 결과를 그대로 유지하기 위한 상수입니다.
const ZOOM_SCALE = 2.2;

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  // 사파리 프레임 드랍의 주범이 mousemove마다의 측정 + setState라서,
  // rect는 진입 시 1회만 재고 좌표는 ref에만 적은 뒤 rAF에서 transform으로 직접 그립니다.
  const zoomImgRef = useRef<HTMLImageElement | null>(null);
  const rectRef = useRef<DOMRect | null>(null);
  // 확대 이미지의 무배율 레이아웃 높이 — width 100%·height auto라 컨테이너와 다를 수 있어 따로 캐시합니다.
  const zoomHeightRef = useRef(0);
  const posRef = useRef({ x: 0.5, y: 0.5 });
  const rafRef = useRef<number | null>(null);

  const paint = () => {
    rafRef.current = null;
    const rect = rectRef.current;
    const img = zoomImgRef.current;
    if (!rect || !img) return;
    // 진입 시점에 원본이 아직 로딩 중이었다면 높이가 0으로 잡힙니다 — 잡힐 때까지만 다시 잽니다.
    if (zoomHeightRef.current === 0) zoomHeightRef.current = img.offsetHeight;
    const { x, y } = posRef.current;
    // transform-origin 좌상단 기준이라 backgroundPosition %와 같은 정렬이 됩니다 —
    // 이미지의 x% 지점을 컨테이너의 x% 지점으로 밀어내는 식. 컴포지터 전용 경로라 리페인트가 없습니다.
    const tx = x * (rect.width - ZOOM_SCALE * rect.width);
    const ty = y * (rect.height - ZOOM_SCALE * zoomHeightRef.current);
    img.style.transform = `translate3d(${tx}px, ${ty}px, 0) scale(${ZOOM_SCALE})`;
  };

  const schedule = () => {
    // 프레임당 1회만 — 이벤트가 몇 번 오든 그리기는 다음 프레임에 한 번입니다.
    if (rafRef.current === null) rafRef.current = requestAnimationFrame(paint);
  };

  // 커서를 사진 위에 둔 채 휠 스크롤하면 요소가 움직여도 mouseenter는 다시 오지 않습니다 —
  // 캐시한 rect가 낡아 초점이 어긋나므로, 스크롤·리사이즈 순간에만 무효화하고
  // 다음 mousemove에서 한 번 다시 잽니다. (움직임 없는 프레임엔 측정 비용 0)
  const invalidateRect = () => {
    rectRef.current = null;
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsZoomed(true);
    rectRef.current = e.currentTarget.getBoundingClientRect();
    zoomHeightRef.current = zoomImgRef.current?.offsetHeight ?? 0;
    window.addEventListener('scroll', invalidateRect, { passive: true });
    window.addEventListener('resize', invalidateRect);
    schedule();
  };

  const handleMouseLeave = () => {
    setIsZoomed(false);
    window.removeEventListener('scroll', invalidateRect);
    window.removeEventListener('resize', invalidateRect);
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    let rect = rectRef.current;
    if (!rect) {
      rect = e.currentTarget.getBoundingClientRect();
      rectRef.current = rect;
    }
    posRef.current = {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
    schedule();
  };

  useEffect(
    () => () => {
      // 언마운트 뒤 rAF가 떠 있으면 사라진 DOM을 만지게 되므로 정리합니다.
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      window.removeEventListener('scroll', invalidateRect);
      window.removeEventListener('resize', invalidateRect);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden md:cursor-crosshair"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* 사진은 블렌드 없이 불투명하게 — 공기·오로라·커서 빛이 제품색에 섞이지 않습니다.
          확대 중에도 이 사진은 그대로 깔려 있어, 확대 레이어가 페이드되는 동안
          두 장 사이로 배경이 비치는 순간이 없습니다. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sizedImage(src, 900)}
        srcSet={sizedSrcSet(src, [640, 900, 1280])}
        sizes="(max-width: 768px) 100vw, 620px"
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        ref={zoomImgRef}
        // 확대 레이어만 원본 해상도를 씁니다 — 여기서는 화질이 곧 기능입니다.
        src={sizedImage(src, 1600)}
        // 휴대폰에선 display:none(확대 없음) — lazy라야 1600px 원본을 받지 않습니다.
        // 받는 중이어도 아래 사진이 불투명하게 깔려 있어 빈칸이 비치지 않습니다.
        loading="lazy"
        alt=""
        aria-hidden
        className={`pointer-events-none absolute left-0 top-0 hidden w-full origin-top-left transition-opacity duration-300 ease-silk will-change-transform md:block ${
          isZoomed ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}

type ProductImage = { url: string; altText: string | null };

export default function ProductClientView({ product, handle }: { product: any; handle: string }) {
  const images: ProductImage[] = (product.images?.edges ?? []).map((edge: any) => ({
    url: edge.node.url,
    altText: edge.node.altText ?? null,
  }));
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);
  // 스크롤마다 clientWidth를 읽으면 레이아웃 강제 계산이 사파리 스크롤을 끊어서,
  // 폭은 ref에 캐시해 두고(resize 때만 갱신) 인덱스 갱신도 프레임당 1회로 묶습니다.
  const galleryRef = useRef<HTMLDivElement | null>(null);
  const galleryWidthRef = useRef(0);
  const scrollRafRef = useRef<number | null>(null);

  useEffect(() => {
    const measure = () => {
      galleryWidthRef.current = galleryRef.current?.clientWidth ?? 0;
    };
    measure();
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      if (scrollRafRef.current !== null) cancelAnimationFrame(scrollRafRef.current);
    };
  }, []);

  const handleThumbnailClick = (idx: number) => {
    setSelectedIdx(idx);
    imageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const handleScroll = () => {
    if (scrollRafRef.current !== null) return;
    scrollRafRef.current = requestAnimationFrame(() => {
      scrollRafRef.current = null;
      const el = galleryRef.current;
      const width = galleryWidthRef.current;
      if (el && width > 0) {
        // 같은 인덱스면 React가 리렌더를 건너뛰므로 결과 동작은 이전과 같습니다.
        setSelectedIdx(Math.round(el.scrollLeft / width));
      }
    });
  };

  return (
    <div className="mx-auto max-w-[1180px] pb-24 pt-4 md:px-10 md:pt-12">
      <div className="px-6 pb-6 md:px-0 md:pb-10">
        <Link
          href="/"
          className="font-mono text-[8.5px] uppercase tracking-[0.28em] text-ash transition-colors duration-500 ease-silk hover:text-ink md:text-[9px]"
        >
          ← Shop
        </Link>
      </div>

      <div className="flex flex-col gap-8 md:flex-row md:justify-center md:gap-14 lg:gap-20">
        {/* 📸 좌측 영역 */}
        <div className="relative flex w-full flex-col md:w-[48%] md:max-w-[500px]">
          <div
            ref={galleryRef}
            className="scrollbar-hide flex w-full snap-x snap-mandatory gap-1 overflow-x-auto md:block md:snap-none md:gap-0 md:overflow-visible"
            onScroll={handleScroll}
          >
            {images.map((image: ProductImage, idx: number) => {
              // 대체 텍스트가 'model:'로 시작하면 모델컷으로 보고 스펙 주석을 답니다.
              const spec = parseModelSpec(image.altText);
              const frame = spec ? (
                <ModelShot src={image.url} alt={`${product.title} — model`} spec={spec} />
              ) : (
                <ZoomImage src={image.url} alt={`${product.title}-${idx}`} />
              );

              return (
                <div
                  key={idx}
                  ref={(el) => {
                    imageRefs.current[idx] = el;
                  }}
                  className="w-full min-w-full shrink-0 snap-center md:mb-3 md:min-w-0 md:last:mb-0"
                >
                  {idx === 0 ? (
                    <ViewTransition name={`product-${handle}`} default="none" share="v4v-morph">
                      <div>{frame}</div>
                    </ViewTransition>
                  ) : (
                    frame
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-5 flex justify-center gap-2 md:hidden">
            {images.map((_, idx) => (
              <span
                key={idx}
                className={`h-1 w-1 rounded-full transition-colors duration-500 ${
                  selectedIdx === idx ? 'bg-ink' : 'bg-ink/20'
                }`}
              />
            ))}
          </div>
        </div>

        {/* 🗂️ 우측 영역 (텍스트 및 폼) */}
        <div className="relative w-full px-6 md:w-[42%] md:max-w-[430px] md:px-0">
          <div className="flex flex-col gap-6 md:sticky md:top-32 md:flex-row md:gap-8">
            <div className="hidden w-11 shrink-0 flex-col gap-2 md:flex">
              {images.map((image: ProductImage, idx: number) => (
                <button
                  key={idx}
                  onClick={() => handleThumbnailClick(idx)}
                  aria-label={`View image ${idx + 1}`}
                  className={`group/thumb aspect-[4/5] w-full cursor-pointer border-b transition-colors duration-500 ease-silk ${
                    selectedIdx === idx ? 'border-ink' : 'border-transparent'
                  }`}
                >
                  {/* 흐리게 물러선 썸네일도 색이 바뀌지 않도록 — 반투명 사진 뒤에는 공기 대신
                      흰 종이를 깝니다. 옅어질 뿐, 세계의 색이 비쳐 물들지는 않습니다. */}
                  <span className="block h-full w-full bg-white">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={sizedImage(image.url, 96)}
                      srcSet={sizedSrcSet(image.url, [96, 144])}
                      sizes="44px"
                      width={44}
                      height={55}
                      loading="lazy"
                      alt=""
                      className={`h-full w-full object-cover transition-opacity duration-500 ease-silk ${
                        selectedIdx === idx ? 'opacity-100' : 'opacity-40 group-hover/thumb:opacity-100'
                      }`}
                    />
                  </span>
                </button>
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-9 md:gap-11">
              <div className="flex flex-col gap-6 border-b border-line-soft pb-11">
                <div className="flex flex-col gap-2.5">
                  <h1 className="font-mono text-[11.5px] uppercase leading-tight tracking-[0.14em] text-ink md:text-[13px]">
                    {product.title}
                  </h1>
                  <p className="font-mono text-[10px] tracking-[0.18em] text-ash md:text-[11px]">
                    {product.priceRange?.minVariantPrice?.currencyCode || 'KRW'}{' '}
                    {Math.floor(product.priceRange?.minVariantPrice?.amount || 0).toLocaleString()}
                  </p>
                </div>

                <div
                  className="space-y-2 text-[10px] font-light uppercase leading-[1.9] tracking-[0.03em] text-ash md:text-[10.5px]"
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </div>

              <ProductForm product={product} />

              {/* 결제 전에 반드시 보이는 자리 — 배송에 걸리는 기간과 무를 수 있는 기간.
                  전자상거래법상 '재화의 공급 시기'는 상품 화면에서 알 수 있어야 하고,
                  카드사·PG 심사도 이 표기를 상품 페이지에서 확인합니다.
                  숫자는 /policies/shipping-policy · refund-policy 와 같은 값입니다. */}
              <dl className="grid grid-cols-[4.6rem_1fr] gap-x-3 gap-y-2 border-t border-line-soft pt-8 text-[10px] font-light leading-[1.85] tracking-[0.02em] text-ash md:text-[10.5px]">
                <dt className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink">
                  Shipping
                </dt>
                <dd>
                  <Bilingual
                    en="Dispatched within 1–3 business days of payment · delivered within 14 days (Korea). Pre-order and made-to-order pieces follow the date stated above."
                    ko="결제 완료 후 영업일 기준 1~3일 이내 출고 · 국내 수령까지 최대 14일 이내. 프리오더 · 주문제작 상품은 위 상세 설명에 표기된 일정을 따릅니다."
                  />
                </dd>

                <dt className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink">
                  Returns
                </dt>
                <dd>
                  <Bilingual
                    en="Withdrawal within 7 days of delivery · refunded within 3 business days of return."
                    ko="상품 수령일로부터 7일 이내 청약철회 · 반품 확인 후 3영업일 이내 환불."
                  />
                </dd>

                <dt className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink">
                  Contact
                </dt>
                <dd>
                  <a className="underline underline-offset-4" href={`mailto:${CONTACT.cs}`}>
                    {CONTACT.cs}
                  </a>
                  {' · '}
                  <a className="underline underline-offset-4" href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}>
                    {CONTACT.phoneKo}
                  </a>
                </dd>

                <dt className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ink">
                  Policy
                </dt>
                <dd className="[&_a]:underline [&_a]:underline-offset-4">
                  <Link href="/policies/shipping-policy">
                    <Bilingual en="Shipping" ko="배송 정책" inline />
                  </Link>
                  {' · '}
                  <Link href="/policies/refund-policy">
                    <Bilingual en="Refunds" ko="교환 · 환불" inline />
                  </Link>
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
