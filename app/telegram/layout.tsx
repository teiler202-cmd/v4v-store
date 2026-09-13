import type { Metadata } from 'next';

/**
 * 텔레그램 페이지의 메타데이터.
 *
 * 페이지 자체는 스크롤 연출 때문에 클라이언트 컴포넌트라 metadata를 내보낼 수 없습니다.
 * (`'use client'` 파일의 export const metadata 는 무시됩니다)
 * 그래서 이 구간에만 얇은 레이아웃을 하나 두고 거기에 붙였습니다.
 * 카카오톡·인스타그램으로 링크를 뿌릴 때 미리보기가 제대로 나오는 자리입니다.
 */
export const metadata: Metadata = {
  title: 'Telegram',
  description:
    '비전을 가진 사람들이 모이는 방. 드롭 소식과 완성 전의 작업, 그리고 각자 만들고 있는 것들이 오갑니다. 텔레그램 가입부터 입장까지 안내합니다.',
  alternates: { canonical: '/telegram' },
  openGraph: {
    title: 'Telegram | VISION FOR VISIONARY',
    description: '비전을 가진 사람들이 모이는 방 — 피드도 알고리즘도 없는 하나의 방.',
    url: '/telegram',
    type: 'website',
  },
};

export default function TelegramLayout({ children }: { children: React.ReactNode }) {
  return children;
}
