'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { getSizeOption, resolveVariantId } from '@/lib/variant';
import { sizedImage, sizedSrcSet } from '@/lib/image';

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
  /**
   * 브라우저에 저장된 장바구니를 아직 읽기 전인지 알려줍니다.
   * false 동안에는 cart가 빈 배열인데, 이건 '비어 있다'가 아니라 '아직 모른다'는 뜻입니다.
   * 둘을 구분하지 않으면 결제 화면이 '장바구니가 비었습니다'를 먼저 보여줍니다.
   */
  hydrated: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

// 🛒 [추가]: 추천 상품 1개를 그려주는 미니 컴포넌트 (ERL 스타일 폼)
function RecommendedItem({ product, addToCart }: { product: any, addToCart: (item: CartItem) => void }) {
  const sizeOption = getSizeOption(product);
  const isOneSize = !sizeOption;
  const sizes = sizeOption?.values ?? ['ONE SIZE'];
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [warning, setWarning] = useState<string | null>(null);

  const handleAdd = () => {
    if (!isOneSize && !selectedSize) {
      setWarning('사이즈를 선택해 주세요');
      return;
    }

    const variantId = resolveVariantId(product, isOneSize ? undefined : selectedSize);

    // Variant ID가 없으면 담지 않습니다 —
    // 예전에는 여기서 undefined가 들어가 React key 경고와 결제 실패로 이어졌습니다.
    if (!variantId) {
      setWarning('지금은 담을 수 없는 상품입니다');
      return;
    }

    setWarning(null);
    addToCart({
      id: variantId,
      title: isOneSize ? product.title : `${product.title} (${selectedSize})`,
      price: product.priceRange.minVariantPrice.amount,
      image: product.images?.edges[0]?.node?.url || '',
      quantity: 1,
    });
    setSelectedSize(''); // 담은 후 선택 초기화
  };

  return (
    <div className="flex gap-4 pt-6 border-t border-zinc-200/60">
      <div className="w-20 md:w-24 aspect-[3/4] bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
        <img
          src={sizedImage(product.images?.edges[0]?.node?.url, 192)}
          srcSet={sizedSrcSet(product.images?.edges[0]?.node?.url, [96, 192, 288])}
          sizes="(max-width: 768px) 80px, 96px"
          width={96}
          height={128}
          loading="lazy"
          alt={product.title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 flex flex-col justify-between py-1">
        <div>
          <h3 className="text-[10px] font-bold uppercase tracking-[0.15em] leading-tight mb-2 text-zinc-900">{product.title}</h3>
          <p className="text-[10px] text-zinc-500 tracking-widest font-medium">KRW {Math.floor(Number(product.priceRange.minVariantPrice.amount)).toLocaleString()}</p>
        </div>
        <div className="flex flex-col gap-2 mt-4">
          {warning && (
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-zinc-900">{warning}</span>
          )}
          {/* 원사이즈가 아닐 경우에만 드롭다운 표시 */}
          {!isOneSize && (
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


const CART_STORAGE_KEY = 'v4v:cart';

/** 새로고침·페이지 이동에도 장바구니가 남아 있도록 브라우저에 저장해 둡니다. */
function readStoredCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    // 예전 버전에서 id 없이 저장된 항목이 있다면 걸러냅니다.
    return Array.isArray(parsed) ? parsed.filter((item) => item && item.id) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false); 
  const [recommended, setRecommended] = useState<any[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // 저장된 장바구니 복원.
  // 서버 HTML과 첫 렌더를 일치시켜야 하므로(헤더의 BAG 개수) 마운트 후에 읽습니다.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCart(readStoredCart());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      /* 저장 공간이 없거나 프라이빗 모드 — 무시 */
    }
  }, [cart, hydrated]);

  // 🔥 팝업이 열릴 때 상품 목록을 백그라운드에서 조용히 불러옵니다.
  useEffect(() => {
    if (isCartOpen && recommended.length === 0) {
      const fetchRecs = async () => {
        try {
          // 쇼피파이 접속 정보는 서버에만 있습니다 — 브라우저는 우리 서버에만 말을 겁니다.
          const res = await fetch('/api/recommendations');
          if (!res.ok) return;
          const data = await res.json();
          setRecommended(data.products ?? []);
        } catch {
          // 추천은 있으면 좋은 정보일 뿐이라, 실패해도 장바구니는 그대로 씁니다.
        }
      };
      fetchRecs();
    }
  }, [isCartOpen, recommended.length]);

  const addToCart = (newItem: CartItem) => {
    if (!newItem?.id) {
      console.error('[cart] variantId 없이 담으려 했습니다:', newItem);
      return;
    }
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
    <CartContext.Provider value={{ cart, addToCart, updateQuantity, isCartOpen, setIsCartOpen, hydrated }}>
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
                    cart.map((item, index) => (
                      <div key={item.id || `cart-${index}`} className="flex gap-4">
                        <div className="w-20 md:w-24 aspect-[3/4] bg-zinc-100 overflow-hidden shrink-0 border border-zinc-200">
                          <img
                            src={sizedImage(item.image, 192)}
                            srcSet={sizedSrcSet(item.image, [96, 192, 288])}
                            sizes="(max-width: 768px) 80px, 96px"
                            width={96}
                            height={128}
                            loading="lazy"
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
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