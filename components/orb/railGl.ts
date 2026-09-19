/* -----------------------------------------------------------
   레일의 큰 구체 — WebGL 겹
   글자 없는 구 한 장(assets RAIL_ORB)을 화면 기준 시계 방향으로 돌립니다.
     · 안쪽(코어): 그림을 시선축으로 돌려 읽습니다 — 대리석·빛줄기가 천천히 돕니다.
     · 유리 테(바깥 12%): 화면에 고정 — 광택과 조명은 돌지 않아 진짜 구처럼 보입니다.
   가장자리의 세계 톤은 그림에 구워져 있고(assets RAIL_ORB), 구 바깥의 짙은 공기는 CSS가 그립니다
   (.v4v-rail-halo) — 그래서 정지 사진과 이 겹이 같은 모습이고, 넘겨받는 순간이 튀지 않습니다.
   회전각 0이면 원본 그림과 같은 모습입니다.
   ----------------------------------------------------------- */

import type { RailOrbSpec } from '@/components/orb/assets';
import { linkProgram, loadBitmap, nextFrame, uploadTexture, type GL, type OrbLayer } from '@/components/orb/orbGl';

/** 구의 모양 — 세계 공통 */
export interface RailLook {
  /** 도는 안쪽의 반지름(구 반지름 비율) — 이 밖의 유리 테는 제자리 */
  coreR: number;
  /** 필름 그레인 세기(0…1 색 단위) */
  grain: number;
}

export const RAIL_LOOK: RailLook = {
  coreR: 0.88,
  grain: 0.035,
};

const VS = `
attribute vec2 aCorner;
uniform vec4 uRect;
varying vec2 vUv;
void main() {
  vUv = aCorner;
  vec2 p = uRect.xy + vUv * uRect.zw;
  gl_Position = vec4(p.x * 2.0 - 1.0, 1.0 - p.y * 2.0, 0.0, 1.0);
}`;

const FS = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 vUv;
uniform sampler2D uImage;
uniform float uR;          // 그림 속 구 반지름
uniform vec2 uRoll;        // (cos, sin) — 화면 기준 시계 방향
uniform float uPx;         // 그림 한 변에 대한 한 픽셀 (1 / 한 변의 픽셀 수)
uniform float uAlpha;
uniform float uCoreR;
uniform float uGrain;

float hash(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

void main() {
  vec2 d = vUv - 0.5;
  float r = length(d) / uR;                 // 1 = 구의 가장자리
  float px = uPx / uR;                      // 한 픽셀을 r 단위로
  float disc = clamp((1.0 - r) / px + 0.5, 0.0, 1.0);

  // 그림은 구 안쪽 3px까지만 읽습니다 — 반투명한 원 테두리 텍셀(브라우저가 알파를 미리 곱해
  // 어둡게 올리기도 함)이 섞여 가장자리에 어두운 실선이 생기지 않게. 원 밖은 그 둘레 색을 늘여 씁니다.
  // (텍스처 읽기는 분기 밖에서 — 밉맵의 미분이 픽셀 묶음마다 어긋나지 않게)
  vec2 ds = d * min(1.0, (1.0 - 3.0 * px) / max(r, 1e-4));
  // 유리 테는 제자리, 안쪽은 거꾸로 돌린 자리를 읽어 시계 방향으로 돕니다.
  vec3 shell = texture2D(uImage, 0.5 + ds).rgb;
  vec2 rd = vec2(ds.x * uRoll.x + ds.y * uRoll.y, ds.y * uRoll.x - ds.x * uRoll.y);
  vec3 core = texture2D(uImage, 0.5 + rd).rgb;
  vec3 col = mix(shell, core, 1.0 - smoothstep(uCoreR - 0.1, uCoreR, r));
  col += (hash(gl_FragCoord.xy) - 0.5) * uGrain;

  // 미리 곱한 알파 — 원 밖은 투명(밑의 CSS 공기가 비칩니다)
  gl_FragColor = vec4(clamp(col, 0.0, 1.0) * disc, disc) * uAlpha;
}`;

/** 개발 중 모양을 즉석에서 맞춰 볼 수 있는 손잡이 — window.__v4vRailTune (프로덕션 빌드에선 사라집니다) */
type Tune = Partial<RailLook> & { roll?: number };

/** 레일 구체의 겹을 준비합니다. 컨텍스트가 사라지면 null. */
export async function createRailLayer(
  gl: GL,
  spec: RailOrbSpec,
  image: string | HTMLImageElement,
): Promise<OrbLayer | null> {
  const [program, bitmap] = await Promise.all([linkProgram(gl, VS, FS, ['aCorner']), loadBitmap(image)]);
  if (!program || gl.isContextLost()) return null;

  // 화면의 구(≈1300px)보다 큰 그림을 줄여 그리므로 밉맵으로 — 트레이스 결이 자글거리지 않습니다.
  const tex = uploadTexture(gl, bitmap, { mipmap: true });
  await nextFrame();

  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, 0, 1, 0, 0, 1, 1, 1]), gl.STATIC_DRAW);

  const loc = (name: string) => gl.getUniformLocation(program, name);
  const u = {
    rect: loc('uRect'),
    r: loc('uR'),
    roll: loc('uRoll'),
    px: loc('uPx'),
    alpha: loc('uAlpha'),
    coreR: loc('uCoreR'),
    grain: loc('uGrain'),
  };
  gl.useProgram(program);
  gl.uniform1i(loc('uImage'), 0);

  return {
    draw(rect, _theta, sizePx, opts = {}) {
      let look = RAIL_LOOK;
      let roll = opts.roll ?? 0;
      if (process.env.NODE_ENV !== 'production') {
        const tune = (window as unknown as { __v4vRailTune?: Tune }).__v4vRailTune;
        if (tune) {
          look = { ...RAIL_LOOK, ...tune };
          if (typeof tune.roll === 'number') roll = tune.roll;
        }
      }

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
      for (let i = 1; i < 4; i++) gl.disableVertexAttribArray(i);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, tex);

      gl.uniform4f(u.rect, rect[0], rect[1], rect[2], rect[3]);
      gl.uniform1f(u.r, spec.r);
      gl.uniform2f(u.roll, Math.cos(roll), Math.sin(roll));
      gl.uniform1f(u.px, 1 / Math.max(sizePx, 1));
      gl.uniform1f(u.alpha, opts.alpha ?? 1);
      gl.uniform1f(u.coreR, look.coreR);
      gl.uniform1f(u.grain, look.grain);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (opts.additive) gl.disable(gl.BLEND);
    },
    dispose() {
      if (gl.isContextLost()) return;
      gl.deleteBuffer(quad);
      gl.deleteTexture(tex);
      gl.deleteProgram(program);
    },
  };
}
