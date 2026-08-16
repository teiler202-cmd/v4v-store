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
      className="w-full bg-[#f5f5f5] aspect-[3/4] relative overflow-hidden md:cursor-crosshair border border-black/5"
      onMouseEnter={() => setIsZoomed(true)}
      onMouseLeave={() => setIsZoomed(false)}
      onMouseMove={handleMouseMove}
    >
      <img 
        src={src} 
        alt={alt} 
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-200 ${isZoomed ? 'opacity-100 md:opacity-0' : 'opacity-100'}`}
      />
      <div 
        className={`hidden md:block absolute inset-0 w-full h-full bg-no-repeat transition-opacity duration-200 ${isZoomed ? 'opacity-100' : 'opacity-0'}`}
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

  const handleThumbnailClick = (idx: number) => {
    setSelectedIdx(idx);
    imageRefs.current[idx]?.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollLeft = e.currentTarget.scrollLeft;
    const width = e.currentTarget.clientWidth;
    if (width > 0) {
      const newIdx = Math.round(scrollLeft / width);
      setSelectedIdx(newIdx);
    }
  };

  return (
    <div className="pt-0 md:pt-24 pb-24 max-w-[1400px] mx-auto md:px-10 flex flex-col md:flex-row gap-6 md:gap-16">
      
      {/* 📸 좌측 영역 */}
      <div className="w-full md:w-3/5 flex flex-col relative">
        <div 
          className="w-full flex md:block overflow-x-auto md:overflow-visible snap-x snap-mandatory md:snap-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] gap-1 md:gap-0"
          onScroll={handleScroll}
        >
          {images.map((url: string, idx: number) => (
            <div key={idx} ref={(el) => { imageRefs.current[idx] = el; }} className="w-full min-w-full md:min-w-0 shrink-0 snap-center md:mb-4 md:last:mb-0">
              <ZoomImage src={url} alt={`${product.title}-${idx}`} />
            </div>
          ))}
        </div>

        <div className="flex md:hidden justify-center gap-2 mt-4">
          {images.map((_, idx) => (
            <div 
              key={idx} 
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${selectedIdx === idx ? 'bg-zinc-900' : 'bg-zinc-300'}`} 
            />
          ))}
        </div>
      </div>

      {/* 🗂️ 우측 영역 (텍스트 및 폼) */}
      <div className="w-full md:w-2/5 relative px-6 md:px-0">
        <div className="md:sticky md:top-28 flex flex-col md:flex-row gap-5 md:gap-8">
          
          <div className="hidden md:flex w-12 md:w-16 flex-col gap-3 shrink-0">
            {images.map((url: string, idx: number) => (
              <div 
                key={idx} 
                className={`w-full aspect-[3/4] cursor-pointer border-b-2 transition-all duration-150 ${selectedIdx === idx ? 'border-zinc-900 opacity-100' : 'border-transparent opacity-50 hover:opacity-100 hover:border-zinc-300'} bg-[#f5f5f5]`}
                onClick={() => handleThumbnailClick(idx)}
              >
                <img src={url} alt={`thumbnail-${idx}`} className="w-full h-full object-cover mix-blend-multiply" />
              </div>
            ))}
          </div>

          <div className="flex-1 flex flex-col gap-8 md:gap-10">
            
            {/* 🔥 디테일 텍스트 하단 여백을 pb-8에서 pb-12로 넓혀 가로 선과의 간격을 확보했습니다! */}
            <div className="flex flex-col gap-6 border-b border-black/10 pb-12">
              <div className="flex flex-col gap-2">
                <h1 className="text-xl md:text-2xl font-medium tracking-tight uppercase leading-tight text-zinc-900">{product.title}</h1>
                <p className="text-sm font-medium text-zinc-500 tracking-widest">
                  {product.priceRange?.minVariantPrice?.currencyCode || 'KRW'} {Math.floor(product.priceRange?.minVariantPrice?.amount || 0).toLocaleString()}
                </p>
              </div>
              
              <div className="text-[11px] md:text-xs text-zinc-600 font-light leading-relaxed space-y-2 uppercase" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            </div>
            
            <ProductForm product={product} />

          </div>

        </div>
      </div>
    </div>
  );
}