'use client';

import { ViewTransition } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { SILK } from '@/components/Reveal';

export default function ShopGrid({ products }: { products: any[] }) {
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

        return (
          <motion.div
            key={product.id}
            initial={{ opacity: 0, y: 26, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 1.15, ease: SILK, delay: 0.1 + index * 0.09 }}
            /* 타일 폭을 못 박아 두었기 때문에 상품이 늘어나도 옷이 커지지 않습니다 */
            className="w-[calc(50%-10px)] max-w-[240px] md:w-[188px] lg:w-[208px] xl:w-[220px]"
          >
            <Link href={`/products/${product.handle}`} className="group block">
              <ViewTransition name={`product-${product.handle}`} default="none" share="v4v-morph">
                <div className="relative aspect-[4/5] w-full overflow-hidden bg-paper">
                  {firstImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={firstImage}
                      alt={product.title}
                      className={`absolute inset-0 h-full w-full object-contain transition-opacity duration-[550ms] ease-silk ${
                        secondImage ? 'group-hover:opacity-0' : ''
                      }`}
                    />
                  )}
                  {secondImage && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={secondImage}
                      alt={`${product.title} — alternate view`}
                      className="absolute inset-0 h-full w-full object-contain opacity-0 transition-opacity duration-[550ms] ease-silk group-hover:opacity-100"
                    />
                  )}
                </div>
              </ViewTransition>

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
