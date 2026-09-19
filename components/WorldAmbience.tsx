import { WORLDS } from '@/components/orb/assets';

/**
 * 세계의 공기, 밑그림 — 문서 전체에 깔리는 정적 물감.
 * 진짜 배경은 셰이더 캔버스(AuroraField)가 그리고, 이 층은
 * WebGL이 없거나 캔버스가 첫 프레임을 준비하기 전의 바탕색을 맡습니다.
 * 캔버스가 다 떠오르면(불투명이라 이 층을 완전히 덮음) html[data-sky='gl']로 display:none —
 * 보이지 않는 문서 높이만 한 층을 사파리가 계속 칠하고 붙들고 있던 비용(수십~백여 MB)을 내려놓습니다.
 * 컨텍스트를 잃거나 캔버스가 빠지면(결제 등) 표식이 지워져 다시 나타납니다(AuroraField).
 *
 *  · edges — 가장자리에서 짙고 안으로 들수록 옅어지는 세계의 물감 (문서 전 구간)
 *  · foot  — 문서의 발치에 고이는 빛
 *
 * 표시는 전부 CSS가 합니다: <html data-world>가 어느 세계를 보여줄지 정합니다.
 */
export default function WorldAmbience() {
  return (
    <div aria-hidden className="v4v-sky" data-nosnippet>
      {WORLDS.map((world) => (
        <div key={world} className={`v4v-sky-layer v4v-w-${world}`}>
          <span className="v4v-sky-edges" />
          <span className="v4v-sky-foot" />
        </div>
      ))}
    </div>
  );
}
