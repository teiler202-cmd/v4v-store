'use client';

import { useState, useRef } from 'react';
import ProductForm from '@/components/ProductForm';

function ZoomImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setMousePos({ x, y });
  };

  return (
    <div 
      className="w-full bg-[#f5f5f5] aspect-[3/4] relative overflow-hidden cursor-crosshair border border-black/5"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
      />
      <div 
        className={`absolute inset-0 w-full h-full bg-no-repeat transition-opacity duration-200 ${isZoomed ? 'opacity-100' : 'opacity-0'}`}
        style={{
          backgroundImage: `url(${src})`,
          backgroundPosition: `${mousePos.x}% ${mousePos.y}%`,
          backgroundSize: '250%'
        }}
      />
    </div>
  );
}

export default function ProductClientView({ product }: { product: any }) {
  const images: string[] = product.images?.edges.map((edge: any) => edge.node.url) || [];
  const [selectedIdx, setSelectedIdx] = useState<number>(0);
  const imageRefs = useRef<(HTMLDivElement | null)[]>([]);

  // 🔥 마우스 호버가 아닌, '클릭'했을 때만 실행되도록 함수 이름을 변경하고 역할을 축소했습니다.
  const handleThumbnailClick = (idx: number) => {
    setSelectedIdx(idx);
    imageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div className="pt-6 md:pt-24 pb-24 max-w-[1400px] mx-auto px-6 md:px-10 flex flex-col md:flex-row gap-10 md:gap-16">
      
      {/* 📸 좌측: 이미지 리스트 */}
      <div className="w-full md:w-3/5 flex flex-col gap-4">
        {images.map((url: string, idx: number) => (
          <div key={idx} ref={(el) => { imageRefs.current[idx] = el; }} className="w-full">
            <ZoomImage src={url} alt={`${product.title}-${idx}`} />
          </div>
        ))}
      </div>

      {/* 🗂️ 우측: 부모 기둥 */}
      <div className="w-full md:w-2/5 relative">
        
        {/* 콘텐츠 고정 (sticky) */}
        <div className="sticky top-28 flex flex-row gap-5 md:gap-8">
          
          {/* 1. 세로형 썸네일 리스트 */}
          <div className="w-12 md:w-16 flex flex-col gap-3 shrink-0">
            {images.map((url: string, idx: number) => (
              <div 
                key={idx} 
                className={`w-full aspect-[3/4] cursor-pointer border-b-2 transition-all duration-150 ${selectedIdx === idx ? 'border-zinc-900 opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-zinc-300'} bg-[#f5f5f5]`}
                // 🔥 onMouseEnter 속성을 완전히 삭제하여 스치는 것만으로는 이동하지 않게 만들었습니다.
                onClick={() => handleThumbnailClick(idx)}
              >
                <img src={url} alt={`thumbnail-${idx}`} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
            ))}
          </div>

          {/* 2. 상품 텍스트 및 구매 폼 영역 */}
          <div className="flex-1 flex flex-col gap-10">
            <div className="flex flex-col gap-2 border-b border-black/10 pb-6">
              <h1 className="text-xl md:text-2xl font-medium tracking-tight uppercase leading-tight text-zinc-900">{product.title}</h1>
              <p className="text-sm font-medium text-zinc-500 tracking-widest">
                {product.priceRange?.minVariantPrice?.currencyCode || 'KRW'} {Math.floor(product.priceRange?.minVariantPrice?.amount || 0).toLocaleString()}
              </p>
            </div>
            
            <ProductForm product={product} />
            
            <div className="pt-6 border-t border-black/10">
              <span className="text-[10px] uppercase tracking-widest text-zinc-400 block mb-4 font-semibold">Details</span>
              <div className="text-xs text-zinc-600 font-light leading-relaxed space-y-2" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}