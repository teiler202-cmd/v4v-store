import React from 'react';
import Header from '@/components/Header';
import { IBM_Plex_Mono, Nanum_Myeongjo } from 'next/font/google';

const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

const nanum = Nanum_Myeongjo({ 
  weight: ['400', '700', '800'],
  subsets: ['latin'] 
});

// 🔥 1. 에세이 데이터 목록 (가장 위에 있는 것이 최신 글입니다)
const essays = [
  {
    id: 2, // 고유 번호
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
        
        <div className="w-full py-10">
          <div className="w-full h-96 bg-zinc-900 flex items-center justify-center text-zinc-600 text-sm border border-zinc-800">
            [여기에 시크한 흑백 이미지가 들어갑니다]
          </div>
        </div>
        
        <p>
          앞으로 이 공간을 통해 V4V가 영감을 받는 사물, 건축, 그리고 사람들에 대한 이야기를 조용히 기록해 나갈 것이다.
        </p>
      </>
    )
  },
  {
    id: 1, // 이전 글
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
        className="min-h-screen bg-white text-black flex flex-col items-center"
        style={{ fontFamily: `"${ibm.style.fontFamily}", "${nanum.style.fontFamily}", serif` }}
      >
        
        {/* 🔥 2. 배열된 에세이들을 순서대로 화면에 렌더링 (Mapping) */}
        {essays.map((essay) => (
          <section 
            key={essay.id} 
            className="w-full px-6 py-32 border-b border-zinc-900 flex flex-col items-center last:border-0"
          >
            {/* 에세이 헤더 */}
            <div className="max-w-2xl w-full text-center mb-20">
              <h1 className="text-sm tracking-[0.3em] text-gray-400 mb-4 uppercase">
                V4V Journal
              </h1>
              <h2 className="text-3xl font-light tracking-wide leading-snug whitespace-pre-line">
                {essay.title}
              </h2>
              <p className="text-xs text-gray-500 mt-8">{essay.date}</p>
            </div>

            {/* 에세이 본문 */}
            <article className="max-w-2xl w-full text-gray-300 leading-loose tracking-wide space-y-8">
              {essay.content}
            </article>
          </section>
        ))}
        
      </main>
    </>
  );
}