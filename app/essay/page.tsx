import React from 'react';
import Header from '@/components/Header';
import { IBM_Plex_Mono } from 'next/font/google';

// 🔥 1. 폰트를 IBM Plex Mono로 통일
const ibm = IBM_Plex_Mono({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'] 
});

const essays = [
  {
    id: 1,
    date: "August 11, 2026",
    title: "MANIFESTO",
    content: (
      <>
        <p className="font-semibold text-base md:text-lg text-zinc-900 pb-2">
          “인간성의 본질이 상상하고, 창조하는 능력에 있다.”
        </p>
        
        <p>
          이것은 저 자신이자, 우리 브랜드가 존재하는 아이디어의 근원입니다.
        </p>
        
        <p>
          어려서부터 공교육 아래에서 창의적으로 문제를 해결하는 방법 대신, 주어진 정답을 도출하는 방법을 학습하고 이런 교육 방식은 대학 기관에서도 크게 다르지 않다는 걸 느끼며 많은 회의감이 들었습니다.<br />
        </p>
        
        <p>
          어릴 적 순수했던 꿈은 점점 성장하며, 시도해본 적도 없는데 ‘현실’이라는 이름으로 다가와 망각을 하게 만들고 이것은 저 개인의 서사가 아닌, 많은 사람들이 한 번쯤은 느껴봤을만한 일이라고 생각합니다.
        </p>
        
        <p>
          SNS, 레거시 미디어에선 배드 뉴스, 끔찍한 사건, 온갖 구설수와 논란 그리고 과한 외모에 관한 숭배적인 문화 등이 천지입니다. 할 수 있다는 메세지보단, 적당히 사는 법, 평범하게 사는 법, 현실적인 조언이 주류를 차지했고 이로 인해 사람들은 자신도 모르는 새에 별 거 아니라고 생각했던 그 문화가 어느새 정신까지 물들여 놓았습니다.
        </p>
        
        <p>
          저는 누구나 마음속에 '자신이 꿈꾸는 이상적인 모습'을 품고 태어난다고 믿습니다. 하지만 우리는 성장하는 과정에서 알게 모르게 스스로에게 한계를 긋는 법을 배웁니다.
        </p>
        
        <p>
          창의적으로 문제를 해결하기보단 정해진 정답을 찾는 교육, 할 수 있다는 응원보단 적당히 현실에 타협하라는 사회적 분위기, 그리고 미디어가 쏟아내는 자극적인 소음들이 우리의 정신을 옭아맸습니다.
        </p>
        
        <p>
          어느새 진취적이고 창조적인 삶은 비현실적인 것이 되었고, 우리는 자유인이 아닌 주어진 현실에 순응하는 정신적 노예로 살아가기를 강요받고 있습니다. 저는 이런 생각의 족쇄를 끊어내고 싶습니다.
        </p>
        
        <p className="font-medium text-zinc-900 pt-4">
          자신의 비전을 찾고, 그 비전을 쫓아가는 사람들.
        </p>
        
        <p>
          그러한 비전가들이 많아질수록 세상은 더욱 풍요로워지고, 치유의 시대가 돌아올 것이라고 믿습니다.
        </p>
        
        <div className="py-4">
          <p className="italic text-zinc-500 text-xs md:text-sm leading-relaxed border-l border-zinc-300 pl-4">
            "하나님이 그들에게 복을 주시며 하나님이 그들에게 이르시되 생육하고 번성하여 땅에 충만하라, 땅을 정복하라, 바다의 물고기와 하늘의 새와 땅에 움직이는 모든 생물을 다스리라 하시니라" <br />
            — 창세기 1:28
          </p>
        </div>
        
        <p>
          당신이 종교인이든, 비종교인이든 이 메시지는 우리에게 본질적인 진리를 전합니다.
        </p>
        
        <p>
          경쟁하여 남을 짓밟는 것이 아니라, 무언가를 '창조'하고 자신의 세상을 개척해 나가는 것. 그것이 우리에게 주어진 사명이자 인간의 진짜 모습입니다.
        </p>
        
        <div className="py-4">
          <p className="italic text-zinc-500 text-xs md:text-sm leading-relaxed border-l border-zinc-300 pl-4">
            “믿음은 바라는 것들의 실상이요 보이지 않는 것들의 증거니” <br />
            — 히브리서 11장 1절
          </p>
        </div>
        
        <p>
          모든 정답과, 원하는 결과를 만들어낼 수 있는 능력은 이미 당신 안에 있습니다. 그리고 그것은 하나님께서 우리에게 주신 최고의 선물이자 인간의 본질입니다.
        </p>
        
        <p>
          단지 그것에 집중하지 못 하게 하고, 소음을 만들어 가치를 만들어내는 자유인이 아닌, 권력에 순종하는 정신적 노예에 머무르게 하고자 하는 악의 세력이 있을 뿐입니다.
        </p>
        
        <p>
          혼자 하고자 하면 힘들고 외로운 길이 될 것입니다. 자신을 둘러싼 환경이 끊임없이 스스로를 의심하게 만들고 무엇이 진리인지 깨닫게 못 하게 하며, 외적인 압박에 놓여진 상황도 벌어질 수 있습니다.
        </p>
        
        <p>
          저는 이런 비전을 가진 이들이 혼자가 아닌, 1명, 10명, 100명이 모여 서로의 비전을 지지하는 하나의 문화를 만들고자 합니다.<br />
          문화는 어떠한 법과 제도보다 사람들의 삶에 가장 깊고 강력한 영향을 미치기 때문입니다.
        </p>
        
        <p className="font-medium text-zinc-900 pt-4">
          스스로 창조하고 가치를 만들어 세상을 더욱 풍요롭게 하는 사람.<br />
          전통적인 신앙과 가족, 사랑, 인류애가 넘치는 세상.
        </p>
        
        <p>
          그것이 우리가 지향하는 정체성입니다.
        </p>
        
        <p>
          VISION FOR VISIONARY는 진리를 믿고 개척해 나가는 비전가들의 문화를 입고, 또 만들어 가겠습니다.
        </p>
        
        <p className="font-bold tracking-widest mt-8 text-zinc-900">
          VISION IN MOTION, PERFORMANCE IN ACTION.
        </p>
        
        <div className="mt-16 text-xs text-zinc-400 tracking-widest text-right flex flex-col gap-1 uppercase">
          <p>— 대표 Seung Ahn.</p>
          <p className="capitalize">Aug 11, 2026. 한 카페에서.</p>
        </div>
      </>
    )
  }
];

export default function EssayPage() {
  return (
    <>
      <Header />
      
      <main 
        className={`min-h-screen bg-white text-zinc-900 flex flex-col items-center ${ibm.className}`}
      >
        
        {essays.map((essay) => (
          <section 
            key={essay.id} 
            className="w-full px-6 py-24 md:py-32 border-b border-zinc-200 flex flex-col items-center last:border-0"
          >
            {/* 에세이 헤더 */}
            <div className="max-w-xl w-full text-center mb-16">
              <h1 className="text-[10px] md:text-xs tracking-[0.2em] text-zinc-500 mb-4 uppercase font-medium">
                visionary's essay
              </h1>
              <h2 className="text-xl md:text-2xl font-semibold tracking-[0.1em] leading-[1.3] whitespace-pre-line text-zinc-900 uppercase">
                {essay.title}
              </h2>
              <p className="text-[10px] md:text-xs tracking-widest text-zinc-400 mt-6 uppercase">
                {essay.date}
              </p>
            </div>

            {/* 에세이 본문 */}
            <article className="max-w-xl w-full text-zinc-800 text-sm md:text-[15px] leading-[1.75] tracking-tight space-y-6 flex flex-col break-keep">
              {essay.content}
            </article>
          </section>
        ))}
        
      </main>
    </>
  );
}