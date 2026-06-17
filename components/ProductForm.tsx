'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { motion, AnimatePresence } from 'framer-motion'; // 🔥 부드러운 팝업을 위한 애니메이션 라이브러리 추가

export default function ProductForm({ product }: { product: any }) {
  
  // 쇼피파이가 준 데이터를 터미널에 출력합니다.
  console.log("쇼피파이가 준 상품 데이터:", JSON.stringify(product.variants, null, 2));

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  // 🔥 [추가]: 토스트 팝업이 켜져 있는지 꺼져 있는지 기억하는 스위치
  const [showToast, setShowToast] = useState(false); 

  const sizeOption = product.options?.find((opt: any) => opt.name === 'Size' || opt.name === 'Title');
  const sizes = sizeOption ? sizeOption.values : ['ONE SIZE'];

  const handleAddToCart = () => {
    if (!selectedSize && sizes[0] !== 'ONE SIZE') {
      alert("사이즈를 선택해 주세요.");
      return;
    }

    // 선택한 사이즈에 맞는 '진짜 쇼피파이 Variant ID' 찾기
    const selectedVariant = product.variants?.edges?.find((edge: any) => {
      return edge.node.selectedOptions?.some((opt: any) => opt.value === selectedSize) || edge.node.title === selectedSize;
    })?.node;

    // 만약 못 찾으면 기본(첫 번째) 변형의 ID를 사용합니다.
    const variantId = selectedVariant ? selectedVariant.id : product.variants?.edges[0]?.node?.id;

    const cartItem = {
      id: variantId, 
      title: sizes[0] === 'ONE SIZE' ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    };
    
    addToCart(cartItem);

    // 🔥 [추가]: 장바구니에 성공적으로 담겼다면 팝업을 띄우고, 2.5초 뒤에 알아서 사라지게 만듭니다!
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 2500);
  };

  return (
    <>
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

      {/* 🔥 [추가]: 토스트 팝업 UI (화면 하단 중앙에 스르륵 나타났다 사라짐) */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-white text-black px-8 py-4 flex items-center justify-center shadow-2xl border border-zinc-200"
          >
            <span className="text-xs font-bold tracking-[0.2em] uppercase whitespace-nowrap">
              Added to Bag
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}