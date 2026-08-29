'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const LOGO_SRC = '/v4v-logo-stacked.png';
const SLOGAN = ['VISION', 'IN', 'MOTION,', 'PERFORMANCE', 'IN', 'ACTION'];

const SILK = [0.16, 1, 0.3, 1] as const;

/** 모래알이 흩어지는 총 시간(초) */
const SAND_DURATION = 2.05;
/** 슬로건을 머금고 있는 시간(ms) */
const SLOGAN_HOLD = 3400;

type Phase = 'logo' | 'sand' | 'slogan' | 'out';

/* -----------------------------------------------------------
   모래 붕괴 캔버스
   로고의 픽셀을 그대로 읽어 수만 개의 모래알로 쪼갠 뒤,
   아래쪽 알갱이부터 순서대로 중력에 실어 흘려보냅니다.
   ----------------------------------------------------------- */
function SandDissolve({
  image,
  rect,
  onDone,
}: {
  image: HTMLImageElement;
  rect: { width: number; height: number };
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = Math.max(1, Math.round(rect.width * dpr));
    const H = Math.max(1, Math.round(rect.height * dpr));

    canvas.width = W;
    canvas.height = H;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    ctx.drawImage(image, 0, 0, W, H);

    let source: ImageData;
    try {
      source = ctx.getImageData(0, 0, W, H);
    } catch {
      onDone();
      return;
    }

    const src32 = new Uint32Array(source.data.buffer);

    // 알갱이 크기: 화면이 클수록 조금 더 촘촘하게 샘플링합니다.
    const TARGET = 26000;
    const grain = Math.max(2, Math.round(Math.sqrt((W * H * 0.3) / TARGET)));

    // 1차 스캔 — 실제로 칠해진 픽셀 수를 셉니다.
    let count = 0;
    for (let y = 0; y < H; y += grain) {
      const row = y * W;
      for (let x = 0; x < W; x += grain) {
        if (src32[row + x] >>> 24 > 24) count++;
      }
    }
    if (count === 0) {
      onDone();
      return;
    }

    const px = new Float32Array(count);
    const py = new Float32Array(count);
    const pvx = new Float32Array(count);
    const pvy = new Float32Array(count);
    const pg = new Float32Array(count);
    const pt0 = new Float32Array(count);
    const pseed = new Float32Array(count);
    const pcol = new Uint32Array(count);

    let i = 0;
    for (let y = 0; y < H; y += grain) {
      const row = y * W;
      const ny = H > 1 ? y / H : 0; // 0 = 위, 1 = 아래
      for (let x = 0; x < W; x += grain) {
        const v = src32[row + x];
        if (v >>> 24 <= 24) continue;
        if (i >= count) break;
        px[i] = x;
        py[i] = y;
        pcol[i] = v;
        // 아래쪽 모래부터 먼저 무너져 내리도록 지연을 겁니다.
        pt0[i] = (1 - ny) * 0.5 + Math.random() * 0.34;
        pvx[i] = (Math.random() - 0.5) * 22 * dpr;
        pvy[i] = Math.random() * 14 * dpr;
        pg[i] = (640 + Math.random() * 620) * dpr;
        pseed[i] = Math.random() * Math.PI * 2;
        i++;
      }
    }
    const n = i;

    const out = ctx.createImageData(W, H);
    const buf = new Uint32Array(out.data.buffer);

    let raf = 0;
    let start = 0;

    const frame = (now: number) => {
      if (!start) start = now;
      const t = (now - start) / 1000;

      buf.fill(0);

      for (let k = 0; k < n; k++) {
        const t0 = pt0[k];
        const local = t - t0;

        let x: number;
        let y: number;
        let alpha = 1;

        if (local <= 0) {
          x = px[k];
          y = py[k];
        } else {
          // 살짝 부는 바람 + 알갱이마다 다른 흔들림
          const sway = Math.sin(local * 3.1 + pseed[k]) * 9 * dpr;
          x = px[k] + pvx[k] * local + sway * local + 6 * dpr * local;
          y = py[k] + pvy[k] * local + 0.5 * pg[k] * local * local;
          alpha = 1 - Math.max(0, (local - 0.34) / 0.92);
          if (alpha <= 0.01) continue;
        }

        if (y >= H + grain) continue;

        const ix = x | 0;
        const iy = y | 0;
        const base = pcol[k] & 0x00ffffff;
        const a = (((pcol[k] >>> 24) * alpha) | 0) << 24;
        const packed = (base | a) >>> 0;

        for (let dy = 0; dy < grain; dy++) {
          const yy = iy + dy;
          if (yy < 0 || yy >= H) continue;
          const row = yy * W;
          for (let dx = 0; dx < grain; dx++) {
            const xx = ix + dx;
            if (xx < 0 || xx >= W) continue;
            buf[row + xx] = packed;
          }
        }
      }

      ctx.putImageData(out, 0, 0);

      if (t < SAND_DURATION) {
        raf = requestAnimationFrame(frame);
      } else {
        onDone();
      }
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [image, rect.width, rect.height, onDone]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden
    />
  );
}

/* -----------------------------------------------------------
   INTRO
   ----------------------------------------------------------- */
const NO_OP = () => () => {};

/** 부트스트랩 스크립트가 남긴 표식을 읽습니다 — 이미 본 세션인지 여부. */
function readIntroSeen() {
  return document.documentElement.getAttribute('data-intro') === 'done';
}

export default function Intro() {
  const [phase, setPhase] = useState<Phase>('logo');
  const [finished, setFinished] = useState(false);
  const [sand, setSand] = useState<{ image: HTMLImageElement; rect: { width: number; height: number } } | null>(null);

  const logoRef = useRef<HTMLImageElement>(null);
  const preloaded = useRef<HTMLImageElement | null>(null);

  // 이미 본 세션이라면 렌더 자체를 건너뜁니다.
  // (CSS가 첫 페인트부터 가려두기 때문에 깜빡임 없이 이어집니다)
  const alreadySeen = useSyncExternalStore(NO_OP, readIntroSeen, () => false);

  // 클릭 즉시 모래가 되도록 원본 픽셀을 미리 받아둡니다.
  useEffect(() => {
    const img = new window.Image();
    img.decoding = 'async';
    img.src = LOGO_SRC;
    preloaded.current = img;
  }, []);

  const finish = useCallback(() => {
    setPhase('out');
    // 오버레이가 사라지는 동안 헤더·푸터가 서서히 떠오릅니다.
    document.documentElement.setAttribute('data-intro', 'revealing');
    try {
      window.sessionStorage.setItem('v4v:intro', '1');
    } catch {
      /* 프라이빗 모드 등 — 무시 */
    }
    window.setTimeout(() => {
      document.documentElement.setAttribute('data-intro', 'done');
      setFinished(true);
    }, 1200);
  }, []);

  const handleSandDone = useCallback(() => setPhase('slogan'), []);

  const startSand = useCallback(() => {
    if (phase !== 'logo') return;

    const el = logoRef.current;
    const img = preloaded.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!el || !img || !img.complete || reduced) {
      setPhase('slogan');
      return;
    }

    const r = el.getBoundingClientRect();
    setSand({ image: img, rect: { width: r.width, height: r.height } });
    setPhase('sand');
  }, [phase]);

  // 슬로건이 다 읽히면 자연스럽게 사이트로 이어집니다.
  useEffect(() => {
    if (phase !== 'slogan') return;
    const revealTime = 340 + SLOGAN.length * 130 + 900;
    const timer = window.setTimeout(finish, revealTime + SLOGAN_HOLD);
    return () => window.clearTimeout(timer);
  }, [phase, finish]);

  if (alreadySeen || finished) return null;

  return (
    <div className="v4v-intro">
      <AnimatePresence>
        {phase !== 'out' && (
          <motion.div
            key="veil"
            className="fixed inset-0 z-[70] flex items-center justify-center bg-paper px-6"
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            transition={{ duration: 1.1, ease: SILK }}
          >
            {/* ---------- 1. 브랜드 워드마크 ---------- */}
            {(phase === 'logo' || phase === 'sand') && (
              <div
                role="button"
                tabIndex={0}
                aria-label="Enter VISION FOR VISIONARY"
                onClick={startSand}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    startSand();
                  }
                }}
                className="flex w-full cursor-pointer flex-col items-center justify-center outline-none"
              >
                <motion.div
                  className="relative"
                  initial={{ opacity: 0, filter: 'blur(14px)', scale: 1.015 }}
                  animate={{ opacity: 1, filter: 'blur(0px)', scale: 1 }}
                  transition={{ duration: 1.8, ease: SILK }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={logoRef}
                    src={LOGO_SRC}
                    alt="VISION FOR VISIONARY"
                    fetchPriority="high"
                    draggable={false}
                    className={`h-auto w-[86vw] max-w-[760px] select-none object-contain transition-opacity duration-100 ${
                      phase === 'sand' ? 'opacity-0' : 'opacity-100'
                    }`}
                  />
                  {phase === 'sand' && sand && (
                    <SandDissolve
                      image={sand.image}
                      rect={sand.rect}
                      onDone={handleSandDone}
                    />
                  )}
                </motion.div>

                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: phase === 'sand' ? 0 : 0.34 }}
                  transition={{ duration: phase === 'sand' ? 0.4 : 1.4, delay: phase === 'sand' ? 0 : 2.4, ease: SILK }}
                  className="mt-12 font-mono text-[8px] uppercase tracking-[0.5em] text-ink md:mt-16 md:text-[9px]"
                >
                  
                </motion.span>
              </div>
            )}

            {/* ---------- 2. 브랜드 슬로건 ---------- */}
            {phase === 'slogan' && (
              <div
                onClick={finish}
                className="flex w-full cursor-pointer flex-col items-center justify-center"
              >
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { delayChildren: 0.34, staggerChildren: 0.13 } } }}
                  className="flex max-w-[1150px] flex-wrap items-baseline justify-center gap-x-[0.42em] gap-y-[0.16em]"
                >
                  {SLOGAN.map((word, index) => (
                    <span key={`${word}-${index}`} className="overflow-hidden py-[0.1em]">
                      <motion.span
                        variants={{
                          hidden: { y: '108%', opacity: 0, filter: 'blur(7px)' },
                          visible: { y: '0%', opacity: 1, filter: 'blur(0px)' },
                        }}
                        transition={{ duration: 1.25, ease: SILK }}
                        className="inline-block font-sans text-[12px] font-medium uppercase leading-[1.05] tracking-[-0.03em] text-ink min-[420px]:text-[15px] sm:text-[22px] md:text-[36px] lg:text-[42px]"
                      >
                        {word}
                      </motion.span>
                    </span>
                  ))}
                </motion.div>

                <motion.span
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 2.6, delay: 1.1, ease: SILK }}
                  className="mt-10 block h-px w-[42vw] max-w-[320px] origin-center bg-ink/20 md:mt-14"
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
