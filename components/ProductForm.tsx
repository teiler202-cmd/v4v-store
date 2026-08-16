'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';

export default function ProductForm({ product }: { product: any }) {
  // 🔥 setIsCartOpen 리모콘을 가져옵니다. (토스트 관련 코드는 삭제)
  const { addToCart, setIsCartOpen } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');

  const sizeOption = product.options?.find((opt: any) => opt.name === 'Size' || opt.name === 'Title');
  const sizes = sizeOption ? sizeOption.values : ['ONE SIZE'];

  const handleAddToCart = () => {
    if (!selectedSize && sizes[0] !== 'ONE SIZE') {
      alert("사이즈를 선택해 주세요.");
      return;
    }

    const selectedVariant = product.variants?.edges?.find((edge: any) => {
      return edge.node.selectedOptions?.some((opt: any) => opt.value === selectedSize) || edge.node.title === selectedSize;
    })?.node;

    const variantId = selectedVariant ? selectedVariant.id : product.variants?.edges[0]?.node?.id;

    const cartItem = {
      id: variantId, 
      title: sizes[0] === 'ONE SIZE' ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    };
    
    addToCart(cartItem);
    
    // 🔥 담은 직후 장바구니 팝업을 멋지게 열어줍니다!
    setIsCartOpen(true);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-4">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold">
          {sizeOption ? sizeOption.name : 'SIZE'}
        </span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((val: string) => (
            <button 
              key={val}
              onClick={() => setSelectedSize(val)}
              className={`border px-6 py-4 text-xs uppercase font-medium transition-all duration-300
                ${selectedSize === val 
                  ? 'border-zinc-900 bg-zinc-900 text-white' 
                  : 'border-zinc-300 bg-white text-black hover:border-zinc-900' 
                }
              `}
            >
              {val}
            </button>
          ))}
        </div>
      </div>

      <button 
        onClick={handleAddToCart}
        className="w-full flex-shrink-0 bg-zinc-900 text-white py-6 text-sm uppercase tracking-[0.3em] font-bold mt-4 hover:bg-zinc-800 transition-colors duration-300"
      >
        {selectedSize ? 'Add to Bag' : 'Select Size'}
      </button>
    </div>
  );
}