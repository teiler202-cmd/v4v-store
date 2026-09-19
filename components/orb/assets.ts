/* -----------------------------------------------------------
   구체 로고 에셋 — 두 세계(MIDBAR·EDEN)의 매니페스트
   각 세계의 구체는 원본 로고(1024px)에서 오프라인으로 합성한 레이어들입니다.
   파일 이름의 해시는 내용이 바뀌면 함께 바뀌므로 1년 캐시해도 안전합니다(next.config.ts).

   MIDBAR — 대리석 구체. 가장자리 음영은 수식으로 재현되므로 조명 레이어가 없습니다.
   EDEN  — 발광 구체. 중심광·무지개·림글로우가 복잡해 조명(고정) × 디테일(회전)로 분해했습니다.
   ----------------------------------------------------------- */

export type WorldId = 'midbar' | 'eden';
export const WORLDS: readonly WorldId[] = ['midbar', 'eden'] as const;

export interface OrbSpec {
  /** 원본 정사각형 기준(0…1)의 기하 — 바깥 유리 원과 안쪽 대리석 원 */
  outerC: readonly [number, number];
  outerR: number;
  coreC: readonly [number, number];
  coreR: number;
  /** 회전 텍스처의 값 배율 (디테일 레이어는 128 근방을 1.0으로 저장) */
  detailGain: number;
  /** 가장자리 음영 계수 — 조명 레이어가 없는 세계만 사용 */
  shade?: readonly [number, number, number];
  /** 글자를 단색 잉크로 얹는 세계 (MIDBAR) — text 텍스처의 r이 잉크 농도 */
  textInk?: readonly [number, number, number];
  /**
   * 글자 텍스처가 RGB 투과율인 세계 (EDEN — 흰색 = 글자 없음). 원본 사진 ÷ 글자 없는 합성으로
   * 구워, 검은 V와 빛에 비친 주황빛 4를 채널별로 그대로 재현합니다(단일 필터색으로는 불가능).
   */
  textTransmit?: true;
  /**
   * 다이브 내부의 빛 팔레트 [중심, 중간, 가장자리, 오로라 결].
   * 깊이 들어가면 텍스처(디지털 줌 — 확대할수록 깨짐) 대신 이 색들로 지은
   * 수식의 빛이 화면을 채웁니다. 해상도 개념이 없어 어떤 화면에서도 매끈합니다.
   */
  interior: readonly (readonly [number, number, number])[];
  image: Readonly<Record<256 | 512 | 768 | 1024, string>>;
  core: Readonly<Record<512 | 1024 | 2048, string>>;
  /** 고정 조명 레이어 — 화면 좌표 그대로 곱합니다 */
  light?: Readonly<Record<256 | 512, string>>;
  text: Readonly<Record<128 | 256 | 512, string>>;
  lqip: string;
}

export const ORB: Readonly<Record<WorldId, OrbSpec>> = {
  midbar: {
    outerC: [511.38 / 1024, 512.58 / 1024],
    outerR: 511.59 / 1024,
    coreC: [511.4 / 1024, 545.0 / 1024],
    coreR: 445.0 / 1024,
    detailGain: 1,
    shade: [0.03, 0.09, 0.15],
    textInk: [15 / 255, 35 / 255, 62 / 255],
    /* 광야의 안쪽 — 크림빛 심 → 모래 → 호박 → 갈빛 결 */
    interior: [
      [0.996, 0.972, 0.918],
      [0.965, 0.895, 0.762],
      [0.871, 0.741, 0.553],
      [0.788, 0.6, 0.337],
    ],
    image: {
      256: '/orb/orb-256.6c420aa4.webp',
      512: '/orb/orb-512.4548d84f.webp',
      768: '/orb/orb-768.1469e32b.webp',
      1024: '/orb/orb-1024.e28a5509.webp',
    },
    core: {
      512: '/orb/orb-core-512.20f59971.webp',
      1024: '/orb/orb-core-1024.807ec737.webp',
      2048: '/orb/orb-core-2048.ad5f9a02.webp',
    },
    text: {
      128: '/orb/orb-text-128.475f1e3a.png',
      256: '/orb/orb-text-256.1066082e.png',
      512: '/orb/orb-text-512.9622bef5.png',
    },
    lqip:
      'data:image/webp;base64,UklGRgQBAABXRUJQVlA4IPgAAABwBgCdASoYABgAPt1gqU+opSOiKAqpEBuJZACdMoMwITBbYAtl4uLsICJ2t5vClX/MYHdGG3wyRIcYmkAA/vTfiNJYiz8uHKH2WjCjGtwyO9ZLS2axPhSDze+w41AduwFvyf4xM90XLwJDmTgxW4fvcuRB+A3om5aBKWGXpW4pGk3ps+t0FvDWC5HbJf8YPvQxIKvtT6usnsxBfUfL0CR+hp3JQ6lu8XHlqTI8ovHMD+LqqoB4JfCvc3hEGgivswdCz3EFrJxilpo5A/fHqYu/wmnknIyw09Rzr+jLjeLNWdPcNRKY3t+i9hqIWrnkGKrwqlnlU14AAA==',
  },
  eden: {
    outerC: [0.49935, 0.50024],
    outerR: 0.49989,
    coreC: [0.49935, 0.50024],
    coreR: 0.4699,
    detailGain: 2.2174,
    textTransmit: true,
    /* 동산의 안쪽 — 새벽빛 심 → 이슬 초록 → 수풀 → 청록 결 */
    interior: [
      [0.973, 0.992, 0.965],
      [0.871, 0.945, 0.882],
      [0.671, 0.847, 0.755],
      [0.478, 0.733, 0.635],
    ],
    image: {
      256: '/orb/orb-eden-256.e8831719.webp',
      512: '/orb/orb-eden-512.15d2928d.webp',
      768: '/orb/orb-eden-768.0a62bc36.webp',
      1024: '/orb/orb-eden-1024.be3d49f3.webp',
    },
    core: {
      /* 글자를 지운 코어 — 원본 사진의 V4V가 텍스처에 함께 구워져 회전 중에
         거울상으로 떠돌던 것을 적도 밴드 인페인팅으로 걷어냈습니다.
         밴드는 무채색 디테일(D=1)로 — 예전 채움은 적색이 15% 모자라 가운데가 민트빛이었습니다.
         글자는 고정 레이어(text)가 화면 좌표에 그대로 얹습니다. */
      512: '/orb/orb-eden-core-512.d63a4f16.webp',
      1024: '/orb/orb-eden-core-1024.4780bf96.webp',
      2048: '/orb/orb-eden-core-2048.dcf86f5b.webp',
    },
    light: {
      /* 글자 구역(글자 + 16px)을 통째로 빼고 주변 빛만으로 다시 구운 조명.
         예전 조명에는 갈색 V4V 잔상이 흐릿하게 남아 있어, 다이브 때 구체와 함께
         커지며 '글자가 날아가는' 것처럼 보였습니다. */
      256: '/orb/orb-eden-light-256.b0496b42.webp',
      512: '/orb/orb-eden-light-512.0df8bb8b.webp',
    },
    text: {
      /* RGB 투과율 — 4의 대각선·가로획·윗부분까지 온전한 V4V (예전 알파는 4가 '‘1'로 잘려 있었음) */
      128: '/orb/orb-eden-text-128.9debc092.webp',
      256: '/orb/orb-eden-text-256.244faa33.webp',
      512: '/orb/orb-eden-text-512.3f627b65.webp',
    },
    lqip:
      'data:image/webp;base64,UklGRuoAAABXRUJQVlA4IN4AAADQBQCdASoYABgAPwl4sVOrpyQiqAqpcCEJagC7KLGA4eRnjF3NqHJkqCGPg3d0kwJgNSTf2MQAAP7tTDnI/Vyv86tbP1P6c9rfTU0gLjBCX94TFksCwge+mNesRYdwAkcCCGhbRM3Yh0kRzZldUsYAQNBrJgkL+e5fBZX7Fz9pjXs98vSIgBMubc8ySPPuAinEFlA4rCAjc6Wlrya2EPlcdDwPhbGc2aGSH6cEGgLTu7kiaS8GYkVjCMJWph93BY9LzzOdnvQAn+BfxoAirwfozd2JgcFXJ9a1imvnAAA=',
  },
} as const;

/**
 * 왼쪽 레일의 큰 구체 — 글자 없는 구 한 장(세계별).
 * 원본은 벡터(일러스트레이터 이미지 트레이스, 4.3MB·2.7MB)라 그대로 싣지 않고, 구에 딱 맞춘
 * viewBox(여백 1%)로 2048px까지 래스터화해 WebP로 구웠습니다 — 화면 높이만 한 구체로 키워도
 * 예전 1024px 사진처럼 뭉개지지 않습니다. 알파는 해석적인 원 하나 — 안쪽은 완전히 불투명(트레이스 조각 사이의
 * 반투명 이음새는 이웃 색으로 메움: WebKit이 미리 곱해 올리면 WebGL에서 어두운 자국이 됐습니다), 바깥은 투명.
 *
 * 구울 때 두 가지를 그림에 넣어 두었습니다 — 정지 사진과 WebGL이 같은 그림을 쓰므로 둘 다 똑같이 보입니다.
 *  · 창문 반사(위쪽 가운데, 반지름 0.78–0.86) 제거: 안쪽이 돌면 반사가 함께 돌아 유리가 아니라
 *    그림처럼 보였습니다. 그 자리는 둘레의 대리석 결로 메웠습니다.
 *  · 가장자리 톤: 원본의 희끗한 바깥 테를 반지름 0.78부터 가장자리까지(제곱으로 깊게) 세계의
 *    짙은 톤으로 덮었습니다 — MIDBAR 모래 호박빛 rgb(0.824, 0.682, 0.502),
 *    EDEN 옅은 비취 rgb(0.49, 0.66, 0.58). 원 밖의 투명 픽셀도 같은 색이라 경계가 검게 번지지 않습니다.
 *    (톤은 회전과 무관한 동심원이라, 돌리는 안쪽에 미리 구워도 셰이더에서 칠한 것과 같습니다)
 *  · 트레이스 얼룩 제거: 원본 벡터에 섞인 단색 조각(EDEN — 새 모양 짙은 점·붉은 갈색 점·희끗한 점과
 *    작은 짙은 점 5개, MIDBAR — 아래쪽 흰 점 1개)은 구체가 돌며 메뉴 곁을 지나갔습니다. 국소 중앙값 대비
 *    ΔE로 찾아, 주변 링이 가장 닮은 근처 붓결을 옮겨 오고 경계 차이를 매끈하게 보간해 메웠습니다.
 * 구 바깥의 짙은 공기(halo)는 CSS(.v4v-rail-halo, globals.css)가 그립니다.
 */
export interface RailOrbSpec {
  image: Readonly<Record<1024 | 2048, string>>;
  lqip: string;
  /** 텍스처(0…1) 안의 구 반지름 — 중심은 (0.5, 0.5) */
  r: number;
}

export const RAIL_ORB: Readonly<Record<WorldId, RailOrbSpec>> = {
  midbar: {
    image: {
      1024: '/orb/orb-rail-midbar-1024.fb4a88df.webp',
      2048: '/orb/orb-rail-midbar-2048.d1fa8bbc.webp',
    },
    lqip:
      'data:image/webp;base64,UklGRqIAAABXRUJQVlA4IJYAAABwBQCdASoYABgAPq1GnEmmI6KhMAwAwBWJZgCdMoRwACnEKSYB7ra6tK1UsAh8Eyt5WaAAAP7TG7uVJtzKCkocHDt14sBreozL1rY3je9ZbEyfNgDwcYFU1QLzvC0rB0Di1gkFCE5pEFSpFQidvAJ6YCV3PXNZ2Xi+aEftI1brjQXT6VAk6A/oHHyrcWWHxg+5ki49pAA=',
    r: 0.4951,
  },
  eden: {
    image: {
      1024: '/orb/orb-rail-eden-1024.495006e9.webp',
      2048: '/orb/orb-rail-eden-2048.1fed8f58.webp',
    },
    lqip:
      'data:image/webp;base64,UklGRr4AAABXRUJQVlA4ILIAAADQBQCdASoYABgAPrVOokwnJCMiKAqo4BaJZAC7MvRYANMAF8bqqzpjw71BI09e6mdFFPWIcqegAP3Nu/zwGJ0dVoVCqfd1pD/hxPdLz0/dV4SK9bmrCSVGe+3j9hayrliXhw5Vu87DchU59Vy8vUbmiXC+WmVyJGSx2JOC1QgoydAyu/qS9m8hB4bU3tRq7V6bzaX3qoNyaCQNxZTdFjbx5hglh7+5KoL7V+sdRQlpAAAA',
    r: 0.4951,
  },
} as const;

/** 세계의 하늘(앰비언트 배경) — 강하게 흐린 채로 구운 초경량 그림입니다. */
export const SKY: Readonly<Record<WorldId, { landscape: string; portrait: string }>> = {
  midbar: {
    landscape: '/world/midbar-l.6a27325d.webp',
    portrait: '/world/midbar-p.a8caf001.webp',
  },
  eden: {
    /* 무지개 아크 대신 프리즘 광선 — 우상단에서 쨍하게 들어오는 빛의 파장 (scratchpad world/paint_eden.py) */
    landscape: '/world/eden-l.776757c2.webp',
    portrait: '/world/eden-p.b512b966.webp',
  },
} as const;

/** 구체가 화면에서 차지하는 실제 픽셀 크기에 맞춰 텍스처를 고릅니다. */
export function orbTextures(spec: OrbSpec, sizePx: number) {
  return {
    core: sizePx > 640 ? spec.core[2048] : sizePx > 256 ? spec.core[1024] : spec.core[512],
    text: sizePx > 640 ? spec.text[512] : sizePx > 200 ? spec.text[256] : spec.text[128],
    light: spec.light ? (sizePx > 320 ? spec.light[512] : spec.light[256]) : undefined,
  };
}
