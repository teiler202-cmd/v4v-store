'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';

export default function ProductForm({ product }: { product: any }) {
  
  // [여기 한 줄만 추가해보세요!] 쇼피파이가 준 데이터를 터미널에 출력합니다.
  console.log("쇼피파이가 준 상품 데이터:", JSON.stringify(product.variants, null, 2));

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');

  const sizeOption = product.options?.find((opt: any) => opt.name === 'Size' || opt.name === 'Title');
  const sizes = sizeOption ? sizeOption.values : ['ONE SIZE'];

  const handleAddToCart = () => {
    if (!selectedSize && sizes[0] !== 'ONE SIZE') {
      alert("사이즈를 선택해 주세요.");
      return;
    }

    // [핵심 추가]: 선택한 사이즈에 맞는 '진짜 쇼피파이 Variant ID' 찾기
    const selectedVariant = product.variants?.edges?.find((edge: any) => {
      // 옵션 값이 선택한 사이즈와 같거나, 변형 이름이 선택한 사이즈와 같은 것을 찾습니다.
      return edge.node.selectedOptions?.some((opt: any) => opt.value === selectedSize) || edge.node.title === selectedSize;
    })?.node;

    // 만약 못 찾으면 기본(첫 번째) 변형의 ID를 사용합니다.
    const variantId = selectedVariant ? selectedVariant.id : product.variants?.edges[0]?.node?.id;

    const cartItem = {
      id: variantId, // [수정 완료]: 임시 ID가 아닌 진짜 Variant ID를 장바구니 ID로 사용합니다!
      title: sizes[0] === 'ONE SIZE' ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    };
    
    addToCart(cartItem);
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-4">
        <span className="text-[10px] uppercase tracking-widest text-zinc-500">
          {sizeOption ? sizeOption.name : 'SIZE'}
        </span>
        <div className="flex flex-wrap gap-2">
          {sizes.map((val: string) => (
            <button 
              key={val}
              onClick={() => setSelectedSize(val)}
              className={`border px-6 py-4 text-xs uppercase font-medium transition-all duration-300
                ${selectedSize === val 
                  ? 'border-white bg-white text-black' 
                  : 'border-zinc-800 bg-black text-white hover:border-zinc-400' 
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
        className="w-full flex-shrink-0 bg-white text-black py-6 text-sm uppercase tracking-[0.3em] font-bold mt-4 hover:bg-zinc-300 transition-colors"
      >
        {selectedSize ? 'Add to Cart' : 'Select Size'}
      </button>
    </div>
  );
}