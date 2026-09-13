'use client';

import { useRef, useState } from 'react';
import { ViewTransition } from 'react';
import Link from 'next/link';
import ProductForm from '@/components/ProductForm';
import Bilingual from '@/components/Bilingual';
import { CONTACT } from '@/lib/brand';
import ModelShot from '@/components/ModelShot';
import { parseModelSpec } from '@/lib/modelSpec';
import { sizedImage, sizedSrcSet } from '@/lib/image';

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden bg-paper md:cursor-crosshair"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={sizedImage(src, 900)}
        srcSet={sizedSrcSet(src, [640, 900, 1280])}
        sizes="(max-width: 768px) 100vw, 620px"
        alt={alt}
        className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-300 ease-silk ${
          isZoomed ? 'opacity-100 md:opacity-0' : 'opacity-100'
        }`}
      />
      <div
        className={`absolute inset-0 hidden h-full w-full bg-no-repeat transition-opacity duration-300 ease-silk md:block ${
          isZoomed ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          // 확대 레이어만 원본 해상도를 씁니다 — 여기서는 화질이 곧 기능입니다.
          backgroundImage: `url(${sizedImage(src, 1600)})`,
          backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
          backgroundSize: '220%',
        }}
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

  const handleThumbnailClick = (idx: number) => {
    setSelectedIdx(idx);
    imageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      setSelectedIdx(Math.round(scrollLeft / width));
    }
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
                  className={`aspect-[4/5] w-full cursor-pointer border-b transition-all duration-500 ease-silk ${
                    selectedIdx === idx
                      ? 'border-ink opacity-100'
                      : 'border-transparent opacity-40 hover:opacity-100'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={sizedImage(image.url, 96)}
                    srcSet={sizedSrcSet(image.url, [96, 144])}
                    sizes="44px"
                    width={44}
                    height={55}
                    loading="lazy"
                    alt=""
                    className="h-full w-full object-contain"
                  />
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
