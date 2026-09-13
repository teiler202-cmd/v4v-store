import Link from 'next/link';
import { listDocs } from '@/lib/ops/docs';

export const metadata = { title: '문서' };
export const dynamic = 'force-dynamic';

export default async function DocsIndex() {
  const docs = await listDocs();

  return (
    <div className="flex flex-col gap-4">
      <header>
        <h1 className="font-grotesk text-[18px] font-bold tracking-[-0.02em]">문서</h1>
        <p className="mt-1 font-mono text-[10px] leading-[1.8] text-ash">
          판단과 기준이 사는 곳. 저장소의 <code className="text-ink">content/ops/</code> 에 있고,
          고치는 것은 사람입니다 — 깃 히스토리가 곧 판본 기록입니다.
        </p>
      </header>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {docs.map((doc) => (
          <Link
            key={doc.slug}
            href={`/ops/docs/${doc.slug}`}
            className="flex flex-col gap-1 rounded border border-line bg-paper p-3.5 transition-colors hover:border-ink"
          >
            <p className="text-[13px] font-medium">
              {doc.icon ? `${doc.icon} ` : ''}{doc.title}
            </p>
            <p className="font-mono text-[10px] text-ash">{doc.summary}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
