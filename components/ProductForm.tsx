'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { getSizeOption, isVariantAvailable, resolveVariantId } from '@/lib/variant';

export default function ProductForm({ product }: { product: any }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [error, setError] = useState(false);

  const sizeOption = getSizeOption(product);
  const isOneSize = !sizeOption;
  const sizes = sizeOption?.values ?? ['One Size'];

  const handleAddToCart = () => {
    if (!isOneSize && !selectedSize) {
      setError(true);
      return;
    }

    const variantId = resolveVariantId(product, isOneSize ? undefined : selectedSize);

    // Variant를 못 찾으면 담지 않습니다 — 담아봤자 결제 단계에서 실패합니다.
    if (!variantId) {
      setError(true);
      return;
    }

    addToCart({
      id: variantId,
      title: isOneSize ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    });

    setIsCartOpen(true);
  };

  const soldOut = !isVariantAvailable(product, isOneSize ? undefined : selectedSize);

  return (
    <div className="flex w-full flex-col gap-8">
      {!isOneSize && (
        <div className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash">
              {sizeOption?.name ?? 'Size'}
            </span>
            {error && (
              <span className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ink">
                Select a size
              </span>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            {sizes.map((val: string) => (
              <button
                key={val}
                onClick={() => {
                  setSelectedSize(val);
                  setError(false);
                }}
                className={`min-w-[58px] border px-4 py-3 font-mono text-[9.5px] uppercase tracking-[0.12em] transition-all duration-500 ease-silk ${
                  selectedSize === val
                    ? 'border-ink bg-ink text-paper'
                    : 'border-line bg-paper text-ink hover:border-ink'
                }`}
              >
                {val}
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        onClick={handleAddToCart}
        disabled={soldOut}
        className="w-full shrink-0 bg-ink py-4.5 font-mono text-[9.5px] uppercase tracking-[0.28em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-30 md:py-5"
      >
        {soldOut ? 'Sold Out' : 'Add to Bag'}
      </button>
    </div>
  );
}
