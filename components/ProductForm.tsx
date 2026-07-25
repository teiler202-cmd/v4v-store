'use client';

import { useState } from 'react';
import { useCart } from './CartProvider';
import { motion, AnimatePresence } from 'framer-motion';

export default function ProductForm({ product }: { product: any }) {
  
  console.log("쇼피파이가 준 상품 데이터:", JSON.stringify(product.variants, null, 2));

  const { addToCart } = useCart();
  const [selectedSize, setSelectedSize] = useState<string>('');
  
  const [showToast, setShowToast] = useState(false); 

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
                // 🔥 화이트 테마에 맞게 사이즈 선택 버튼의 색상과 테두리 수정
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

        {/* 🔥 하단 장바구니 버튼에 디자이너 블랙(zinc-900)과 호버 액션 적용 */}
        <button 
          onClick={handleAddToCart}
          className="w-full flex-shrink-0 bg-zinc-900 text-white py-6 text-sm uppercase tracking-[0.3em] font-bold mt-4 hover:bg-zinc-800 transition-colors duration-300"
        >
          {selectedSize ? 'Add to Cart' : 'Select Size'}
        </button>
      </div>

      {/* 토스트 팝업 UI */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            // 🔥 토스트 팝업도 버튼과 통일감을 주기 위해 블랙으로 맞췄습니다.
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white px-8 py-4 flex items-center justify-center shadow-2xl"
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