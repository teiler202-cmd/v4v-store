import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import FounderConsole from './FounderConsole';
import {
  FOUNDER_COLLECTION_HANDLE,
  FOUNDER_LIMIT,
  FOUNDER_TAG,
  hasFounderConfig,
} from '@/lib/founder';

export const metadata: Metadata = {
  title: 'Founding 50',
  robots: { index: false, follow: false },
};

/**
 * 창립 50인 콘솔 — 개발 중에만 열리는 작업대.
 *
 * 첫 티셔츠를 산 사람들을 찾아, 한 명당 만료 없는 무료 코드 한 장을 만들고,
 * 그 명부를 CSV로 뽑아 냅니다. 이메일 스튜디오와 같은 자리에 두었습니다.
 * 배포된 곳에서는 존재하지 않는 주소가 됩니다.
 */
export default function FounderStudio() {
  if (process.env.NODE_ENV === 'production') notFound();

  return (
    <div className="mx-auto w-full max-w-[1100px] px-6 py-16 md:px-10">
      <header className="flex flex-col gap-2 border-b border-line-soft pb-8">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
          Development only
        </p>
        <h1 className="font-grotesk text-[24px] font-bold tracking-[-0.03em] text-ink">
          Founding 50 — Credit Issuer
        </h1>
        <p className="mt-2 max-w-[640px] font-mono text-[10px] leading-[1.9] text-ash">
          첫 생산 {FOUNDER_LIMIT}장을 사 준 사람들에게 옷 한 벌을 무료로 가져갈 권리를
          한 장씩 발급합니다. 만료일은 넣지 않습니다. 코드는 그 사람의 계정에 묶이므로
          유출되어도 다른 사람이 쓸 수 없고, 대신 반드시 로그인한 상태로만 쓸 수 있습니다.
          발급된 고객에게는 <code className="text-ink">{FOUNDER_TAG}</code> 태그가 붙어
          쇼피파이 세그먼트에서 바로 골라낼 수 있습니다.
        </p>
      </header>

      <div className="pt-12">
        <FounderConsole
          limit={FOUNDER_LIMIT}
          collectionHandle={FOUNDER_COLLECTION_HANDLE}
          configured={hasFounderConfig()}
        />
      </div>
    </div>
  );
}
