import Header from '@/components/Header';
import { getProduct } from '@/lib/shopify';
import Link from 'next/link';
// 🔥 방금 만든 클라이언트 뷰 컴포넌트를 불러옵니다!
import ProductClientView from '@/components/ProductClientView'; 

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const handle = resolvedParams.handle;
  const product = await getProduct(handle);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-white text-black gap-4">
        <p className="uppercase tracking-widest text-xs text-zinc-500">Product not found</p>
        <Link href="/" className="border border-black/20 px-6 py-3 text-xs uppercase hover:bg-black hover:text-white transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white text-black font-sans selection:bg-zinc-200 selection:text-black">
      <Header />
      
      {/* 데이터를 통째로 뷰 컴포넌트에 넘겨줍니다 */}
      <ProductClientView product={product} />
      
    </main>
  );
}