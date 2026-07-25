'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import Link from 'next/link';
import Image from 'next/image'; // 🔥 이미지 컴포넌트 임포트
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
    <main className="w-screen h-screen flex flex-col bg-white text-black font-sans overflow-y-auto overflow-x-hidden md:overflow-hidden">

      {/* 헤더 */}
      <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-16 border-b border-zinc-200 flex-shrink-0 sticky top-0 bg-white z-10">
        <Link href="/" className="text-[10px] md:text-xs tracking-widest uppercase text-zinc-500 hover:text-black transition-colors w-20">&lt; BACK</Link>
        
        {/* 🔥 기존 텍스트 로고(h1)를 새 그래픽 이미지로 교체 완료 */}
        <div className="flex justify-center flex-1">
          <Image 
            src="/V4V_SlubTee_로고_정방향.png"  
            alt="V4V Logo"
            width={120}                
            height={24}               
            priority 
            style={{ width: 'auto', height: '20px' }} // 슬림한 헤더 핏에 맞춤
            className="object-contain" 
          />
        </div>

        <div className="w-20 flex justify-end">
          <span className="text-[8px] md:text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cart [{totalItems}]</span>
        </div>
      </header>

      <div className="flex flex-col md:flex-row flex-1 w-full max-w-7xl mx-auto md:overflow-hidden">

        {/* ⬅️ 좌측 (모바일에선 상단): 상품 리스트 */}
        <section className="flex-1 md:h-full md:overflow-y-auto px-4 md:px-8 lg:px-16 py-8 md:py-12 flex flex-col border-b md:border-b-0 md:border-r border-zinc-200">
          
          <h2 className="text-[9px] md:text-[10px] tracking-widest uppercase font-bold text-zinc-500 mb-6 md:mb-8 flex-shrink-0">주문 정보</h2>

          <div className="flex flex-col">
            {cart.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <p className="text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.4em] text-zinc-400 uppercase text-center px-4">YOUR BAG IS EMPTY</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 md:gap-6 border-b border-zinc-200 py-4 h-auto md:h-40 flex-shrink-0">
                  
                  {/* 상품 이미지 */}
                  <div className="bg-zinc-100 relative overflow-hidden flex-shrink-0 w-[80px] h-[96px] md:w-[112px] md:h-[128px]">
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex flex-col flex-1 gap-1 md:gap-2">
                    <h3 className="text-xs md:text-sm font-bold uppercase tracking-tight text-black leading-tight">{item.title.split(' (')[0]}</h3>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider">
                      사이즈: <span className="text-black">{item.title.includes('(') ? item.title.split('(')[1].replace(')', '') : 'ONE SIZE'}</span>
                    </p>
                    
                    {/* 가격 (모바일) */}
                    <span className="text-xs md:hidden font-bold text-black tracking-wide mt-1">
                      KRW {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>
                  </div>

                  {/* 수량 조절 버튼 */}
                  <div className="flex flex-col items-end gap-2 md:gap-4 flex-shrink-0">
                    <span className="hidden md:block text-sm font-bold text-black tracking-wide">
                      KRW {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>

                    <div className="flex items-center text-[10px] md:text-xs font-bold text-zinc-600 border border-zinc-300 rounded-sm overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-2 md:px-3 py-1 md:py-1.5 hover:bg-zinc-100 transition-colors">-</button>
                      <span className="px-2 md:px-3 py-1 md:py-1.5 min-w-[24px] md:min-w-[32px] text-center border-x border-zinc-300 text-black">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-2 md:px-3 py-1 md:py-1.5 hover:bg-zinc-100 transition-colors">+</button>
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
                <span className="text-zinc-600">KRW {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span className="text-zinc-600">KRW {shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-200">
                <span className="font-bold text-[10px] md:text-xs text-black">총액</span>
                <span className="text-lg md:text-xl font-black tracking-tight text-black">KRW {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </section>

        {/* ➡️ 우측 (모바일에선 하단): 결제 화살표 버튼 */}
        <section className="w-full md:w-32 lg:w-48 h-[120px] md:h-auto flex flex-col items-center justify-center flex-shrink-0 py-6 md:py-0">
          {cart.length > 0 && (
            <button
              onClick={handleCheckout}
              disabled={isCheckingOut}
              className="group flex flex-col items-center justify-center transition-opacity hover:opacity-70 active:scale-95 disabled:scale-100 disabled:opacity-30 outline-none w-full h-full cursor-pointer bg-transparent border-none text-zinc-900"
            >
              {isCheckingOut ? (
                <span className="text-[10px] font-bold tracking-[0.2em] uppercase animate-pulse text-zinc-900">Wait...</span>
              ) : (
                <>
                  {/* 🔥 기존 투박한 다각형(polygon) SVG를 얇고 미니멀한 라인(polyline) 형태의 '>' 아이콘으로 교체하고 크기 축소 */}
                  <div className="flex items-center justify-center w-6 h-6 md:w-8 md:h-8 text-zinc-900 mb-2 md:mb-3">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="square" strokeLinejoin="miter" className="w-full h-full">
                      <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                  </div>
                  
                  <span className="text-[9px] md:text-[10px] font-black tracking-[0.3em] uppercase text-zinc-900">
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