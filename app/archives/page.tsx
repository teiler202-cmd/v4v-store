'use client';

import { useState } from 'react';
import Header from '@/components/Header';
import { motion, AnimatePresence } from 'framer-motion';
// 🔥 나눔명조체 추가 임포트
import { IBM_Plex_Mono, Nanum_Myeongjo } from 'next/font/google';

const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

// 🔥 나눔명조체 설정
const nanumMyeongjo = Nanum_Myeongjo({
  weight: ['400', '700', '800'],
  subsets: ['latin'],
});

const archiveData = [
  {
    id: 'szn-1',
    season: 'SZN 1',
    subtitle: 'Midbar, only be humble under god',
    contentEn: "[The start of the Idea]\nMidbar (the wilderness) is a realm where the noise of the world fades, allowing the inner voice—the voice of the Divine—to finally surface. The sweeping curves of sand dunes evoke a profound sense of awe, reflecting nature’s will to maintain order amidst vast chaos.\n\n\"The wilderness and the dry land shall be glad, the desert shall rejoice and blossom like the crocus... they shall see the glory of the Lord, the majesty of our God.\" - Isaiah 35:1-2\n\nStep away from the realities that confine us—the clamor of the city, the conditioning of media, the constant chatter of others. Block out the static, reflect deeply, align with the Divine will, and set forth to find your Midbar.\n\n[The Beauty of the Desert]\nThe curvature of the boundless desert mimics the elegant drape of soft fabric. Inspired by the ultra-fine texture of sand, the solitary silence, the endless expanse, and the utilitarian garments of desert dwellers adapted to extreme climates—this collection weaves the dual imagery of the desert: its harsh, unforgiving nature and its serene, quiet beauty.",
    contentKo: "[아이디어의 시작]\nMidbar(광야)는 세상의 소음이 사리지고 비로소 내면의 목소리, 신의 음성이 들리기 시작하는 공간입니다. 사구의 곡선은 거대한 혼돈 속에서도 질서를 유지하려는 자연의 모습으로 경외심을 들게 합니다.\n\n\"광야와 메마른 땅이 기뻐하며 사막이 백합화같이 피어 즐거워하며... 그것들이 여호와의 영광 곧 우리 하나님의 아름다움을 보리로다\" (이사야 35:1-2)\n\n도시의 소음, 미디어의 세뇌, 주변 사람들 등 우리를 둘러싼 현실적인 환경에서 벗어나 소음을 차단하고, 깊이 사고하며 신의 뜻대로 행하고, 신의 음성을 들을 수 있는 Midbar를 찾아서 떠나십시오.\n\n[사막의 아름다움]\n광활한 모래 사막의 곡선은 마치 부드러운 원단 같은 드레이프성을 보여줍니다. 아주 고운 촉감의 모래, 고요하고 고독한 사막의 적막, 끝을 알 수 없는 막막함, 그리고 오아시스, 사막인들의 삶의 방식과 기후적 특성을 고려한 복장에서 영감을 받은 이번 컬렉션은 거칠고 혹독한 사막과 부드럽고 고요한 사막의 두 이미지를 컬렉션에 녹여내고자 했습니다.",
    media: [
      { 
        id: 1, 
        type: 'youtube', 
        src: 'https://www.youtube.com/embed/mNyY1b2KgsM?autoplay=1&mute=1&loop=1&playlist=mNyY1b2KgsM&controls=0', 
        aspect: 'aspect-[16/9]',
        fullWidth: true 
      },
      { id: 2, type: 'image', src: 'https://i.pinimg.com/1200x/89/23/e6/8923e65c6b4197b985c90454c48a014b.jpg', aspect: 'aspect-[6/9]' },
      { id: 3, type: 'image', src: 'https://i.pinimg.com/1200x/17/80/5e/17805e0666c9922a065abb96f6ea6821.jpg', aspect: 'aspect-[6/4]' },
      { id: 4, type: 'image', src: 'https://i.pinimg.com/1200x/47/12/75/47127540b0c668492d4dbafb9def57e0.jpg', aspect: 'aspect-[4/5]' },
      { id: 5, type: 'image', src: 'https://i.pinimg.com/736x/8a/02/ce/8a02ce816f7704f42f7e81afe21dca6b.jpg', aspect: 'aspect-[4/5]' },
      { id: 6, type: 'image', src: 'https://i.pinimg.com/736x/8c/73/c7/8c73c7914be3ecab64469b9223e71957.jpg', aspect: 'aspect-[16/9]' },
      { id: 7, type: 'image', src: 'https://i.pinimg.com/736x/e6/ea/05/e6ea056467028458d96897dde4ddb4e9.jpg', aspect: 'aspect-[16/9]' },
      { id: 8, type: 'image', src: 'https://i.pinimg.com/1200x/4b/fc/92/4bfc92f02b4f346c96608d65a3daf4f4.jpg', aspect: 'aspect-[1/1]' },
      { id: 9, type: 'image', src: 'https://i.pinimg.com/736x/61/bd/b0/61bdb0e6e16865f8b77f4a52ac8bb9f4.jpg', aspect: 'aspect-[1/1]' },
    ]
  },
  {
    id: 'szn-2',
    season: 'SZN 2',
    subtitle: 'EXPANSION',
    contentEn: "Pushing the boundaries further. \n\nSZN 2 delves deeper into the interplay between light and shadow. We introduced new textiles and utilitarian silhouettes that adapt to the wearer's environment.\n\nIt is an evolution of our core philosophy: Vision in Motion, Performance in Action. Less noise, more intent.",
    contentKo: "", // SZN 2는 아직 한글 텍스트가 없으므로 빈칸 유지
    media: [
      { id: 6, type: 'video', src: 'https://cdn.pixabay.com/video/2021/08/04/83893-585352697_tiny.mp4', aspect: 'aspect-video', fullWidth: true },
      { id: 7, type: 'image', src: 'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?q=80&w=2000&auto=format&fit=crop', aspect: 'aspect-[4/5]' },
      { id: 8, type: 'image', src: 'https://images.unsplash.com/photo-1505022610485-0249ba5b3675?q=80&w=2000&auto=format&fit=crop', aspect: 'aspect-[4/5]' },
      { id: 9, type: 'image', src: 'https://images.unsplash.com/photo-1542315147-3803138863f6?q=80&w=2000&auto=format&fit=crop', aspect: 'aspect-[4/5]' },
    ]
  }
];

export default function ArchivesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextSeason = () => setCurrentIndex((prev) => (prev + 1) % archiveData.length);
  const prevSeason = () => setCurrentIndex((prev) => (prev - 1 + archiveData.length) % archiveData.length);

  const currentData = archiveData[currentIndex];

  return (
    <main className="min-h-screen bg-black text-white selection:bg-white selection:text-black pb-32">
      <Header />

      <div className="pt-20 max-w-[1400px] mx-auto px-6 md:px-10">
        
        <div className="mb-12 flex flex-col items-center justify-center text-center gap-4">
          <h1 className="text-4xl md:text-5xl font-bold tracking-tighter uppercase">Archives</h1>
          <p className={`${ibm.className} text-xs text-zinc-500 tracking-[0.2em] max-w-2xl uppercase`}>
            A curated collection of inspirations, past forms, and the visual language of V4V.
          </p>
        </div>

        <div className="flex justify-center items-center gap-8 mb-20 border-y border-zinc-900/50 py-4">
          <button onClick={prevSeason} className={`${ibm.className} text-zinc-500 hover:text-white transition-colors text-lg px-4`}>&lt;</button>
          <motion.div 
            key={currentData.season} 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className={`${ibm.className} text-sm md:text-base tracking-[0.3em] font-medium uppercase w-32 text-center`}
          >
            {currentData.season}
          </motion.div>
          <button onClick={nextSeason} className={`${ibm.className} text-zinc-500 hover:text-white transition-colors text-lg px-4`}>&gt;</button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentData.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row gap-12 lg:gap-20"
          >
            
            {/* 🔥 [핵심 수정]: 무조건 2열(grid-cols-2)로 시작하게 만듦. 모바일에서는 여백(gap)을 살짝 줄임 */}
            <div className="w-full md:w-[65%] grid grid-cols-2 gap-2 md:gap-6">
              {currentData.media.map((item) => (
                <div
                  key={item.id}
                  // 🔥 [핵심 수정]: fullWidth 속성이 있는 영상만 무조건 2칸(col-span-2)을 다 차지하게 강제 설정
                  className={`relative w-full bg-zinc-900 overflow-hidden group cursor-crosshair ${item.fullWidth ? 'col-span-2' : 'col-span-1'} ${item.aspect}`}
                >
                  {item.type === 'youtube' ? (
                    <iframe 
                      src={item.src}
                      allow="autoplay; fullscreen; picture-in-picture"
                      className="w-full h-full object-cover opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700 ease-out pointer-events-none"
                    />
                  ) : item.type === 'video' ? (
                    <video 
                      src={item.src} autoPlay loop muted playsInline 
                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  ) : (
                    <img 
                      src={item.src} alt={`${currentData.season} media ${item.id}`} 
                      className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105 transition-all duration-700 ease-out"
                    />
                  )}
                  
                  <div className={`${ibm.className} absolute bottom-2 right-2 md:bottom-4 md:right-4 text-[8px] md:text-[10px] text-white opacity-0 group-hover:opacity-100 tracking-widest transition-opacity duration-500 uppercase mix-blend-difference`}>
                    REF. {String(item.id).padStart(3, '0')} {item.type === 'video' && '(VID)'} {item.type === 'youtube' && '(YT)'}
                  </div>
                </div>
              ))}
            </div>

            <div className="w-full md:w-[35%] relative">
              <div className="sticky top-40 flex flex-col gap-6">
                <h2 className={`${ibm.className} text-sm tracking-[0.2em] text-zinc-400 uppercase`}>
                  {currentData.subtitle}
                </h2>
                <div className="w-8 h-[1px] bg-white"></div>
                
                {/* 상단 영문 텍스트 */}
                {currentData.contentEn && (
                  <p className="text-sm md:text-base font-light text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {currentData.contentEn}
                  </p>
                )}

                {/* 하단 국문 텍스트 (나눔명조체 적용) */}
                {currentData.contentKo && (
                  <div className={`mt-4 pt-8 border-t border-zinc-900/50 ${nanumMyeongjo.className}`}>
                    <p className="text-[13px] md:text-[15px] font-light text-zinc-400 leading-[1.8] whitespace-pre-wrap break-keep">
                      {currentData.contentKo}
                    </p>
                  </div>
                )}
                
              </div>
            </div>

          </motion.div>
        </AnimatePresence>

      </div>
    </main>
  );
}