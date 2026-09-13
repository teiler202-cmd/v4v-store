import type { Metadata } from 'next';

/**
 * 운영 보드의 바깥 껍데기.
 *
 * 스토어의 헤더·푸터·상담창은 components/ChromeGate.tsx 가 /ops 에서 비웁니다.
 * 여기서는 검색 엔진에 절대 노출되지 않게만 못 박아 둡니다.
 */
export const metadata: Metadata = {
  title: { template: '%s · V4V 보드', default: 'V4V 보드' },
  robots: { index: false, follow: false, nocache: true },
};

export default function OpsLayout({ children }: { children: React.ReactNode }) {
  return <div className="bg-mist text-ink">{children}</div>;
}
