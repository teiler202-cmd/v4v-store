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
    <main className="w-screen h-screen flex flex-col bg-black text-white font-sans overflow-hidden">

      <header className="h-20 flex justify-between items-center px-8 lg:px-16 border-b border-zinc-900 flex-shrink-0">
        <Link href="/" className="text-xs tracking-widest uppercase text-zinc-500 hover:text-white transition-colors">&lt; BACK</Link>
        <h1 className="text-2xl font-black tracking-tighter text-white">V4V</h1>
        <div className="w-20 flex justify-end">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Cart [{totalItems}]</span>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden w-full max-w-7xl mx-auto">

        <section className="flex-1 h-full overflow-y-auto px-8 lg:px-16 py-12 flex flex-col">
          
          <h2 className="text-[10px] tracking-widest uppercase font-bold text-zinc-600 mb-8 flex-shrink-0">주문 정보</h2>

          {/* [수정]: flex-1을 빼서 결제 금액(총액)이 바닥으로 떨어지지 않고 상품 바로 밑에 붙게 만듦 */}
          <div className="flex flex-col">
            {cart.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <p className="text-xs font-black tracking-[0.4em] text-zinc-800 uppercase">YOUR BAG IS EMPTY</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-6 border-b border-zinc-900 h-40 flex-shrink-0">
                  
                  <div 
                    className="bg-zinc-900 relative overflow-hidden"
                    style={{ width: '112px', height: '128px', minWidth: '112px', flexShrink: 0 }}
                  >
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover absolute inset-0" />
                  </div>

                  <div className="flex flex-col flex-1 gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-tight text-white">{item.title.split(' (')[0]}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
                      사이즈: <span className="text-white">{item.title.includes('(') ? item.title.split('(')[1].replace(')', '') : 'ONE SIZE'}</span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-4 flex-shrink-0">
                    <span className="text-sm font-bold text-white tracking-wide">
                      KRW {(Number(item.price) * item.quantity).toLocaleString()}
                    </span>

                    <div className="flex items-center text-xs font-bold text-zinc-400 border border-zinc-800 rounded-sm overflow-hidden">
                      <button onClick={() => updateQuantity(item.id, -1)} className="px-3 py-1.5 hover:bg-zinc-800 transition-colors">-</button>
                      <span className="px-3 py-1.5 min-w-[32px] text-center border-x border-zinc-800 text-white">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="px-3 py-1.5 hover:bg-zinc-800 transition-colors">+</button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* 총액이 바닥이 아닌 상품 리스트 바로 아래에 붙도록 수정 */}
          {cart.length > 0 && (
            <div className="pt-8 mt-4 flex flex-col gap-3 text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex-shrink-0 pb-16">
              <div className="flex justify-between">
                <span>상품액</span>
                <span className="text-zinc-300">KRW {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>배송비</span>
                <span className="text-zinc-300">KRW {shipping.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-end mt-4 pt-4 border-t border-zinc-900">
                <span className="font-bold text-xs text-white">총액</span>
                <span className="text-xl font-black tracking-tight text-white">KRW {total.toLocaleString()}</span>
              </div>
            </div>
          )}
        </section>

        {/* ➡️ 우측: 결제 화살표 (절대 안 사라지게 인라인 스타일로 화이트 고정) */}
        <section className="w-32 lg:w-48 flex flex-col items-center justify-center flex-shrink-0 border-l border-zinc-900">
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
                  {/* 🔥 [해결]: 무조건 하얀색으로 나오게 style 속성으로 fill과 color를 강제 주입했습니다. */}
                  <div style={{ width: '64px', height: '64px', color: '#ffffff' }} className="flex items-center justify-center">
                    <svg viewBox="0 0 24 24" style={{ fill: '#ffffff', width: '100%', height: '100%' }}>
                      <polygon points="6,3 20,12 6,21"></polygon>
                    </svg>
                  </div>
                  {/* 글자도 무조건 하얀색 고정 */}
                  <span style={{ color: '#ffffff', marginTop: '16px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.3em', textTransform: 'uppercase' }}>
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