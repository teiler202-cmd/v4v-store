import Header from '@/components/Header';
import { getProduct } from '@/lib/shopify';
import Link from 'next/link';
import ProductForm from '@/components/ProductForm';

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const handle = resolvedParams.handle;
  const product = await getProduct(handle);

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white gap-4">
        <p className="uppercase tracking-widest text-xs text-zinc-500">Product not found</p>
        <Link href="/" className="border border-white/20 px-6 py-3 text-xs uppercase hover:bg-white hover:text-black transition-colors">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-white selection:text-black">
      
      {/* 🔥 임시 짭헤더를 뜯어내고 메인 페이지와 완벽하게 동일한 '찐 헤더' 장착! */}
      <Header />
      
      {/* --- 상품 메인 레이아웃 영역 --- */}
      {/* 💡 헤더가 자리를 차지하게 되었으므로 윗 공간(pt-32)을 살짝 줄였습니다(pt-10 md:pt-20) */}
      <div className="pt-10 md:pt-20 pb-20 max-w-[1400px] mx-auto px-10 flex flex-col md:flex-row gap-20">
        
        {/* 좌측: 상품 이미지 */}
        <div className="w-full md:w-3/5 flex flex-col gap-4">
          {product.images?.edges.map((image: any, index: number) => (
            <div key={index} className="w-full bg-zinc-900 border border-white/5 aspect-[4/5] overflow-hidden">
              <img src={image.node.url} alt={image.node.altText || product.title} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        
        {/* 우측: 상품 상세 & 폼 */}
        <div className="w-full md:w-2/5 relative">
          <div className="sticky top-40 flex flex-col gap-10">
            <div className="flex flex-col gap-2 border-b border-white/10 pb-6">
              <h1 className="text-2xl font-medium tracking-tight uppercase leading-tight">{product.title}</h1>
              <p className="text-sm font-light text-zinc-400">
                {product.priceRange?.minVariantPrice?.currencyCode || 'KRW'} {Math.floor(product.priceRange?.minVariantPrice?.amount || 0).toLocaleString()}
              </p>
            </div>
            
            {/* 지능형 사이즈 폼 & 장바구니 담기 로직 */}
            <ProductForm product={product} />
            
            <div className="pt-6 border-t border-white/10">
              <span className="text-[10px] uppercase tracking-widest text-zinc-500 block mb-4">Details</span>
              <div className="text-xs text-zinc-400 font-light leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}