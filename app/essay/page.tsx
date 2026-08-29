'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { nanum } from '@/lib/fonts';

const essays = [
  {
    id: 1,
    /** 좌측 인덱스에 찍히는 번호 — 글을 쓴 순서대로 매깁니다 */
    number: '001',
    slug: 'manifesto',
    date: "August 11, 2026",
    title: "MANIFESTO",
    content: (
      <>
        <p className="font-semibold text-base md:text-lg text-zinc-900 pb-2">
          “인간성의 본질이 상상하고, 창조하는 능력에 있다.”
        </p>
        
        <p>
          이것은 제 인생에 가장 많은 도움을 준 스승 혹은 은인께서 제게 눈 뜨게 해준 진리이자, 저 자신이며, 우리 브랜드가 존재하는 아이디어의 근원입니다.
        </p>
        
        <p>
          어려서부터 공교육 아래에서 창의적으로 문제를 해결하는 방법 대신, 주어진 정답을 도출하는 방법을 학습하고 이런 교육 방식은 대학 기관에서도 크게 다르지 않다는 걸 느끼며 많은 회의감이 들었습니다.<br />
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
          당신이 종교인이든, 비종교인이든 이 메시지는 우리에게 본질적인 진리로 다가옵니다.
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
          단지 우리가 그것에 집중하지 못하도록 소음을 만들어내고, 가치를 창조하는 자유인이 아닌 권력에 순종하는 정신적 노예로 머무르게 하려는 악의 세력이 있을 뿐입니다.
        </p>
        
        <p>
          혼자 하고자 하면 힘들고 외로운 길이 될 것입니다. 자신을 둘러싼 환경이 끊임없이 스스로를 의심하게 만들고 무엇이 진리인지 깨닫게 못 하게 하며, 외적인 압박에 놓여진 상황도 벌어질 수 있습니다.
        </p>
        
        <p>
          저는 제가 생각하는 아이디어와 이미지를 현실에 만들어 제 방식으로 표현하고, 그것이 가능하다는 것을 보여주고 싶습니다.<br />
          그리고 저의 가장 가까운 이들이 스스로 믿고 나아갈 수 있으면 좋겠다는 생각으로 시작하게 되었습니다.
        </p>
        
        <p>
          나아가, 브랜드 유저들 한 명 한 명이 제가 만든 제품으로 아주 조금이라도 믿을 수 있는 에너지가 전해지길 바랍니다.
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
          그것이 우리가 지향하는 세상입니다.
        </p>
        
        <div className="mt-8">
          <p className="font-bold tracking-widest text-zinc-900 uppercase">
            VISION [FOR] VISIONARY
          </p>
          <p className="font-bold tracking-widest mt-1 text-zinc-900">
            VISION IN MOTION, PERFORMANCE IN ACTION.
          </p>
        </div>
        
        <div className="mt-16 text-xs text-zinc-400 tracking-widest text-right flex flex-col gap-1 uppercase">
          <p>— 代表 Seung Ahn.</p>
          <p className="capitalize">Aug 11, 2026. 한 카페에서.</p>
        </div>
      </>
    )
  },
  {
    // 🔎 인덱스 동작 확인용으로 임시로 넣어둔 글입니다. 실제 글로 교체하세요.
    id: 2,
    number: '002',
    slug: 'midbar',
    date: "August 21, 2026",
    title: "MIDBAR",
    content: (
      <>
        <p className="pb-2 text-[14px] font-semibold text-ink md:text-[15px]">
          “광야는 아무것도 없는 땅이 아니라, 아무것도 나를 대신해 말해주지 않는 땅입니다.”
        </p>

        <p>
          도시에서는 매일 수천 개의 문장이 저를 스쳐 지나갑니다. 무엇을 사야 하는지, 어떻게 보여야 하는지, 무엇이 현실적인지. 그 문장들은 너무 익숙해서 어느 순간부터는 제 생각처럼 들립니다.
        </p>

        <p>
          광야(Midbar)로 떠난다는 건 그 문장들이 닿지 않는 거리까지 걸어간다는 뜻입니다. 소리가 사라지고 나면 처음에는 불안이 옵니다. 나를 설명해주던 것들이 전부 사라지기 때문입니다. 그 불안을 지나야 비로소 내 목소리가 들립니다.
        </p>

        <p>
          사막의 모래 언덕은 매일 모양을 바꾸지만, 바람의 방향을 거스르지는 않습니다. 거대한 혼돈 속에서도 질서를 지키는 방식입니다. 저는 그것이 창조의 태도라고 생각합니다. 유행을 따르지 않되, 세계가 움직이는 원리는 존중하는 것.
        </p>

        <p>
          우리가 만드는 옷도 같은 자리에서 출발합니다. 거친 기후를 견디기 위해 만들어진 옷은 장식이 없습니다. 필요한 것만 남기고, 남긴 것은 오래 씁니다. 미니멀은 스타일이 아니라 생존의 결론입니다.
        </p>

        <p className="pt-2 font-medium text-ink">
          당신의 광야는 어디입니까.
        </p>

        <div className="mt-16 flex flex-col gap-1 text-right font-mono text-[9px] uppercase tracking-[0.24em] text-ash">
          <p>— 代表 Seung Ahn.</p>
          <p>Aug 21, 2026.</p>
        </div>
      </>
    )
  }
];

export default function EssayPage() {
  // 최신 글이 위로, 오래된 글이 아래로 놓입니다.
  const ordered = [...essays].sort((a, b) => Number(b.number) - Number(a.number));
  const [active, setActive] = useState(ordered[0]?.slug ?? '');
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  // 지금 화면에 들어와 있는 글을 인덱스에 표시합니다.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible?.target instanceof HTMLElement && visible.target.dataset.slug) {
          setActive(visible.target.dataset.slug);
        }
      },
      { rootMargin: '-30% 0px -55% 0px', threshold: [0, 0.25, 0.5, 1] }
    );

    Object.values(sectionRefs.current).forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const jumpTo = useCallback((slug: string) => {
    const el = sectionRefs.current[slug];
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // 헤더(+모바일 인덱스 바)에 가리지 않도록 그만큼 위를 비워둡니다.
    const offset = window.innerWidth < 1024 ? 122 : 96;
    const top = el.getBoundingClientRect().top + window.scrollY - offset;
    // 페이지를 떠나지 않고, 해당 글 자리로 미끄러져 갑니다.
    window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
  }, []);

  return (
    <>
      {/* ---------- 인덱스 (데스크톱: 좌측 고정) ---------- */}
      <nav
        aria-label="Essay index"
        className="pointer-events-none fixed left-6 top-1/2 z-30 hidden -translate-y-1/2 lg:block xl:left-10"
      >
        <ul className="pointer-events-auto flex flex-col gap-3">
          {ordered.map((essay) => {
            const on = active === essay.slug;
            return (
              <li key={essay.slug}>
                <button
                  onClick={() => jumpTo(essay.slug)}
                  className={`group flex items-baseline gap-3 text-left font-mono text-[9px] uppercase tracking-[0.2em] transition-colors duration-500 ease-silk ${
                    on ? 'text-ink' : 'text-ash hover:text-ink'
                  }`}
                >
                  <span className="tabular-nums">{essay.number}</span>
                  <span className="relative">
                    {essay.title}
                    <span
                      className={`absolute -bottom-0.5 left-0 h-px w-full origin-left bg-ink transition-transform duration-[600ms] ease-silk ${
                        on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                      }`}
                    />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* ---------- 인덱스 (모바일·태블릿: 상단 가로 바) ---------- */}
      <nav
        aria-label="Essay index"
        className="scrollbar-hide sticky top-[62px] z-30 flex gap-5 overflow-x-auto border-b border-line-soft bg-paper/90 px-5 py-2.5 backdrop-blur-xl lg:hidden"
      >
        {ordered.map((essay) => {
          const on = active === essay.slug;
          return (
            <button
              key={essay.slug}
              onClick={() => jumpTo(essay.slug)}
              className={`shrink-0 font-mono text-[9px] uppercase tracking-[0.16em] transition-colors duration-500 ${
                on ? 'text-ink' : 'text-ash'
              }`}
            >
              <span className="tabular-nums">{essay.number}</span>
              <span className="ml-2">{essay.title}</span>
            </button>
          );
        })}
      </nav>

      <main className="flex min-h-screen flex-col items-center bg-paper text-ink">
        {ordered.map((essay) => (
          <section
            key={essay.id}
            id={essay.slug}
            data-slug={essay.slug}
            ref={(el) => {
              sectionRefs.current[essay.slug] = el;
            }}
            className="flex w-full scroll-mt-32 flex-col items-center border-b border-line-soft px-6 py-20 last:border-0 md:py-28"
          >
            <div className="mb-14 w-full max-w-xl text-center md:mb-20">
              <h1 className="mb-5 font-mono text-[8px] uppercase tracking-[0.32em] text-ash md:text-[9px]">
                Visionary&rsquo;s Essay — {essay.number}
              </h1>
              <h2 className="whitespace-pre-line font-grotesk text-[18px] font-bold uppercase leading-[1.25] tracking-[-0.02em] text-ink md:text-[24px]">
                {essay.title}
              </h2>
              <p className="mt-6 font-mono text-[8px] uppercase tracking-[0.26em] text-ash md:text-[9px]">
                {essay.date}
              </p>
              <span className="mx-auto mt-10 block h-px w-10 bg-ink/25" />
            </div>

            <article
              className={`${nanum.className} flex w-full max-w-lg flex-col space-y-5 break-keep text-[13px] leading-[2.05] tracking-[-0.01em] text-ink/80 md:text-[14px]`}
            >
              {essay.content}
            </article>
          </section>
        ))}
      </main>
    </>
  );
}
