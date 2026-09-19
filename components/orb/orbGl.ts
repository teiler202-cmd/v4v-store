/* -----------------------------------------------------------
   구체 로고 — WebGL 공용 렌더러
   인트로(전체 화면)·헤더(작은 로고)가 같은 규칙으로 구체를 그리고, 세로축으로 돕니다(경도가 흐름).
   (왼쪽 레일의 큰 구체는 글자 없는 그림을 화면 기준 시계 방향으로 돌리는 railGl이 따로 그립니다)
   구체 로고 이미지를 겹으로 나눠 다시 그립니다.
     1) 코어      : 360° 펼친 텍스처를 구면에 입혀 회전
        · MIDBAR — 대리석 원본, 가장자리 음영은 수식으로
        · EDEN   — 디테일 층(회전) × 조명 층(고정): 중심광·무지개는 제자리에 머뭅니다
     2) 유리 껍질 : 원본 사진의 테두리·광택을 그대로 고정
     3) V4V 글자  : MIDBAR는 잉크로 얹고, EDEN은 채널별 투과율(RGB)로 곱합니다
     4) 필름 그레인: 픽셀 단위 노이즈로 원본의 질감을 복원
   회전각이 0이면 원본 사진과 같은 그림이 나오므로,
   <img>에서 캔버스로 넘어가는 순간이 보이지 않습니다.

   초기화는 메인 스레드를 오래 붙잡지 않도록 나눠서 합니다.
   (셰이더는 병렬 컴파일, 사진은 스레드 밖에서 디코드, 텍스처는 한 프레임에 하나씩)
   ----------------------------------------------------------- */

import type { OrbSpec } from '@/components/orb/assets';

export type GL = WebGLRenderingContext | WebGL2RenderingContext;

/**
 * 원본 사진에서 합성 렌더로 넘어가는 회전각(rad).
 * 360° 텍스처는 원본에서 보이지 않던 뒷면을 합성해 채웠기 때문에, 정지 상태에서는 원본과 미세하게 다릅니다.
 */
const REST_ANGLE = 0.05;

export const PRECISION = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;

const ORB_VS = `
attribute vec2 aCorner;
uniform vec4 uRect;
varying vec2 vUv;
void main() {
  vUv = aCorner;
  vec2 p = uRect.xy + aCorner * uRect.zw;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

/** GLSL 실수 리터럴 — 정수로 떨어져도 소수점을 남깁니다. */
const f = (n: number) => {
  const s = String(n);
  return s.includes('.') || s.includes('e') ? s : `${s}.0`;
};
const vec3 = (v: readonly [number, number, number]) => `vec3(${f(v[0])}, ${f(v[1])}, ${f(v[2])})`;

/** 세계별 스펙을 상수로 구운 프래그먼트 셰이더를 만듭니다. */
function orbFragment(spec: OrbSpec) {
  return `${PRECISION}
varying vec2 vUv;
uniform sampler2D uImage;
uniform sampler2D uCore;
uniform sampler2D uText;
${spec.light ? 'uniform sampler2D uLight;' : ''}
uniform float uTheta;
uniform float uPx;
uniform float uGrain;
uniform float uRest;
uniform float uAlpha;
uniform float uInside;   // 0…1 — 구체 '안'에 들어와 있는 정도 (인트로 다이브)
uniform float uInkFade;  // 0…1 — V4V 글자가 걷히는 정도 (다이브 중 글자는 뒤로 남습니다)
uniform vec4 uRect;      // 지금 그리는 자리(캔버스 비율) — 버텍스 셰이더와 같은 값
uniform vec4 uInkRect;   // 글자가 박혀 있을 자리 — 다이브 중엔 출발 자리에 '고정'됩니다

const vec2 OUTER_C = vec2(${f(spec.outerC[0])}, ${f(spec.outerC[1])});
const float OUTER_R = ${f(spec.outerR)};
const vec2 CORE_C = vec2(${f(spec.coreC[0])}, ${f(spec.coreC[1])});
const float CORE_R = ${f(spec.coreR)};

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

void main() {
  vec2 p = vUv;
  float ro = length(p - OUTER_C) / OUTER_R;
  float disc = clamp((1.0 - ro) * OUTER_R / uPx + 0.5, 0.0, 1.0);
  if (disc <= 0.0) discard;

  vec3 shell = texture2D(uImage, p, -0.5).rgb;
  vec3 col = shell;
  float coreMix = 0.0;

  // 코어: 화면 위 점을 구면 방향으로 되돌린 뒤, 회전만큼 경도를 옮겨 읽습니다.
  vec2 q = (p - CORE_C) / CORE_R;
  q.y = -q.y;
  float rho2 = dot(q, q);
  if (rho2 < 1.0) {
    float nz = sqrt(1.0 - rho2);
    float c = cos(uTheta);
    float s = sin(uTheta);
    vec3 d = vec3(q.x * c - nz * s, q.y, q.x * s + nz * c);
    float lon = atan(d.x, d.z);
    float lat = asin(clamp(d.y, -1.0, 1.0));
    vec3 core = texture2D(uCore, vec2(lon / 6.2831853 + 0.5, 0.5 - lat / 3.1415927)).rgb * ${f(spec.detailGain)};
    float rho = sqrt(rho2);
${
  spec.light
    ? `    // 조명은 화면 좌표에 고정 — 중심광·무지개·림글로우는 돌지 않습니다.
    // 안으로 들어갈수록 조명의 어두운 가장자리가 빛으로 차올라, 내부가 온통 밝아집니다.
    core *= mix(texture2D(uLight, p).rgb, vec3(1.0), uInside * 0.62);`
    : `    // 가장자리로 갈수록 두께 때문에 짙어지는 음영은 회전과 무관하게 고정입니다.
    core *= 1.0 - ${vec3(spec.shade ?? [0, 0, 0])} * smoothstep(0.72, 1.0, rho) * (1.0 - uInside);`
}
    // 깊이 들어가면 텍스처를 수식의 빛으로 갈아 끼웁니다 — 디지털 줌과 달리
    // 해상도 개념이 없어, 화면을 가득 채워도 결이 매끈합니다. (오로라처럼 천천히 흐릅니다)
    if (uInside > 0.001) {
      float n = vnoise(q * 2.1 + vec2(uTheta * 1.4, -uTheta * 0.9));
      n += 0.6 * vnoise(q * 4.7 - vec2(uTheta * 0.8, uTheta * 1.1));
      vec3 deep = mix(${vec3(spec.interior[0])}, ${vec3(spec.interior[1])}, smoothstep(0.0, 0.5, rho));
      deep = mix(deep, ${vec3(spec.interior[2])}, smoothstep(0.4, 1.0, rho));
      deep = mix(deep, ${vec3(spec.interior[3])}, clamp(n / 1.6, 0.0, 1.0) * 0.42 * smoothstep(0.1, 0.7, rho));
      core = mix(core, deep, smoothstep(0.3, 0.85, uInside));
    }
    coreMix = 1.0 - smoothstep(0.90, 1.0, rho);
    col = mix(shell, core, coreMix);
  }

  // 글자는 uInkRect(출발 자리)의 화면 좌표에 고정해 읽습니다 — 다이브로 uRect가
  // 아무리 커져도 글자는 제자리에 남고, 커지는 것은 유리뿐입니다. 걷기(uInkFade)는 그 위에.
  vec2 ip = (uRect.xy + p * uRect.zw - uInkRect.xy) / uInkRect.zw;
  float inkBox = step(abs(ip.x - 0.5), 0.5) * step(abs(ip.y - 0.5), 0.5);
${
  spec.textTransmit
    ? `  // 글자는 채널별 투과율 — 원본 사진의 글자색(검은 V, 빛에 비친 주황빛 4)을 그대로 거릅니다.
  vec3 tr = mix(vec3(1.0), texture2D(uText, ip).rgb, inkBox * (1.0 - uInkFade));
  float ink = 1.0 - dot(tr, vec3(0.299, 0.587, 0.114));
  col *= tr;`
    : `  float ink = texture2D(uText, ip).r * inkBox * (1.0 - uInkFade);
  col = mix(col, ${vec3(spec.textInk ?? [0, 0, 0])}, ink);`
}
  // 안쪽에서는 그레인을 조금 더 — 넓고 완만한 빛의 계조가 띠(밴딩)로 굳지 않게 흩뜨립니다.
  col += (hash(gl_FragCoord.xy) - 0.5) * uGrain * (coreMix + ink * 1.6 + uInside * 0.8);

  // 안쪽 깊이 들어갈수록 노출이 은은히 올라, 베일이 걷힐 때 사이트의 공기색과 자연히 만납니다.
  col *= 1.0 + 0.1 * uInside;

  // 멈춰 있을 때는 원본 사진 그대로 — 돌기 시작하는 첫 몇 도 동안 스르륵 넘어갑니다.
  col = mix(col, shell, uRest);

  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * disc, disc) * uAlpha;
}`;
}

/** 회전각이 REST_ANGLE에 이르기까지, 원본 사진이 남아 있는 비율(1 → 0). */
export function restOf(theta: number) {
  const settle = Math.min(1, Math.abs(theta) / REST_ANGLE);
  return 1 - settle * settle * (3 - 2 * settle);
}

export const CONTEXT_ATTRIBUTES: WebGLContextAttributes = {
  alpha: true,
  premultipliedAlpha: true,
  antialias: false,
  depth: false,
  stencil: false,
  preserveDrawingBuffer: false,
};

export function nextFrame() {
  return new Promise<number>((resolve) => requestAnimationFrame(resolve));
}

/**
 * 셰이더를 컴파일·링크합니다.
 * 브라우저가 병렬 컴파일을 지원하면 끝날 때까지 프레임을 넘기며 기다려, 메인 스레드를 막지 않습니다.
 */
export async function linkProgram(gl: GL, vs: string, fs: string, attributes: readonly string[]) {
  const program = gl.createProgram();
  const v = gl.createShader(gl.VERTEX_SHADER);
  const fsh = gl.createShader(gl.FRAGMENT_SHADER);
  if (!program || !v || !fsh) return null;
  gl.shaderSource(v, vs);
  gl.shaderSource(fsh, fs);
  gl.compileShader(v);
  gl.compileShader(fsh);
  gl.attachShader(program, v);
  gl.attachShader(program, fsh);
  attributes.forEach((name, index) => gl.bindAttribLocation(program, index, name));
  gl.linkProgram(program);

  const parallel = gl.getExtension('KHR_parallel_shader_compile');
  if (parallel) {
    while (!gl.getProgramParameter(program, parallel.COMPLETION_STATUS_KHR)) {
      await nextFrame();
      if (gl.isContextLost()) return null;
    }
  }
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.warn('[orb] program', gl.getProgramInfoLog(program), gl.getShaderInfoLog(v), gl.getShaderInfoLog(fsh));
    gl.deleteProgram(program);
    return null;
  }
  gl.deleteShader(v);
  gl.deleteShader(fsh);
  return program;
}

/** 사진을 메인 스레드 밖에서 디코드합니다. (지원하지 않는 브라우저는 <img>.decode로 대신합니다) */
export async function loadBitmap(source: string | HTMLImageElement): Promise<TexImageSource> {
  if (typeof createImageBitmap === 'function') {
    try {
      if (typeof source !== 'string') {
        await source.decode();
        return await createImageBitmap(source);
      }
      const res = await fetch(source);
      if (res.ok) return await createImageBitmap(await res.blob());
    } catch {
      /* 아래 방식으로 다시 시도합니다 */
    }
  }
  const img = typeof source === 'string' ? new Image() : source;
  if (typeof source === 'string') {
    img.decoding = 'async';
    img.src = source;
  }
  await img.decode();
  return img;
}

export function uploadTexture(gl: GL, source: TexImageSource, opts: { repeatX?: boolean; mipmap?: boolean } = {}) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, opts.repeatX ? gl.REPEAT : gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  if (opts.mipmap) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
  } else {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  }
  if (typeof ImageBitmap !== 'undefined' && source instanceof ImageBitmap) source.close();
  return tex;
}

export interface OrbDrawOptions {
  /** 0…1 — 세계 전환 크로스페이드용. 기본 1. */
  alpha?: number;
  /** 이미 그린 구체 위에 더하기(크로스페이드의 두 번째 겹) */
  additive?: boolean;
  /** 원본 사진이 남는 비율을 직접 지정 — 다이브 중엔 회전각과 무관하게 밀어냅니다. */
  rest?: number;
  /** 0…1 — 구체 '안'에 들어와 있는 정도. 조명 가장자리가 빛으로 차오르고 노출이 오릅니다. */
  inside?: number;
  /** 0…1 — V4V 글자가 걷히는 정도. 다이브 때 글자가 함께 커지지 않게 합니다. */
  inkFade?: number;
  /** 글자를 고정할 자리 [x, y, w, h](캔버스 비율) — 다이브 중 출발 rect를 넣으면
      구체가 커져도 글자는 그 자리에 박혀 있습니다. 기본은 지금 그리는 rect. */
  inkRect?: readonly [number, number, number, number];
  /** 화면 기준 시계 방향 회전각(rad) — 레일(railGl)만 씁니다: 유리 테는 제자리, 안쪽만 돕니다. 기본 0. */
  roll?: number;
}

export interface OrbLayer {
  /**
   * 구체를 그립니다.
   * @param rect   캔버스 안의 자리 [x, y, w, h] — 0…1 비율, 위쪽이 0
   * @param theta  회전각(rad)
   * @param sizePx 구체 지름의 실제 픽셀 수 (가장자리 안티앨리어싱·그레인 세기)
   */
  draw(rect: readonly [number, number, number, number], theta: number, sizePx: number, opts?: OrbDrawOptions): void;
  dispose(): void;
}

/** 구체 셰이더와 텍스처들을 준비합니다. 컨텍스트가 사라지면 null. */
export async function createOrbLayer(
  gl: GL,
  spec: OrbSpec,
  sources: { image: string | HTMLImageElement; core: string; text: string; light?: string },
): Promise<OrbLayer | null> {
  const [program, image, core, text, light] = await Promise.all([
    linkProgram(gl, ORB_VS, orbFragment(spec), ['aCorner']),
    loadBitmap(sources.image),
    loadBitmap(sources.core),
    loadBitmap(sources.text),
    sources.light ? loadBitmap(sources.light) : Promise.resolve(null),
  ]);
  if (!program || gl.isContextLost()) return null;

  // 텍스처 올리기는 한 프레임에 하나씩 — 긴 작업 하나로 뭉치지 않게 합니다.
  const texImage = uploadTexture(gl, image, { mipmap: true });
  await nextFrame();
  const texCore = uploadTexture(gl, core, { repeatX: true });
  await nextFrame();
  const texText = uploadTexture(gl, text);
  let texLight: WebGLTexture | null = null;
  if (light) {
    await nextFrame();
    texLight = uploadTexture(gl, light);
  }

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

  const u = {
    rect: gl.getUniformLocation(program, 'uRect'),
    theta: gl.getUniformLocation(program, 'uTheta'),
    px: gl.getUniformLocation(program, 'uPx'),
    grain: gl.getUniformLocation(program, 'uGrain'),
    rest: gl.getUniformLocation(program, 'uRest'),
    alpha: gl.getUniformLocation(program, 'uAlpha'),
    inside: gl.getUniformLocation(program, 'uInside'),
    inkFade: gl.getUniformLocation(program, 'uInkFade'),
    inkRect: gl.getUniformLocation(program, 'uInkRect'),
  };
  gl.useProgram(program);
  gl.uniform1i(gl.getUniformLocation(program, 'uImage'), 0);
  gl.uniform1i(gl.getUniformLocation(program, 'uCore'), 1);
  gl.uniform1i(gl.getUniformLocation(program, 'uText'), 2);
  if (texLight) gl.uniform1i(gl.getUniformLocation(program, 'uLight'), 3);

  return {
    draw(rect, theta, sizePx, opts = {}) {
      const alpha = opts.alpha ?? 1;
      gl.useProgram(program);
      if (opts.additive) {
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);
      } else {
        gl.disable(gl.BLEND);
      }
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      // 같은 컨텍스트에서 다른 프로그램(모래알)이 켜 둔 속성은 끕니다.
      for (let i = 1; i < 4; i++) gl.disableVertexAttribArray(i);

      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texImage);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, texCore);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, texText);
      if (texLight) {
        gl.activeTexture(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, texLight);
      }

      const size = Math.max(sizePx, 1);
      gl.uniform4f(u.rect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.theta, theta);
      gl.uniform1f(u.px, 1 / size);
      // 원본 그레인은 1024px 기준 — 작게 그릴수록 옅게 줄입니다.
      gl.uniform1f(u.grain, (15 / 255) * Math.min(1, Math.max(0.45, size / 1024)));
      gl.uniform1f(u.rest, opts.rest ?? restOf(theta));
      gl.uniform1f(u.alpha, alpha);
      gl.uniform1f(u.inside, opts.inside ?? 0);
      gl.uniform1f(u.inkFade, opts.inkFade ?? 0);
      const ir = opts.inkRect ?? rect;
      gl.uniform4f(u.inkRect, ir[0], ir[1], ir[2], ir[3]);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (opts.additive) gl.disable(gl.BLEND);
    },
    dispose() {
      if (gl.isContextLost()) return;
      gl.deleteBuffer(quad);
      gl.deleteTexture(texImage);
      gl.deleteTexture(texCore);
      gl.deleteTexture(texText);
      if (texLight) gl.deleteTexture(texLight);
      gl.deleteProgram(program);
    },
  };
}
