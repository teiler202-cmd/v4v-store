'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';
import { createCheckout } from '@/app/actions';

export default function CheckoutPage() {
  const { cart, updateQuantity } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);
  const shipping = subtotal > 0 ? 30000 : 0;
  const taxes = 0;
  const total = subtotal + shipping + taxes;
  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);

    const lineItems = cart.map(item => ({
      variantId: item.id,
      quantity: item.quantity
    }));

    const checkoutUrl = await createCheckout(lineItems);

    if (checkoutUrl) {
      window.location.href = checkoutUrl;
    } else {
      alert("결제창을 생성하는 중 오류가 발생했습니다.");
      setIsCheckingOut(false);
    }
  };

  return (
    // 🔥 [수정]: overflow-y-auto를 최상단에 주어 모바일에서 전체 스크롤이 가능하게 함
    <main className="w-screen h-screen flex flex-col bg-black text-white font-sans overflow-y-auto overflow-x-hidden md:overflow-hidden">

      {/* 헤더: 모바일에서 높이(h-16)와 여백(px-4) 축소 */}
      <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-16 border-b border-zinc-900 flex-shrink-0 sticky top-0 bg-black z-10">
        <Link href="/" className="text-[10px] md:text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors">&lt; BACK</Link>
        <h1 className="text-xl md:text-2xl font-black tracking-tighter text-white">V4V</h1>
        <div className="w-20 flex justify-end">
          <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cart [{totalItems}]</span>
        </div>
      </header>

      {/* 🔥 [수정]: 모바일에서는 세로(flex-col), PC에서는 가로(md:flex-row) 배치 */}
      <div className="flex flex-col md:flex-row flex-1 w-full max-w-7xl mx-auto md:overflow-hidden">

        {/* ⬅️ 좌측 (모바일에선 상단): 상품 리스트 */}
        <section className="flex-1 md:h-full md:overflow-y-auto px-4 md:px-8 lg:px-16 py-8 md:py-12 flex flex-col border-b md:border-b-0 border-zinc-900">
          
          <h2 className="text-[9px] md:text-[10px] tracking-widest uppercase font-bold text-zinc-600 mb-6 md:mb-8 flex-shrink-0">주문 정보</h2>

          <div className="flex flex-col">
            {cart.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <p className="text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.4em] text-zinc-800 uppercase text-center px-4">YOUR BAG IS EMPTY</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 md:gap-6 border-b border-zinc-900 py-4 h-auto md:h-40 flex-shrink-0">
                  
                  {/* 상품 이미지: 모바일 핏 축소 (80x96) */}
                  <div 
                    className="bg-zinc-900 relative overflow-hidden flex-shrink-0 w-[80px] h-[96px] md:w-[112px] md:h-[128px]"
                  >
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                  </div>

                  {/* 상품 정보: 세로 정렬 및 폰트 축소 */}
                  <div className="flex flex-col flex-1 gap-1 md:gap-2">
                    <h3 className="text-xs md:text-sm font-bold uppercase tracking-tight text-white leading-tight">{item.title.split(' (')[0]}</h3>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider">
                      사이즈: <span className="text-white">{item.title.includes('(') ? item.title.split('(')[1].replace(')', '') : 'ONE SIZE'}</span>
                    </p>
                    
                    {/* 가격 (모바일에서는 타이틀 바로 아래에 배치) */}
                    <span className="text-xs md:hidden font-bold text-white tracking-wide mt-1">
                      KRW {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* 수량 조절 버튼 (PC에서는 우측, 모바일에서는 우측 하단 느낌) */}
                  <div className="flex flex-col items-end gap-2 md:gap-4 flex-shrink-0">
                    <span className="hidden md:block text-sm font-bold text-white tracking-wide">
                      KRW {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>

                    <div className="flex items-center text-[10px] md:text-xs font-bold text-zinc-400 border border-zinc-800 rounded-sm overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-2 md:px-3 py-1 md:py-1.5 hover:bg-zinc-800 transition-colors">-</button>
                      <span className="px-2 md:px-3 py-1 md:py-1.5 min-w-[24px] md:min-w-[32px] text-center border-x border-zinc-800 text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-2 md:px-3 py-1 md:py-1.5 hover:bg-zinc-800 transition-colors">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 총액 정보 */}
          {cart.length > 0 && (
            <div className="pt-6 md:pt-8 mt-2 md:mt-4 flex flex-col gap-2 md:gap-3 text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex-shrink-0 pb-10 md:pb-16">
              <div className="flex justify-between">
                <span>상품액</span>
                <span className="text-zinc-300">KRW {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span className="text-zinc-300">KRW {shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-900">
                <span className="font-bold text-[10px] md:text-xs text-white">총액</span>
                <span className="text-lg md:text-xl font-black tracking-tight text-white">KRW {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </section>

        {/* ➡️ 우측 (모바일에선 하단): 결제 화살표 버튼 */}
        <section className="w-full md:w-32 lg:w-48 h-[120px] md:h-auto flex flex-col items-center justify-center flex-shrink-0 md:border-l border-zinc-900 py-6 md:py-0">
          {cart.length > 0 && (
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="group flex flex-col items-center justify-center transition-opacity hover:opacity-70 active:scale-95 disabled:scale-100 disabled:opacity-30 outline-none w-full h-full cursor-pointer bg-transparent border-none"
            >
              {isCheckingOut ? (
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse" style={{ color: '#ffffff' }}>Wait...</span>
              ) : (
                <>
                  {/* 모바일에서는 화살표 크기를 살짝 줄임 (w-12 h-12) */}
                  <div className="flex items-center justify-center w-12 h-12 md:w-16 md:h-16" style={{ color: '#ffffff' }}>
                    <svg viewBox="0 0 24 24" style={{ fill: '#ffffff', width: '100%', height: '100%' }}>
                      <polygon points="6,3 20,12 6,21"></polygon>
                    </svg>
                  </div>
                  <span className="text-[9px] md:text-[10px] mt-2 md:mt-4" style={{ color: '#ffffff', fontWeight: '900', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
                    Checkout
                  </span>
                </>
              )}
            </button>
          )}
        </section>

      </div>
    </main>
  );
}