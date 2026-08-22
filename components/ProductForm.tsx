'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';

export default function ProductForm({ product }: { product: any }) {
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [error, setError] = useState(false);

  const sizeOption = product.options?.find(
    (opt: any) => opt.name === 'Size' || opt.name === 'Title'
  );

  // Shopify는 옵션이 없는 상품에 'Default Title'을 붙입니다 — 사용자에게 보여줄 선택지가 아닙니다.
  const rawValues: string[] = sizeOption?.values ?? [];
  const values = rawValues.filter((v) => v !== 'Default Title');
  const isOneSize = values.length === 0;
  const sizes = isOneSize ? ['One Size'] : values;

  const handleAddToCart = () => {
    if (!isOneSize && !selectedSize) {
      setError(true);
      return;
    }

    const selectedVariant = product.variants?.edges?.find((edge: any) => {
      return (
        edge.node.selectedOptions?.some((opt: any) => opt.value === selectedSize) ||
        edge.node.title === selectedSize
      );
    })?.node;

    const variantId = selectedVariant ? selectedVariant.id : product.variants?.edges[0]?.node?.id;

    addToCart({
      id: variantId,
      title: isOneSize ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    });

    setIsCartOpen(true);
  };

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
        className="w-full shrink-0 bg-ink py-4.5 font-mono text-[9.5px] uppercase tracking-[0.28em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 md:py-5"
      >
        Add to Bag
      </button>
    </div>
  );
}
