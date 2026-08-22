'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { nanum } from '@/lib/fonts';
import { MaskUp, RevealItem, SILK } from '@/components/Reveal';

type MediaItem = {
  id: number;
  type: 'image' | 'video' | 'youtube';
  src: string;
  /** 원본 비율 [가로, 세로] — 레이아웃이 이 값을 보고 폭을 정합니다 */
  ratio: [number, number];
  fullWidth?: boolean;
};

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
        src: 'https://www.youtube.com/embed/mNyY1b2KgsM?autoplay=1&mute=1&loop=1&playlist=mNyY1b2KgsM&controls=0&modestbranding=1&rel=0&iv_load_policy=3&playsinline=1',
        ratio: [16, 9],
        fullWidth: true,
      },
      { id: 2, type: 'image', src: 'https://i.pinimg.com/1200x/89/23/e6/8923e65c6b4197b985c90454c48a014b.jpg', ratio: [6, 9] },
      { id: 3, type: 'image', src: 'https://i.pinimg.com/1200x/17/80/5e/17805e0666c9922a065abb96f6ea6821.jpg', ratio: [6, 4] },
      { id: 4, type: 'image', src: 'https://i.pinimg.com/1200x/47/12/75/47127540b0c668492d4dbafb9def57e0.jpg', ratio: [4, 5] },
      { id: 5, type: 'image', src: 'https://i.pinimg.com/736x/8a/02/ce/8a02ce816f7704f42f7e81afe21dca6b.jpg', ratio: [4, 5] },
      { id: 6, type: 'image', src: 'https://i.pinimg.com/736x/8c/73/c7/8c73c7914be3ecab64469b9223e71957.jpg', ratio: [16, 9] },
      { id: 7, type: 'image', src: 'https://i.pinimg.com/736x/e6/ea/05/e6ea056467028458d96897dde4ddb4e9.jpg', ratio: [16, 9] },
      { id: 8, type: 'image', src: 'https://i.pinimg.com/1200x/4b/fc/92/4bfc92f02b4f346c96608d65a3daf4f4.jpg', ratio: [1, 1] },
      { id: 9, type: 'image', src: 'https://i.pinimg.com/736x/61/bd/b0/61bdb0e6e16865f8b77f4a52ac8bb9f4.jpg', ratio: [1, 1] },
    ] as MediaItem[],
  },
];


/* -----------------------------------------------------------
   개별 미디어 — 매스너리 안에서 조용히 떠오릅니다
   ----------------------------------------------------------- */
function MediaFrame({
  item,
  index,
  onOpen,
}: {
  item: MediaItem;
  index: number;
  onOpen?: () => void;
}) {
  const media =
    item.type === 'video' ? (
      <video
        src={item.src}
        autoPlay
        loop
        muted
        playsInline
        className="h-full w-full object-cover grayscale-[55%] transition-[filter,transform] duration-[1200ms] ease-silk group-hover:scale-[1.03] group-hover:grayscale-0"
      />
    ) : (
      /* eslint-disable-next-line @next/next/no-img-element */
      <img
        src={item.src}
        alt={`Archive reference ${String(item.id).padStart(3, '0')}`}
        loading="lazy"
        className="h-full w-full object-cover grayscale-[55%] transition-[filter,transform] duration-[1200ms] ease-silk group-hover:scale-[1.03] group-hover:grayscale-0"
      />
    );

  return (
    <motion.figure
      initial={{ opacity: 0, y: 22, filter: 'blur(7px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 1.15, ease: SILK, delay: (index % 3) * 0.07 }}
      className="m-0 mb-2 break-inside-avoid md:mb-3"
    >
      <div
        onClick={onOpen}
        style={{ aspectRatio: `${item.ratio[0]} / ${item.ratio[1]}` }}
        className={`group relative w-full overflow-hidden bg-mist ${onOpen ? 'cursor-zoom-in' : ''}`}
      >
        {media}
        <figcaption className="pointer-events-none absolute bottom-1.5 left-2 font-mono text-[7.5px] uppercase tracking-[0.24em] text-white opacity-0 mix-blend-difference transition-opacity duration-500 group-hover:opacity-100 md:text-[8px]">
          Ref. {String(item.id).padStart(3, '0')}
        </figcaption>
      </div>
    </motion.figure>
  );
}

/* -----------------------------------------------------------
   라이트박스
   ----------------------------------------------------------- */
function Lightbox({
  items,
  index,
  onClose,
  onStep,
}: {
  items: MediaItem[];
  index: number;
  onClose: () => void;
  onStep: (delta: number) => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onStep(1);
      if (e.key === 'ArrowLeft') onStep(-1);
    };
    window.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose, onStep]);

  const item = items[index];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.55, ease: SILK }}
      onClick={onClose}
      className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[#0b0b0b]/97 px-5 py-14 backdrop-blur-sm"
    >
      <button
        onClick={onClose}
        aria-label="Close"
        className="absolute right-5 top-5 font-mono text-[9px] uppercase tracking-[0.3em] text-white/55 transition-colors hover:text-white md:right-8 md:top-7"
      >
        Close
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={item.id}
          initial={{ opacity: 0, scale: 0.985, filter: 'blur(7px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 1.01, filter: 'blur(7px)' }}
          transition={{ duration: 0.65, ease: SILK }}
          onClick={(e) => e.stopPropagation()}
          className="flex max-h-[76vh] max-w-[90vw] items-center justify-center md:max-w-[68vw]"
        >
          {item.type === 'youtube' ? (
            <iframe
              src={item.src}
              title={`Archive reference ${item.id}`}
              allow="autoplay; fullscreen; picture-in-picture"
              className="aspect-video h-auto w-[90vw] md:w-[68vw]"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.src}
              alt={`Archive reference ${item.id}`}
              className="max-h-[76vh] w-auto max-w-full object-contain"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div
        onClick={(e) => e.stopPropagation()}
        className="mt-7 flex items-center gap-9 font-mono text-[9px] uppercase tracking-[0.3em] text-white/55"
      >
        <button onClick={() => onStep(-1)} aria-label="Previous" className="transition-colors hover:text-white">
          ←
        </button>
        <span className="tabular-nums">
          {String(index + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}
        </span>
        <button onClick={() => onStep(1)} aria-label="Next" className="transition-colors hover:text-white">
          →
        </button>
      </div>
    </motion.div>
  );
}

/* -----------------------------------------------------------
   PAGE
   ----------------------------------------------------------- */
export default function ArchivesPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const currentData = archiveData[currentIndex];
  const hero = currentData.media.find((m) => m.fullWidth) ?? currentData.media[0];
  const stills = useMemo(() => currentData.media.filter((m) => m !== hero), [currentData, hero]);

  const openable = useMemo(() => currentData.media.filter((m) => m.type !== 'youtube'), [currentData]);

  const openLightbox = useCallback(
    (item: MediaItem) => {
      const idx = openable.findIndex((m) => m.id === item.id);
      if (idx >= 0) setLightbox(idx);
    },
    [openable]
  );

  const step = useCallback(
    (delta: number) =>
      setLightbox((prev) => (prev === null ? prev : (prev + delta + openable.length) % openable.length)),
    [openable.length]
  );

  const nextSeason = () => setCurrentIndex((prev) => (prev + 1) % archiveData.length);
  const prevSeason = () => setCurrentIndex((prev) => (prev - 1 + archiveData.length) % archiveData.length);

  return (
    <main className="min-h-screen bg-paper pb-28 text-ink md:pb-36">
      <div className="mx-auto max-w-[1280px] px-5 md:px-10">
        {/* ---------- 표제 ---------- */}
        <section className="flex flex-col items-center pt-10 text-center md:pt-16">
          <h1 className="font-grotesk text-[30px] font-bold uppercase leading-[0.9] tracking-[-0.045em] md:text-[42px]">
            <MaskUp standalone duration={1.3}>
              Archives
            </MaskUp>
          </h1>

          <RevealItem standalone delay={0.16} y={14} blur={5} className="mt-4 max-w-lg md:mt-5">
            <p className="font-mono text-[8px] uppercase leading-[2] tracking-[0.22em] text-ash md:text-[9px]">
              A curated collection of inspirations, past forms,
              <br className="hidden md:block" /> and the visual language of Vision for Visionary.
            </p>
          </RevealItem>
        </section>

        {/* ---------- 시즌 인덱스 ---------- */}
        <section className="mt-8 md:mt-12">
          <div className="flex items-center justify-between border-y border-line-soft py-3">
            <button
              onClick={prevSeason}
              aria-label="Previous season"
              className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash transition-colors duration-500 hover:text-ink md:text-[9px]"
            >
              ← Prev
            </button>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentData.season}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.6, ease: SILK }}
                className="flex flex-col items-center gap-1"
              >
                <span className="font-mono text-[9.5px] uppercase tracking-[0.34em] text-ink md:text-[10px]">
                  {currentData.season}
                </span>
                <span className="font-mono text-[7.5px] uppercase tracking-[0.2em] text-ash md:text-[8.5px]">
                  {currentData.subtitle}
                </span>
              </motion.div>
            </AnimatePresence>

            <button
              onClick={nextSeason}
              aria-label="Next season"
              className="font-mono text-[8.5px] uppercase tracking-[0.26em] text-ash transition-colors duration-500 hover:text-ink md:text-[9px]"
            >
              Next →
            </button>
          </div>
        </section>

        {/* ---------- 본문: 이미지와 글을 한 화면에 ---------- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentData.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: SILK }}
            className="mt-8 flex flex-col gap-10 md:mt-12 md:flex-row md:gap-10 lg:gap-14"
          >
            {/* 좌: 미디어 */}
            <div className="w-full md:w-[57%] lg:w-[59%]">
              <motion.div
                initial={{ opacity: 0, filter: 'blur(9px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, ease: SILK }}
                className="relative mb-2 w-full overflow-hidden bg-mist aspect-[16/9] md:mb-3"
              >
                <iframe
                  src={hero.src}
                  title={`${currentData.season} film`}
                  allow="autoplay; fullscreen; picture-in-picture"
                  className="pointer-events-none absolute inset-0 h-full w-full scale-[1.02]"
                />
              </motion.div>

              <div className="columns-2 gap-2 md:gap-3">
                {stills.map((item, i) => (
                  <MediaFrame key={item.id} item={item} index={i} onOpen={() => openLightbox(item)} />
                ))}
              </div>
            </div>

            {/* 우: 컨셉 텍스트 */}
            <aside className="w-full md:w-[43%] lg:w-[41%]">
              <div className="flex flex-col gap-5">
                <RevealItem standalone y={16} blur={5} duration={1.1}>
                  <h2 className="font-mono text-[9px] uppercase tracking-[0.26em] text-ink md:text-[9.5px]">
                    {currentData.subtitle}
                  </h2>
                  <span className="mt-3 block h-px w-7 bg-ink/35" />
                </RevealItem>

                {currentData.contentEn && (
                  <RevealItem standalone y={20} blur={6} duration={1.25} delay={0.06}>
                    <p className="whitespace-pre-wrap font-grotesk text-[12.5px] font-light leading-[1.85] tracking-[-0.005em] text-ink/80 md:text-[13px] md:leading-[1.9]">
                      {currentData.contentEn}
                    </p>
                  </RevealItem>
                )}

                {currentData.contentKo && (
                  <RevealItem standalone y={20} blur={6} duration={1.25} delay={0.1}>
                    <div className="border-t border-line-soft pt-5">
                      <p
                        className={`${nanum.className} whitespace-pre-wrap break-keep text-[12.5px] leading-[2] tracking-[-0.01em] text-ink/75 md:text-[13px]`}
                      >
                        {currentData.contentKo}
                      </p>
                    </div>
                  </RevealItem>
                )}
              </div>
            </aside>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox items={openable} index={lightbox} onClose={() => setLightbox(null)} onStep={step} />
        )}
      </AnimatePresence>
    </main>
  );
}
