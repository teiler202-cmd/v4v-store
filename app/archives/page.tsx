'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from 'framer-motion';
import { nanum } from '@/lib/fonts';
import { MaskUp, RevealItem, SILK } from '@/components/Reveal';

type MediaItem = {
  id: number;
  type: 'image' | 'video' | 'youtube';
  /** image·video는 파일 주소, youtube는 '영상 ID'만 넣습니다 */
  src: string;
  /** 원본 비율 [가로, 세로] — 레이아웃이 이 값을 보고 폭을 정합니다 */
  ratio: [number, number];
  /** 영상의 첫 화면 이미지 (로딩 중에 보여줍니다) */
  poster?: string;
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
      // 🎞️ 시즌 필름 — 자체 호스팅(유튜브를 거치지 않습니다).
      //   원본 ProRes 2.2GB → 1280x720 / 30fps / H.264 / 음성 없음 (약 16MB)로 변환해 두었습니다.
      //   교체할 땐 public/archives/ 에 새 mp4를 넣고 아래 경로만 바꾸면 됩니다.
      {
        id: 1,
        type: 'video',
        src: '/archives/szn1.mp4',
        poster: '/archives/szn1-poster.jpg',
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
   갤러리 배치
   각 컷의 실제 비율을 읽어 폭을 정하고(세로 컷은 좁게, 가로 컷은 넓게),
   행마다 정렬과 수직 오프셋을 달리해 시선이 지그재그로 흐르게 합니다.
   ----------------------------------------------------------- */
type Placed = { item: MediaItem; width: number; shift: number };

function widthFor(item: MediaItem) {
  const r = item.ratio[0] / item.ratio[1];
  if (r < 0.8) return 36; // 세로로 긴 컷
  if (r < 1.15) return 40; // 정사각
  if (r < 1.6) return 48; // 완만한 가로
  return 56; // 와이드 컷
}

const ALIGN = ['md:justify-start', 'md:justify-end', 'md:justify-center', 'md:justify-end'];
const GAP = 6; // 열 사이 간격(%)

function buildRows(items: MediaItem[]) {
  const rows: Placed[][] = [];
  let row: Placed[] = [];
  let used = 0;

  items.forEach((item) => {
    const width = widthFor(item);
    const next = row.length === 0 ? width : used + GAP + width;
    if (row.length > 0 && next > 100) {
      rows.push(row);
      row = [];
      used = 0;
    }
    row.push({ item, width, shift: 0 });
    used = row.length === 1 ? width : used + GAP + width;
  });
  if (row.length) rows.push(row);

  // 행 안에서 한쪽 컷을 아래로 밀어 반듯한 정렬을 깨뜨립니다.
  rows.forEach((r, i) => {
    if (r.length > 1) r[i % 2 === 0 ? 1 : 0].shift = 7 + (i % 3) * 3;
  });

  return rows;
}

/* -----------------------------------------------------------
   개별 미디어
   스크롤에 따라 미세하게 표류하고, 커서를 따라다니는 표식이 붙습니다.
   ----------------------------------------------------------- */
function MediaFrame({
  item,
  index,
  drift,
  onOpen,
}: {
  item: MediaItem;
  index: number;
  drift: number;
  onOpen: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [cursor, setCursor] = useState<{ x: number; y: number } | null>(null);

  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] });
  const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const b = e.currentTarget.getBoundingClientRect();
    setCursor({ x: e.clientX - b.left, y: e.clientY - b.top });
  };

  return (
    <motion.figure
      ref={ref}
      initial={{ opacity: 0, y: 30, filter: 'blur(8px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.12 }}
      transition={{ duration: 1.25, ease: SILK, delay: (index % 2) * 0.1 }}
      className="m-0 w-full"
    >
      <motion.div style={reduced ? undefined : { y }}>
        <div
          onClick={onOpen}
          onMouseMove={handleMove}
          onMouseLeave={() => setCursor(null)}
          style={{ aspectRatio: `${item.ratio[0]} / ${item.ratio[1]}` }}
          className="group relative w-full cursor-zoom-in overflow-hidden bg-mist"
        >
          {item.type === 'video' ? (
            <video
              src={item.src}
              autoPlay
              loop
              muted
              playsInline
              className="h-full w-full object-cover grayscale-[55%] transition-[filter,transform] duration-[1200ms] ease-silk group-hover:scale-[1.04] group-hover:grayscale-0"
            />
          ) : (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={item.src}
              alt={`Archive reference ${String(item.id).padStart(3, '0')}`}
              loading="lazy"
              className="h-full w-full object-cover grayscale-[55%] transition-[filter,transform] duration-[1200ms] ease-silk group-hover:scale-[1.04] group-hover:grayscale-0"
            />
          )}

          {/* 커서를 따라다니는 표식 */}
          <div
            aria-hidden
            style={{
              transform: `translate3d(${(cursor?.x ?? 0) + 14}px, ${(cursor?.y ?? 0) - 8}px, 0)`,
              opacity: cursor ? 1 : 0,
            }}
            className="pointer-events-none absolute left-0 top-0 whitespace-nowrap font-mono text-[8px] uppercase tracking-[0.24em] text-white mix-blend-difference transition-opacity duration-300"
          >
            Ref. {String(item.id).padStart(3, '0')} — View
          </div>
        </div>
      </motion.div>
    </motion.figure>
  );
}

/* -----------------------------------------------------------
   히어로 필름 — 자체 호스팅 영상
   유튜브를 거치지 않으므로 제목·추천 영상·로고가 아예 존재하지 않습니다.
   음소거·자동재생·무한반복이며, 브라우저가 자동재생을 막을 때만
   조용한 재생 버튼을 내밉니다.
   ----------------------------------------------------------- */
function HeroFilm({ item, title }: { item: MediaItem; title: string }) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  /** 영상 파일을 실제로 붙이기 전까지는 포스터만 보여줍니다 */
  const [armed, setArmed] = useState(false);
  /** 실제로 재생 중인지 — 아닐 때는 항상 재생 버튼을 내밉니다 */
  const [playing, setPlaying] = useState(false);

  /**
   * 이 필름은 16MB짜리입니다.
   * 예전에는 페이지에 들어오기만 해도 무조건 전부 받았습니다 —
   * 스크롤을 내리지 않아 화면에 보이지도 않는데 말이죠.
   * (autoPlay가 붙어 있으면 브라우저가 preload 힌트를 무시합니다)
   *
   * 이제는 히어로가 실제로 화면에 들어왔을 때에만 받아옵니다.
   * 단, 데이터 절약 모드나 아주 느린 회선에서는 포스터에 재생 버튼만 얹어 두고
   * 손님이 직접 고르게 합니다.
   */
  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap) return;

    const connection = (navigator as any).connection;
    if (connection?.saveData === true || /^(slow-)?2g$/.test(connection?.effectiveType ?? '')) {
      return; // 재생 버튼은 아래에서 항상 그려지므로 볼 방법이 사라지지 않습니다
    }

    // 옵저버를 못 쓰는 환경에서는 그냥 바로 준비합니다.
    if (typeof IntersectionObserver === 'undefined') {
      setArmed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setArmed(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' } // 화면에 닿기 조금 전에 미리 준비합니다
    );
    observer.observe(wrap);
    return () => observer.disconnect();
  }, []);

  // 영상 소스가 붙은 뒤에야 재생을 시도합니다.
  useEffect(() => {
    if (!armed) return;
    const video = videoRef.current;
    if (!video) return;

    video.muted = true; // 음소거여야 자동재생이 허용됩니다
    const attempt = () => void video.play().catch(() => {});
    attempt();

    // 탭을 다시 보게 되면 이어서 재생합니다.
    const onVisible = () => {
      if (document.visibilityState === 'visible') attempt();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [armed]);

  const play = () => {
    // 아직 소스를 안 붙였다면 이 클릭이 곧 다운로드 시작 신호입니다.
    // (붙는 즉시 위의 effect가 재생까지 이어서 합니다)
    if (!armed) {
      setArmed(true);
      return;
    }
    void videoRef.current?.play().catch(() => {});
  };

  return (
    <div
      ref={wrapRef}
      className="relative w-full overflow-hidden bg-mist bg-cover bg-center aspect-[16/9]"
      style={item.poster ? { backgroundImage: `url(${item.poster})` } : undefined}
    >
      <video
        ref={videoRef}
        // armed 전에는 src가 없으므로 브라우저가 아무것도 받지 않습니다.
        src={armed ? item.src : undefined}
        poster={item.poster}
        aria-label={title}
        loop
        muted
        playsInline
        preload="none"
        onPlaying={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={(e) => {
          // loop 속성이 있지만, 혹시 모를 경우를 위한 안전장치
          const v = e.currentTarget;
          v.currentTime = 0;
          void v.play();
        }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* 재생 중이 아니면 항상 버튼이 있습니다 —
          자동재생이 막혔든, 데이터 절약 모드든, 옵저버가 안 떴든
          손님이 영상을 볼 방법이 사라지지 않습니다. */}
      {!playing && (
        <button
          onClick={play}
          aria-label="Play film"
          className="absolute inset-0 flex items-center justify-center gap-3 bg-mist/60 font-mono text-[9px] uppercase tracking-[0.28em] text-ink/70 backdrop-blur-[2px] transition-colors duration-500 hover:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-3 w-3" fill="currentColor" aria-hidden>
            <path d="M6 4 L20 12 L6 20 Z" />
          </svg>
          Play
        </button>
      )}
    </div>
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
          {item.type === 'video' ? (
            <video
              src={item.src}
              autoPlay
              loop
              muted
              playsInline
              className="max-h-[76vh] w-auto max-w-full object-contain"
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
  const rows = useMemo(() => buildRows(stills), [stills]);

  const openLightbox = useCallback(
    (item: MediaItem) => {
      const idx = stills.findIndex((m) => m.id === item.id);
      if (idx >= 0) setLightbox(idx);
    },
    [stills]
  );

  const step = useCallback(
    (delta: number) =>
      setLightbox((prev) => (prev === null ? prev : (prev + delta + stills.length) % stills.length)),
    [stills.length]
  );

  const nextSeason = () => setCurrentIndex((prev) => (prev + 1) % archiveData.length);
  const prevSeason = () => setCurrentIndex((prev) => (prev - 1 + archiveData.length) % archiveData.length);

  return (
    <main className="min-h-screen bg-paper pb-28 text-ink md:pb-36">
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
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

        {/* ---------- 본문: 좌 갤러리 7 / 우 글 3 ---------- */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentData.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: SILK }}
            className="mt-8 flex flex-col gap-12 md:mt-14 md:flex-row md:gap-0"
          >
            {/* 좌: 갤러리 (7) */}
            <div className="w-full md:w-[70%] md:pr-[5%]">
              <motion.div
                initial={{ opacity: 0, filter: 'blur(9px)' }}
                animate={{ opacity: 1, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, ease: SILK }}
              >
                <HeroFilm item={hero} title={`${currentData.season} film`} />
              </motion.div>

              <div className="mt-8 flex flex-col gap-8 md:mt-14 md:gap-[7vh]">
                {rows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className={`flex flex-row flex-wrap items-start justify-between gap-y-8 md:flex-nowrap md:gap-[6%] ${
                      ALIGN[rowIndex % ALIGN.length]
                    }`}
                  >
                    {row.map(({ item, width, shift }, i) => (
                      <div
                        key={item.id}
                        /* 모바일에선 짝지어진 행만 2단으로, 단독 컷은 화면을 꽉 채웁니다 */
                        className="w-[var(--wm)] md:mt-[var(--shift)] md:w-[var(--w)]"
                        style={
                          {
                            '--w': `${width}%`,
                            '--wm': row.length > 1 ? 'calc(50% - 6px)' : '100%',
                            '--shift': `${shift}vh`,
                          } as React.CSSProperties
                        }
                      >
                        <MediaFrame
                          item={item}
                          index={i}
                          drift={rowIndex % 2 === 0 ? 26 : 16}
                          onOpen={() => openLightbox(item)}
                        />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 우: 글 (3) */}
            <aside className="w-full md:w-[30%] md:border-l md:border-line-soft md:pl-[5%]">
              <div className="flex flex-col gap-5">
                <RevealItem standalone y={14} blur={5} duration={1.1}>
                  <h2 className="font-mono text-[8.5px] uppercase leading-[1.9] tracking-[0.24em] text-ink md:text-[9px]">
                    {currentData.subtitle}
                  </h2>
                  <span className="mt-3 block h-px w-6 bg-ink/35" />
                </RevealItem>

                <div>
                  {currentData.contentEn && (
                    <p className="whitespace-pre-wrap font-grotesk text-[12px] font-light leading-[1.9] tracking-[-0.005em] text-ink/80 md:text-[12.5px]">
                      {currentData.contentEn}
                    </p>
                  )}

                  {currentData.contentKo && (
                    <div className="mt-6 border-t border-line-soft pt-6">
                      <p
                        className={`${nanum.className} whitespace-pre-wrap break-keep text-[12px] leading-[2.05] tracking-[-0.01em] text-ink/75 md:text-[12.5px]`}
                      >
                        {currentData.contentKo}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </aside>
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {lightbox !== null && (
          <Lightbox items={stills} index={lightbox} onClose={() => setLightbox(null)} onStep={step} />
        )}
      </AnimatePresence>
    </main>
  );
}
