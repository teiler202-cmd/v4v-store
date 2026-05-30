'use client';

import { useCart } from './CartProvider';
import Link from 'next/link';

export default function CartCounter() {
  const { cart } = useCart();
  
  // 장바구니에 담긴 모든 상품의 수량을 더합니다.
  const totalItems = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    // 나중에 /checkout 페이지를 만들면 이곳으로 이동하게 됩니다.
    <Link href="/checkout" className="text-[10px] tracking-[0.3em] uppercase text-zinc-400 hover:text-white transition-colors cursor-pointer font-bold">
      BAG ({totalItems})
    </Link>
  );
}