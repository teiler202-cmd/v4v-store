'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
// 🔥 추천 상품을 불러오기 위해 기존 쇼피파이 API 함수를 임포트합니다.
import { getProducts } from '@/lib/shopify';

type CartItem = {
  id: string;
  title: string;
  price: string;
  image: string;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  updateQuantity: (id: string, delta: number) => void;
  isCartOpen: boolean; 
  setIsCartOpen: (isOpen: boolean) => void; 
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// 🛒 [추가]: 추천 상품 1개를 그려주는 미니 컴포넌트 (ERL 스타일 폼)
function RecommendedItem({ product, addToCart }: { product: any, addToCart: (item: CartItem) => void }) {
  const sizeOption = product.options?.find((opt: any) => opt.name === 'Size' || opt.name === 'Title');
  const sizes = sizeOption ? sizeOption.values : ['ONE SIZE'];
  const [selectedSize, setSelectedSize] = useState<string>('');

  const handleAdd = () => {
    if (!selectedSize && sizes[0] !== 'ONE SIZE') {
      alert("사이즈를 선택해 주세요.");
      return;
    }
    const selectedVariant = product.variants?.edges?.find((edge: any) => {
      return edge.node.selectedOptions?.some((opt: any) => opt.value === selectedSize) || edge.node.title === selectedSize;
    })?.node;

    const variantId = selectedVariant ? selectedVariant.id : product.variants?.edges[0]?.node?.id;

    addToCart({
      id: variantId,
      title: sizes[0] === 'ONE SIZE' ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    });
    setSelectedSize(''); // 담은 후 선택 초기화
  };

  return (
    <div className="flex gap-4 pt-6 border-t border-zinc-200/60">
      <div className="w-20 md:w-24 aspect-[3/4] bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
        <img src={product.images?.edges[0]?.node?.url} alt={product.title} className="w-full h-full object-cover" />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] leading-tight mb-2 text-zinc-900">{product.title}</h3>
          <p className="text-[10px] text-zinc-500 tracking-widest font-medium">KRW {Math.floor(Number(product.priceRange.minVariantPrice.amount)).toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {/* 원사이즈가 아닐 경우에만 드롭다운 표시 */}
          {sizes[0] !== 'ONE SIZE' && (
            <select
              className="w-full text-[10px] border border-zinc-300 p-2 uppercase tracking-widest bg-white text-zinc-900 outline-none focus:border-zinc-900 transition-colors cursor-pointer"
              value={selectedSize}
              onChange={(e) => setSelectedSize(e.target.value)}
            >
              <option value="" disabled>Select Size</option>
              {sizes.map((s: string) => <option key={s} value={s}>{s}</option>)}
            </select>
          )}
          <button
            onClick={handleAdd}
            className="w-full bg-zinc-100 text-zinc-900 py-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-center hover:bg-zinc-200 transition-colors"
          >
            Add to Bag
          </button>
        </div>
      </div>
    </div>
  );
}


export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [recommended, setRecommended] = useState<any[]>([]);

  // 🔥 팝업이 열릴 때 상품 목록을 백그라운드에서 조용히 불러옵니다.
  useEffect(() => {
    if (isCartOpen && recommended.length === 0) {
      const fetchRecs = async () => {
        try {
          const data = await getProducts();
          setRecommended(data);
        } catch (error) {
          console.error("추천 상품 로딩 실패:", error);
        }
      };
      fetchRecs();
    }
  }, [isCartOpen, recommended.length]);

  const addToCart = (newItem: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) => item.id === newItem.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) => 
      prev
        .map(item => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
        .filter(item => item.quantity > 0)
    );
  };

  const subtotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);

  // 🔥 장바구니에 이미 담긴 상품의 '이름(Title)'을 추출하여 필터링 준비
  const cartBaseTitles = cart.map(item => item.title.replace(/\s\(.*\)$/, ''));
  // 🔥 장바구니에 없는 상품만 최대 3개까지 추천 리스트로 노출
  const displayRecs = recommended.filter(p => !cartBaseTitles.includes(p.title)).slice(0, 3);

  return (
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, isCartOpen, setIsCartOpen }}>
      {children}

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-0 z-[100] cursor-pointer bg-black/35 backdrop-blur-[3px]"
              onClick={() => setIsCartOpen(false)}
            />

            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.68, ease: [0.16, 1, 0.3, 1] }}
              className="fixed top-0 right-0 w-full max-w-[400px] h-full bg-white z-[101] shadow-2xl flex flex-col font-sans text-zinc-900"
            >
              <div className="flex justify-between items-center p-6 border-b border-zinc-200 shrink-0">
                <h2 className="text-xs font-bold tracking-[0.2em] uppercase">Bag ({cart.reduce((t, i) => t + i.quantity, 0)})</h2>
                <button onClick={() => setIsCartOpen(false)} className="text-2xl font-light hover:text-zinc-500 transition-colors">&times;</button>
              </div>

              {/* 스크롤 가능한 본문 영역 */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col">
                
                {/* 1. 장바구니에 담긴 상품 리스트 */}
                <div className="flex flex-col gap-8">
                  {cart.length === 0 ? (
                    <p className="text-[11px] text-zinc-500 uppercase tracking-widest text-center mt-4">Your bag is empty.</p>
                  ) : (
                    cart.map(item => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-20 md:w-24 aspect-[3/4] bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                        </div>
                        
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] leading-tight mb-2 text-zinc-900">{item.title}</h3>
                            <p className="text-[10px] text-zinc-500 tracking-widest font-medium">KRW {Math.floor(Number(item.price)).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center border border-zinc-300">
                              <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 text-xs hover:bg-zinc-100 transition-colors">-</button>
                              <span className="text-[10px] w-6 text-center font-medium">{item.quantity}</span>
                              <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1.5 text-xs hover:bg-zinc-100 transition-colors">+</button>
                            </div>
                            <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-[10px] uppercase tracking-widest text-zinc-400 hover:text-zinc-900 underline underline-offset-4 transition-colors">Remove</button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* 2. ERL 스타일 추천 상품 (RECOMMENDATIONS) 영역 */}
                {displayRecs.length > 0 && (
                  <div className="mt-12 flex flex-col gap-2">
                    <h2 className="text-xs font-bold tracking-[0.2em] uppercase text-zinc-900 mb-2">Recommendations</h2>
                    {displayRecs.map(product => (
                      <RecommendedItem key={product.id} product={product} addToCart={addToCart} />
                    ))}
                  </div>
                )}
                
              </div>

              {/* 하단 결제 영역 */}
              {cart.length > 0 && (
                <div className="p-6 border-t border-zinc-200 bg-zinc-50 flex flex-col gap-5 shrink-0">
                  <div className="flex justify-between items-center text-xs font-bold uppercase tracking-widest text-zinc-900">
                    <span>Subtotal</span>
                    <span>KRW {subtotal.toLocaleString()}</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 tracking-widest uppercase mb-2">Shipping & taxes calculated at checkout</p>
                  <Link href="/checkout" onClick={() => setIsCartOpen(false)} className="w-full bg-zinc-900 text-white py-5 text-xs font-bold uppercase tracking-[0.2em] text-center hover:bg-zinc-800 transition-colors">
                    Checkout
                  </Link>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
};