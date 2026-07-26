import React from 'react';
import Header from '@/components/Header';
import { IBM_Plex_Mono } from 'next/font/google';

// 🔥 1. 폰트를 IBM Plex Mono로 통일 (명조체 제거)
const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

const essays = [
  {
    id: 2,
    date: "July 21, 2026",
    title: "시선을 넘어선 비전,\n우리가 세상을 바라보는 방식",
    content: (
      <>
        <p>
          단순히 옷을 입는 행위를 넘어, 그것이 하나의 태도가 되는 순간이 있다. 
          V4V(Vision for Visionary)는 바로 그 찰나의 시선을 포착하기 위해 탄생했다.
        </p>
        <p>
          우리는 타인의 시선에 얽매이지 않고 자신만의 뚜렷한 철학을 밀고 나가는 이들을 위해 존재한다. 
          블랙이라는 색이 모든 빛을 흡수하듯, 우리의 디자인은 불필요한 장식을 덜어내고 본질만을 남긴다.
        </p>
        
        {/* 화이트 테마에 맞게 이미지 플레이스홀더 색상도 밝은 톤으로 수정 */}
        <div className="w-full py-8">
          <div className="w-full h-96 bg-zinc-100 flex items-center justify-center text-zinc-400 text-xs tracking-widest border border-zinc-200 uppercase font-medium">
            [ Image Placeholder ]
          </div>
        </div>
        
        <p>
          앞으로 이 공간을 통해 V4V가 영감을 받는 사물, 건축, 그리고 사람들에 대한 이야기를 조용히 기록해 나갈 것이다.
        </p>
      </>
    )
  },
  {
    id: 1,
    date: "July 14, 2026",
    title: "블랙, 모든 빛을 흡수하는 침묵",
    content: (
      <>
        <p>
          가장 완벽한 색은 무엇일까. 우리는 주저 없이 블랙이라 답한다.
        </p>
        <p>
          블랙은 비어있음과 동시에 모든 것을 품고 있는 색이다. 화려한 색채로 시선을 빼앗는 대신, 입는 사람의 본질과 태도를 가장 선명하게 드러낸다. V4V의 첫 컬렉션이 오직 무채색으로만 이루어진 이유도 그 때문이다.
        </p>
      </>
    )
  }
];

export default function EssayPage() {
  return (
    <>
      <Header />
      
      <main 
        // 폰트 클래스 적용 및 배경 설정
        className={`min-h-screen bg-white text-zinc-900 flex flex-col items-center ${ibm.className}`}
      >
        
        {essays.map((essay) => (
          <section 
            key={essay.id} 
            // 화이트 테마에 맞게 구분선(border)을 옅은 색(zinc-200)으로 변경
            className="w-full px-6 py-24 md:py-32 border-b border-zinc-200 flex flex-col items-center last:border-0"
          >
            {/* 에세이 헤더 */}
            <div className="max-w-xl w-full text-center mb-16">
              <h1 className="text-[10px] md:text-xs tracking-[0.2em] text-zinc-500 mb-4 uppercase font-medium">
                visionary's essay
              </h1>
              {/* 제목: 자간(tracking-tight)과 행간(leading-[1.3])을 좁혀 밀도 높게 연출 */}
              <h2 className="text-xl md:text-2xl font-semibold tracking-tight leading-[1.3] whitespace-pre-line text-zinc-900">
                {essay.title}
              </h2>
              <p className="text-[10px] md:text-xs tracking-widest text-zinc-400 mt-6 uppercase">
                {essay.date}
              </p>
            </div>

            {/* 에세이 본문 */}
            {/* 본문: text-zinc-800으로 짙은 회색 적용, 자간 좁힘, 행간 적절히 조절 */}
            <article className="max-w-xl w-full text-zinc-800 text-sm md:text-[15px] leading-[1.6] tracking-tight space-y-6 flex flex-col">
              {essay.content}
            </article>
          </section>
        ))}
        
      </main>
    </>
  );
}