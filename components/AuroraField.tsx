'use client';

import { useEffect, useRef } from 'react';
import { linkProgram, type GL } from '@/components/orb/orbGl';
import { getWorld, onWorld } from '@/components/orb/world';

/* -----------------------------------------------------------
   세계의 공기 — 풀스크린 셰이더 배경 (SKYLRK 방식)
   오로라·가장자리 물감·커서의 빛·필름 그레인을 전부 GPU 한 번의
   패스로 그립니다. DOM 레이어가 없으므로 스크롤·페인트에 전혀
   끼어들지 않고, 어떤 화면에서도 프레임이 떨어지지 않습니다.

   · 오로라: 세계별 색 계열 4붓이 도메인 워프(노이즈)로 일렁이며 감돕니다.
   · 스크롤: uScroll이 장을 따라 흘려 보내 — 화면에 '붙어' 보이지 않습니다.
   · 커서: 작은 알갱이들이 사슬처럼 앞 알갱이를 따라와 혜성 꼬리를 이룹니다.
     빨라지면 알갱이 사이가 벌어져 낱낱이 보이고, 멈추면 심 하나로 모입니다(마우스 기기만).
   · 상품 사진은 이 캔버스와 블렌드하지 않습니다(불투명) — 캔버스는 사진 '뒤'에만
     그려지므로 오로라도 커서 빛도 제품색에 닿지 못합니다. 사진에 mix-blend를
     다시 걸면 공기색이 사진 전체에 곱해집니다(광야=누렇게, 동산=민트빛).
   · 세계 전환: uWorld 하나를 지수 완화로 밀어 하늘·공기와 같은 숨(≈2.2s)으로 녹습니다.
   · 그레인: 9fps로 깜빡이는 필름 그레인이 전체를 자연스럽게 묶습니다.

   WebGL이 없으면 캔버스가 투명하게 남고, 뒤의 정적 물감(.v4v-sky)이 대신합니다.
   ----------------------------------------------------------- */

/** 배경은 부드러운 그라디언트 — 픽셀 밀도를 낮춰도 눈에 띄지 않고 GPU만 가벼워집니다. */
const MAX_DPR = 1.5;
const MAX_PIXELS = 3_300_000;

/** 커서 혜성을 이루는 알갱이 수 — 각자 앞 알갱이를 따라오는 사슬입니다. */
const TRAIL_N = 10;

const FRAG = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 uRes;
uniform float uTime;
uniform float uScroll;
uniform float uWorld;   // 0 = MIDBAR, 1 = EDEN
uniform float uCursor;  // 커서 빛의 세기 0…1
uniform vec2 uTrail[${TRAIL_N}];   // 혜성 알갱이 위치(버퍼 픽셀)
uniform float uTrailR[${TRAIL_N}]; // 알갱이 반지름(짧은 변 기준 정규화)
uniform float uTrailA[${TRAIL_N}]; // 알갱이 밝기
uniform float uGrainT;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

float vnoise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 w = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), w.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), w.x), w.y);
}

float fbm(vec2 p) {
  return vnoise(p) * 0.65 + vnoise(p * 2.13 + 7.7) * 0.35;
}

/* 세계의 팔레트 — MIDBAR(모래·호박·베이지·갈빛) ⇄ EDEN(이슬·청록·연둣빛·수풀) */
vec3 P(vec3 m, vec3 e) { return mix(m, e, uWorld); }

void main() {
  float mn = min(uRes.x, uRes.y);
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / mn;   // 가운데 0, 짧은 변 기준
  float t = uTime;

  /* 스크롤이 장을 흘려 보냅니다 — 배경이 화면에 '붙어' 있지 않고 내용과 함께 흐릅니다. */
  vec2 q = p + vec2(0.0, uScroll / mn * 0.22);

  /* 도메인 워프 — 원이 아니라 일렁이는 물감이 되게 합니다. */
  vec2 warp = vec2(fbm(q * 1.7 + t * 0.045), fbm(q * 1.6 - t * 0.038)) - 0.5;
  vec2 w = q + warp * 0.34;

  /* 종이(공기)에서 시작해 붓을 차례로 얹습니다. */
  vec3 col = P(vec3(0.965, 0.937, 0.871), vec3(0.914, 0.949, 0.902));

  vec2 c1 = vec2(-0.58, 0.30) + 0.12 * vec2(sin(t * 0.110), cos(t * 0.131));
  vec2 c2 = vec2(0.62, 0.10) + 0.14 * vec2(sin(t * 0.073 + 2.1), cos(t * 0.091 + 0.7));
  vec2 c3 = vec2(-0.22, -0.42) + 0.11 * vec2(sin(t * 0.089 + 4.2), cos(t * 0.067 + 2.9));
  vec2 c4 = vec2(0.34, -0.34) + 0.10 * vec2(sin(t * 0.127 + 1.3), cos(t * 0.103 + 5.1));

  float g1 = exp(-dot(w - c1, w - c1) / 0.34);
  float g2 = exp(-dot(w - c2, w - c2) / 0.26);
  float g3 = exp(-dot(w - c3, w - c3) / 0.30);
  float g4 = exp(-dot(w - c4, w - c4) / 0.16);

  col = mix(col, P(vec3(0.898, 0.780, 0.557), vec3(0.682, 0.867, 0.737)), g1 * 0.62);
  col = mix(col, P(vec3(0.827, 0.612, 0.345), vec3(0.443, 0.729, 0.678)), g2 * 0.5);
  col = mix(col, P(vec3(0.957, 0.902, 0.769), vec3(0.867, 0.937, 0.769)), g3 * 0.66);
  col = mix(col, P(vec3(0.737, 0.518, 0.294), vec3(0.376, 0.639, 0.529)), g4 * 0.34);

  /* 세계의 장면 한 조각 — 광야는 낮은 지평의 노을, 동산은 우상단의 빛줄기.
     pow(음수, 2.0)는 GLSL 미정의(사파리 Metal에서 NaN 밴드) — 반드시 곱으로 씁니다. */
  float hzD = (q.y + 0.46) * 2.4;
  float hz = exp(-hzD * hzD);
  float beamD = dot(p - vec2(0.55, 0.42), normalize(vec2(-0.62, -0.79)));
  float beam = exp(-beamD * beamD * 9.0) * smoothstep(-0.2, 0.5, p.x + p.y);
  col = mix(col, vec3(0.906, 0.706, 0.455), hz * 0.30 * (1.0 - uWorld));
  col = mix(col, vec3(0.945, 0.965, 0.878), beam * 0.42 * uWorld);

  /* 가장자리는 짙게, 안으로 들수록 종이로 — 화면을 감싸는 세계의 테. */
  float ev = smoothstep(0.52, 1.02, length(p * vec2(0.80, 1.12)));
  col = mix(col, P(vec3(0.725, 0.541, 0.306), vec3(0.427, 0.663, 0.545)), ev * 0.34);

  /* 커서의 빛 — 작은 알갱이들이 길을 따라 낱낱이 이어지는 혜성.
     예전의 '속도 방향 stretch'는 빠른 움직임에서 경직된 캡슐로 보여 걷어냈습니다. */
  if (uCursor > 0.003) {
    float em = 0.80 + 0.40 * fbm(p * 7.1 + t * 0.4);  // 가장자리를 물감처럼 흐트러뜨림
    float glow = 0.0;
    for (int i = 0; i < ${TRAIL_N}; i++) {
      vec2 b = (uTrail[i] - 0.5 * uRes) / mn;
      float d = length(p - b) * em;
      float r = uTrailR[i];
      glow += uTrailA[i] * exp(-(d * d) / (r * r + 1e-7));
    }
    vec3 cc = P(vec3(0.800, 0.573, 0.263), vec3(0.333, 0.651, 0.561));
    col = mix(col, cc, uCursor * min(glow, 1.0) * 0.4);
  }

  /* 필름 그레인 — 전체를 한 장의 종이로 묶습니다. */
  col += (hash(gl_FragCoord.xy + vec2(uGrainT)) - 0.5) * 0.08;

  gl_FragColor = vec4(col, 1.0);
}`;

const VERT = `
attribute vec2 aCorner;
void main() { gl_Position = vec4(aCorner, 0.0, 1.0); }`;

export default function AuroraField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const fine = window.matchMedia('(pointer: fine)').matches;

    /* 불투명 캔버스(alpha:false)는 브라우저가 뒤를 합성하지 않아 가장 쌉니다. */
    const gl = (canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: 'low-power',
    }) ?? canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false })) as GL | null;
    if (!gl) return; // 정적 물감(.v4v-sky)이 그대로 배경이 됩니다.

    let disposed = false;
    let raf = 0;
    let lost = false;
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      canvas.style.opacity = '0';
    };
    canvas.addEventListener('webglcontextlost', onLost);

    /* ---- 프레임 사이에서만 읽고 쓰는 상태 ---- */
    const s = {
      w: 0,
      h: 0,
      dpr: 1,
      world: getWorld() === 'eden' ? 1 : 0,
      worldTarget: 0,
      scroll: window.scrollY,
      // 커서(버퍼 픽셀 좌표) — tx/ty가 목표, 알갱이 사슬이 그 뒤를 따릅니다.
      tx: 0, ty: 0,
      hasPointer: false,
      cursor: 0, cursorTarget: 0,
      last: 0,
      shown: false,
    };
    s.worldTarget = s.world;

    /* 혜성 알갱이 사슬 — i번째가 i−1번째를 지수 완화로 따라옵니다. */
    const trailX = new Float32Array(TRAIL_N);
    const trailY = new Float32Array(TRAIL_N);
    const trailPos = new Float32Array(TRAIL_N * 2);
    const trailR = new Float32Array(TRAIL_N);
    const trailA = new Float32Array(TRAIL_N);

    const resize = () => {
      const cw = canvas.clientWidth || window.innerWidth;
      const ch = canvas.clientHeight || window.innerHeight;
      let dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
      if (cw * ch * dpr * dpr > MAX_PIXELS) dpr = Math.sqrt(MAX_PIXELS / (cw * ch));
      const w = Math.max(1, Math.round(cw * dpr));
      const h = Math.max(1, Math.round(ch * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      s.w = w;
      s.h = h;
      s.dpr = dpr;
    };

    const onScroll = () => {
      s.scroll = window.scrollY;
    };
    const onMove = (event: PointerEvent) => {
      s.tx = event.clientX * s.dpr;
      s.ty = s.h - event.clientY * s.dpr; // GL은 아래가 0
      if (!s.hasPointer) {
        s.hasPointer = true;
        for (let i = 0; i < TRAIL_N; i++) {
          trailX[i] = s.tx;
          trailY[i] = s.ty;
        }
      }
      s.cursorTarget = 1;
    };
    const onLeave = () => {
      s.cursorTarget = 0;
    };

    let offWorld = () => {};
    let cleanupInput = () => {};

    linkProgram(gl, VERT, FRAG, ['aCorner']).then((program) => {
      if (!program || disposed || lost) return;

      const quad = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.useProgram(program);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

      const u = {
        res: gl.getUniformLocation(program, 'uRes'),
        time: gl.getUniformLocation(program, 'uTime'),
        scroll: gl.getUniformLocation(program, 'uScroll'),
        world: gl.getUniformLocation(program, 'uWorld'),
        cursor: gl.getUniformLocation(program, 'uCursor'),
        trail: gl.getUniformLocation(program, 'uTrail[0]'),
        trailR: gl.getUniformLocation(program, 'uTrailR[0]'),
        trailA: gl.getUniformLocation(program, 'uTrailA[0]'),
        grainT: gl.getUniformLocation(program, 'uGrainT'),
      };

      resize();

      const draw = (timeSec: number) => {
        gl.viewport(0, 0, s.w, s.h);
        gl.uniform2f(u.res, s.w, s.h);
        gl.uniform1f(u.time, timeSec);
        gl.uniform1f(u.scroll, s.scroll * s.dpr);
        gl.uniform1f(u.world, s.world);
        gl.uniform1f(u.cursor, s.cursor);
        gl.uniform2fv(u.trail, trailPos);
        gl.uniform1fv(u.trailR, trailR);
        gl.uniform1fv(u.trailA, trailA);
        gl.uniform1f(u.grainT, Math.floor(timeSec * 9.0) * 17.0);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
        if (!s.shown) {
          // 첫 프레임이 준비된 뒤에야 보입니다 — 검은 백킹이 비치는 일이 없습니다.
          s.shown = true;
          canvas.style.opacity = '1';
        }
      };

      if (reduced) {
        // 움직임을 줄인 방문자: 멈춘 오로라 한 장 — 세계가 바뀔 때만 다시 그립니다.
        const still = () => {
          resize();
          s.world = getWorld() === 'eden' ? 1 : 0;
          draw(11.7);
        };
        still();
        offWorld = onWorld(still);
        window.addEventListener('resize', still);
        cleanupInput = () => window.removeEventListener('resize', still);
        return;
      }

      offWorld = onWorld((world) => {
        s.worldTarget = world === 'eden' ? 1 : 0;
      });
      window.addEventListener('resize', resize);
      window.addEventListener('scroll', onScroll, { passive: true });
      if (fine) {
        window.addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
      }
      cleanupInput = () => {
        window.removeEventListener('resize', resize);
        window.removeEventListener('scroll', onScroll);
        window.removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      };

      const frame = (now: number) => {
        if (lost) return;
        raf = requestAnimationFrame(frame);

        // 인트로의 다이브가 화면을 쓰는 동안엔 GPU를 통째로 양보합니다.
        if (document.documentElement.getAttribute('data-intro') === 'playing') {
          s.last = now;
          return;
        }

        const dt = Math.min((now - s.last) / 1000, 0.05);
        s.last = now;

        // 세계 전환 — 하늘·공기(2200ms)와 같은 숨의 지수 완화
        if (s.world !== s.worldTarget) {
          s.world += (s.worldTarget - s.world) * (1 - Math.exp(-dt / 0.55));
          if (Math.abs(s.world - s.worldTarget) < 0.002) s.world = s.worldTarget;
        }

        // 커서 — 심은 바짝(τ0.04), 알갱이들은 앞 알갱이를 사슬로(τ0.035).
        // 심이 또렷하고 꼬리가 가늘게 잦아들어, 움직이면 작은 눈물(혜성) 모양이 됩니다.
        if (s.hasPointer) {
          const kHead = 1 - Math.exp(-dt / 0.04);
          const kLink = 1 - Math.exp(-dt / 0.035);
          trailX[0] += (s.tx - trailX[0]) * kHead;
          trailY[0] += (s.ty - trailY[0]) * kHead;
          for (let i = 1; i < TRAIL_N; i++) {
            trailX[i] += (trailX[i - 1] - trailX[i]) * kLink;
            trailY[i] += (trailY[i - 1] - trailY[i]) * kLink;
          }
          const tSec = now / 1000;
          for (let i = 0; i < TRAIL_N; i++) {
            const f = i / (TRAIL_N - 1);
            trailPos[i * 2] = trailX[i];
            trailPos[i * 2 + 1] = trailY[i];
            // 심은 작고 또렷, 꼬리는 뒤로 갈수록 가늘고 옅게 — 겹쳐 쌓여도
            // 정지 시 큰 원반이 되지 않도록 밝기 합을 낮게 잡습니다.
            trailR[i] = (0.028 - 0.017 * f) * (1 + 0.12 * Math.sin(tSec * 2.6 + i * 1.9));
            trailA[i] = i === 0 ? 0.85 : Math.pow(1 - f, 1.8) * 0.42;
          }
        }
        s.cursor += (s.cursorTarget - s.cursor) * (1 - Math.exp(-dt / 0.35));

        draw(now / 1000);
      };
      s.last = performance.now();
      raf = requestAnimationFrame(frame);
    });

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      cleanupInput();
      offWorld();
      canvas.removeEventListener('webglcontextlost', onLost);
      // 캔버스가 화면에서 완전히 빠진 뒤에만 컨텍스트를 반납합니다.
      // (개발 모드는 컴포넌트를 두 번 마운트하는데, 같은 캔버스의 getContext는
      //  같은 컨텍스트를 돌려주므로 여기서 바로 잃게 하면 두 번째 마운트가 죽습니다)
      window.setTimeout(() => {
        if (!canvas.isConnected) gl.getExtension('WEBGL_lose_context')?.loseContext();
      }, 0);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      data-nosnippet
      className="v4v-aurora-field"
    />
  );
}
