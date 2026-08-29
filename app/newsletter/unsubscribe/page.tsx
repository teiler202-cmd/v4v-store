import type { Metadata } from 'next';
import UnsubscribePanel from '@/components/UnsubscribePanel';
import { verifyUnsubscribe } from '@/lib/email/unsubscribe';
import { CONTACT } from '@/lib/brand';

export const metadata: Metadata = {
  title: '수신거부',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

/**
 * 수신거부 확인 화면.
 *
 * 링크를 여는 것만으로 처리하지 않고 한 번 더 누르게 합니다 —
 * 메일 앱과 보안 장비가 본문의 링크를 미리 열어 보는 일이 흔해서,
 * 그대로 두면 읽지도 않은 사람이 수신거부 처리됩니다.
 */
export default async function UnsubscribePage(props: {
  searchParams: Promise<{ e?: string; t?: string }>;
}) {
  const { e = '', t = '' } = await props.searchParams;
  const email = e.trim().toLowerCase();
  const valid = Boolean(email) && verifyUnsubscribe(email, t);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-[440px] flex-col justify-center px-6 py-28">
      <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] text-ash">Unsubscribe</p>

      {valid ? (
        <UnsubscribePanel email={email} token={t} />
      ) : (
        <>
          <h1 className="mt-4 font-grotesk text-[21px] font-bold tracking-[-0.03em] text-ink">
            링크를 확인해 주세요
          </h1>
          <p className="mt-4 text-[12.5px] font-light leading-[1.9] text-ash">
            주소가 올바르지 않거나 링크가 손상되었습니다. 메일에 있는 수신거부 링크를 다시 눌러
            주시거나, 아래 주소로 알려 주시면 바로 처리해 드리겠습니다.
          </p>
          <a
            href={`mailto:${CONTACT.cs}`}
            className="mt-6 w-fit font-grotesk text-[13.5px] text-ink underline underline-offset-4"
          >
            {CONTACT.cs}
          </a>
        </>
      )}
    </div>
  );
}
