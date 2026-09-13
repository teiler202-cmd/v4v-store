import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getDoc } from '@/lib/ops/docs';
import { renderMarkdown } from '@/lib/ops/markdown';
import { BRAND, BUSINESS, CONTACT } from '@/lib/brand';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDoc(slug);
  return { title: doc?.title ?? '문서' };
}

/**
 * 사업자 정보 표.
 *
 * 문서에 값을 적어 두지 않고 lib/brand.ts 에서 직접 읽어 그립니다.
 * 예전에는 노션에 사람이 보는 사본이 따로 있었고, 한쪽만 고쳐서
 * 손님이 아무도 읽지 않는 주소로 메일을 보낸 적이 있습니다.
 * 원본이 하나뿐이면 어긋날 수가 없습니다.
 */
function BrandTable() {
  const rows: [string, string][] = [
    ['상호', BRAND.name],
    ['대표', BUSINESS.representativeKo],
    ['사업자등록번호', BUSINESS.registrationNo],
    ['통신판매업 신고', BUSINESS.mailOrderNoKo],
    ['주소', BUSINESS.addressKo],
    ['고객문의', CONTACT.cs],
    ['제휴문의', CONTACT.partnership],
    ['전화', CONTACT.phoneKo],
    ['운영시간', CONTACT.hoursKo],
  ];

  return (
    <div className="my-3 overflow-x-auto">
      <table className="w-full min-w-[420px] border-collapse text-left">
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} className="border-b border-line-soft align-top">
              <th className="w-[130px] px-2 py-2 font-mono text-[9px] uppercase tracking-[0.1em] text-ash">
                {label}
              </th>
              <td className="px-2 py-2 text-[12px] leading-[1.65]">
                {value}
                {label === '통신판매업 신고' && BUSINESS.mailOrderNo === 'pending' ? (
                  <span className="ml-2 font-mono text-[9.5px] text-[#b42318]">
                    ⚠️ 신고는 끝났는데 코드가 아직 pending 입니다 — lib/brand.ts 를 고치세요
                  </span>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function DocPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const doc = await getDoc(slug);
  if (!doc) notFound();

  return (
    <article className="max-w-[720px]">
      <Link href="/ops/docs" className="font-mono text-[10px] text-ash hover:text-ink">
        ← 문서
      </Link>

      <h1 className="mt-3 font-grotesk text-[20px] font-bold tracking-[-0.02em]">
        {doc.icon ? `${doc.icon} ` : ''}{doc.title}
      </h1>
      <p className="mt-0.5 font-mono text-[10px] text-ash">{doc.summary}</p>

      <div className="mt-6">
        {renderMarkdown(doc.body, { 'brand-table': <BrandTable /> })}
      </div>

      <p className="mt-10 border-t border-line-soft pt-3 font-mono text-[9.5px] leading-[1.8] text-ash">
        이 글은 <code className="text-ink">content/ops/{doc.slug}.md</code> 입니다.
        고치려면 편집기에서 파일을 열고 커밋하세요 — 여기서는 읽기만 합니다.
      </p>
    </article>
  );
}
