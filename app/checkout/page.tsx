'use client';

import { useState } from 'react';
import { useCart } from '@/components/CartProvider';
import { useAccount } from '@/components/AccountProvider';
import Link from 'next/link';
import Bilingual from '@/components/Bilingual';
import Image from 'next/image'; // 🔥 이미지 컴포넌트 임포트
import { createCheckout } from '@/app/actions';
import { sizedImage, sizedSrcSet } from '@/lib/image';

/** 국내 기본 배송비 · 무료 배송 기준 — 배송 정책 페이지와 같은 값 */
const SHIPPING_FEE = 3000;
const FREE_SHIPPING_OVER = 100000;

export default function CheckoutPage() {
  const { cart, updateQuantity, hydrated } = useCart();
  const { customer, loading: accountLoading } = useAccount();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [codeOpen, setCodeOpen] = useState(false);
  const [discountCode, setDiscountCode] = useState('');

  const subtotal = cart.reduce((total, item) => total + (Number(item.price) * item.quantity), 0);

  /**
   * 배송비는 /policies/shipping-policy 에 적힌 값과 같아야 합니다.
   *
   * 예전에는 여기에 30,000원이 박혀 있었습니다 — 정책 페이지에는 3,000원,
   * 결제 직전 화면에는 30,000원. 손님이 보기에는 열 배를 물리는 화면이고,
   * 카드사·PG 심사에서는 '표시 금액과 실제 청구가 다른 가맹점'으로 읽힙니다.
   *
   * 도서·산간 추가 운임과 해외 배송은 주소가 정해져야 계산되므로,
   * 최종 금액은 쇼피파이 결제창에서 확정됩니다.
   */
  const shipping = subtotal > 0 && subtotal < FREE_SHIPPING_OVER ? SHIPPING_FEE : 0;
  const taxes = 0;
  const total = subtotal + shipping + taxes;
  const totalItems = cart.reduce((t, i) => t + i.quantity, 0);

  const handleCheckout = async (asGuest: boolean) => {
    if (cart.length === 0) return;
    setIsCheckingOut(true);
    setCheckoutError(null);

    const lineItems = cart.map(item => ({
      variantId: item.id,
      quantity: item.quantity
    }));

    const result = await createCheckout(lineItems, { asGuest, discountCode });

    if (result.ok) {
      // 여기서부터는 쇼피파이가 결제를 이어받습니다.
      window.location.href = result.url;
    } else {
      setCheckoutError(result.message);
      setIsCheckingOut(false);
    }
  };

  return (
    <main className="w-screen h-screen flex flex-col bg-white text-black font-sans overflow-y-auto overflow-x-hidden md:overflow-hidden">

      {/* 헤더 */}
      <header className="h-16 md:h-20 flex justify-between items-center px-4 md:px-8 lg:px-16 border-b border-zinc-200 flex-shrink-0 sticky top-0 bg-white z-10">
        <Link href="/" className="text-[10px] md:text-xs tracking-widest uppercase text-zinc-500 hover:text-black transition-colors w-20">&lt; Back</Link>
        
        {/* 🔥 기존 텍스트 로고(h1)를 새 그래픽 이미지로 교체 완료 */}
        <div className="flex justify-center flex-1">
          <Image 
            src="/v4v-logo-horizontal.png"  
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
          
          <Bilingual en="Order Summary" ko="주문 정보" inline className="mb-6 flex-shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500 md:mb-8 md:text-[10px]" />

          <div className="flex flex-col">
            {!hydrated ? (
              /* 장바구니는 브라우저에만 저장돼 있어 서버가 알 수 없습니다.
                 다 읽기 전까지 '비었습니다'라고 단정하면, 새로고침한 손님이
                 주문이 날아간 줄 알고 결제 직전에 이탈합니다. */
              <div aria-hidden className="flex flex-col">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 md:gap-6 border-b border-zinc-200 py-4 h-auto md:h-40 flex-shrink-0"
                  >
                    <div className="w-[80px] h-[96px] md:w-[112px] md:h-[128px] flex-shrink-0 animate-pulse bg-zinc-100" />
                    <div className="flex flex-1 flex-col gap-2">
                      <div className="h-3 w-2/5 animate-pulse bg-zinc-100" />
                      <div className="h-2 w-1/4 animate-pulse bg-zinc-100" />
                    </div>
                  </div>
                ))}
              </div>
            ) : cart.length === 0 ? (
              <div className="py-20 flex items-center justify-center">
                <p className="text-[10px] md:text-xs font-black tracking-[0.2em] md:tracking-[0.4em] text-zinc-400 uppercase text-center px-4">YOUR BAG IS EMPTY</p>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3 md:gap-6 border-b border-zinc-200 py-4 h-auto md:h-40 flex-shrink-0">
                  
                  {/* 상품 이미지 */}
                  <div className="bg-zinc-100 relative overflow-hidden flex-shrink-0 w-[80px] h-[96px] md:w-[112px] md:h-[128px]">
                    <img
                      src={sizedImage(item.image, 224)}
                      srcSet={sizedSrcSet(item.image, [160, 224, 336])}
                      sizes="(max-width: 768px) 80px, 112px"
                      width={112}
                      height={128}
                      alt={item.title}
                      className="w-full h-full object-cover absolute inset-0"
                    />
                  </div>

                  {/* 상품 정보 */}
                  <div className="flex flex-col flex-1 gap-1 md:gap-2">
                    <h3 className="text-xs md:text-sm font-bold uppercase tracking-tight text-black leading-tight">{item.title.split(' (')[0]}</h3>
                    <p className="text-[8px] md:text-[10px] text-zinc-500 uppercase tracking-wider">
                      <Bilingual en="Size" ko="사이즈" inline className="mr-1" /> <span className="text-black">{item.title.includes('(') ? item.title.split('(')[1].replace(')', '') : 'ONE SIZE'}</span>
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
          {!hydrated ? (
            <div aria-hidden className="flex w-full flex-col items-center gap-4">
              <div className="h-2 w-20 animate-pulse bg-zinc-100" />
              <div className="h-9 w-full animate-pulse bg-zinc-100" />
              <div className="h-9 w-full animate-pulse bg-zinc-100" />
            </div>
          ) : null}

          {hydrated && cart.length > 0 && (
            <div className="pt-6 md:pt-8 mt-2 md:mt-4 flex flex-col gap-2 md:gap-3 text-[9px] md:text-[10px] font-medium uppercase tracking-wider text-zinc-500 flex-shrink-0 pb-10 md:pb-16">
              <div className="flex justify-between">
                <Bilingual en="Subtotal" ko="상품액" inline />
                <span className="text-zinc-600">KRW {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                {/* 도서·산간 추가 운임과 해외 배송은 주소가 정해져야 계산됩니다 */}
                <Bilingual en="Shipping (confirmed at checkout)" ko="배송비 (결제 시 확정)" inline />
                <span className="text-zinc-600">
                  {shipping === 0 ? (
                    <Bilingual en="Free" ko="무료" inline />
                  ) : (
                    `KRW ${shipping.toLocaleString()}`
                  )}
                </span>
              </div>
              <div className="flex justify-between items-end mt-3 md:mt-4 pt-3 md:pt-4 border-t border-zinc-200">
                <Bilingual en="Total" ko="총액" inline className="font-bold text-[10px] text-black md:text-xs" />
                <span className="text-lg md:text-xl font-black tracking-tight text-black">KRW {total.toLocaleString()}</span>
              </div>

              {/* 재화의 공급 시기 — 결제를 누르기 전에 읽혀야 합니다 */}
              <Bilingual
                en={`Dispatched within 1–3 business days · delivered within 14 days (Korea). Free shipping over KRW ${FREE_SHIPPING_OVER.toLocaleString()}.`}
                ko={`결제 완료 후 영업일 기준 1~3일 이내 출고 · 국내 수령까지 최대 14일 이내 · ${FREE_SHIPPING_OVER.toLocaleString()}원 이상 무료 배송`}
                className="mt-3 text-[9px] font-light normal-case leading-[1.8] tracking-normal text-zinc-400 md:text-[9.5px]"
              />
            </div>
          )}
        </section>

        {/* ➡️ 우측 (모바일에선 하단): 회원 / 비회원 주문 선택 */}
        <section className="flex w-full flex-shrink-0 flex-col items-center justify-center gap-4 border-t border-zinc-200 px-6 py-10 md:w-56 md:border-l md:border-t-0 md:py-0 lg:w-64">
          {cart.length > 0 && (
            <>
              <Bilingual en="Checkout as" ko="주문 방식" inline className="justify-center font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-400" />

              {accountLoading ? (
                <span className="font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-400">
                  ...
                </span>
              ) : customer ? (
                <>
                  {/* 회원 주문 — 배송지·연락처가 미리 채워지고 주문 내역에 기록됩니다 */}
                  <button
                    onClick={() => handleCheckout(false)}
                    disabled={isCheckingOut}
                    className="w-full bg-zinc-900 py-4 font-mono text-[9.5px] uppercase tracking-[0.24em] text-white transition-opacity duration-500 hover:opacity-80 disabled:opacity-40"
                  >
                    {isCheckingOut ? 'Opening…' : 'Checkout'}
                  </button>
                  <div className="flex flex-col items-center gap-0.5">
                    <Bilingual en="Member order" ko="회원 주문" inline className="justify-center font-mono text-[8.5px] uppercase tracking-[0.12em] text-zinc-400" />
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.12em] text-zinc-400">
                      {customer.firstName || customer.email}
                    </span>
                  </div>
                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={isCheckingOut}
                    className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-400 underline underline-offset-4 transition-colors hover:text-zinc-900 disabled:opacity-40"
                  >
                    <Bilingual en="Continue as guest" ko="비회원으로 주문" inline className="justify-center" />
                  </button>
                </>
              ) : (
                <>
                  {/* 비회원 주문 — 계정 없이 바로 결제 */}
                  <button
                    onClick={() => handleCheckout(true)}
                    disabled={isCheckingOut}
                    className="w-full bg-zinc-900 py-4 font-mono text-[9.5px] uppercase tracking-[0.24em] text-white transition-opacity duration-500 hover:opacity-80 disabled:opacity-40"
                  >
                    {isCheckingOut ? 'Opening…' : <Bilingual en="Guest order" ko="비회원 주문" inline className="justify-center" />}
                  </button>
                  <span className="font-mono text-[8px] uppercase tracking-[0.2em] text-zinc-300">
                    or
                  </span>
                  <Link
                    href="/account/login?next=%2Fcheckout"
                    className="w-full border border-zinc-300 py-4 text-center font-mono text-[9.5px] uppercase tracking-[0.24em] text-zinc-900 transition-colors duration-500 hover:border-zinc-900"
                  >
                    <Bilingual en="Sign in to order" ko="로그인하고 주문" inline className="justify-center" />
                  </Link>
                  <Bilingual
                    en="Saved address · order history"
                    ko="배송지 저장 · 주문 내역"
                    inline
                    className="justify-center text-center font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-400"
                  />
                </>
              )}

              {/* 창립 멤버 코드 — 평소엔 접혀 있다가 필요한 사람만 펼칩니다.
                  코드가 맞는지는 쇼피파이 결제창이 금액으로 답합니다. */}
              <div className="flex w-full flex-col items-center gap-2 border-t border-zinc-200 pt-4">
                {codeOpen ? (
                  <>
                    <label htmlFor="v4v-code" className="sr-only">
                      Founder code
                    </label>
                    <input
                      id="v4v-code"
                      value={discountCode}
                      onChange={(e) => setDiscountCode(e.target.value.toUpperCase())}
                      placeholder="V4V-FOUNDER-001"
                      autoComplete="off"
                      spellCheck={false}
                      className="w-full border-b border-zinc-300 bg-transparent pb-2 text-center font-mono text-[9.5px] uppercase tracking-[0.16em] text-zinc-900 outline-none transition-colors duration-500 placeholder:text-zinc-300 focus:border-zinc-900"
                    />
                    <Bilingual
                      en="Applied at checkout · sign in required"
                      ko="결제창에서 적용 · 로그인 필요"
                      inline
                      className="justify-center text-center font-mono text-[8px] uppercase tracking-[0.1em] text-zinc-400"
                    />
                  </>
                ) : (
                  <button
                    onClick={() => setCodeOpen(true)}
                    className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-zinc-400 underline underline-offset-4 transition-colors hover:text-zinc-900"
                  >
                    <Bilingual en="Have a code" ko="코드 입력" inline className="justify-center" />
                  </button>
                )}
              </div>

              {checkoutError && (
                <p className="max-w-[220px] text-center font-mono text-[9px] uppercase leading-[1.8] tracking-[0.12em] text-zinc-500">
                  {checkoutError}
                </p>
              )}
            </>
          )}
        </section>

      </div>
    </main>
  );
}