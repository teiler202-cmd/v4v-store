import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import CopyBlock from '@/components/CopyBlock';
import EmailTestSend from '@/components/EmailTestSend';
import { SAMPLES, findSample } from '@/lib/email/samples';
import { buildNotifications } from '@/lib/email/shopify';
import type { Lang } from '@/lib/email/layout';
import { SITE_URL } from '@/lib/brand';

export const metadata: Metadata = {
  title: 'Email Studio',
  robots: { index: false, follow: false },
};

/**
 * 브랜드 메일 스튜디오 — 개발 중에만 열리는 작업대.
 *
 * 여기서 세 가지를 합니다.
 *   1. 모든 메일을 실제 크기로 확인 (문구를 고치면 바로 반영됩니다)
 *   2. 한국어판·영문판을 나란히 비교
 *   3. 쇼피파이 관리자에 붙여 넣을 Liquid 템플릿을 언어별로 복사
 *
 * 배포된 곳에서는 존재하지 않는 주소가 됩니다.
 */

const GROUPS = ['계정', '주문 · 배송', '마케팅', '응대'] as const;

/**
 * 미리보기에서만 절대 주소를 상대 주소로 바꿉니다.
 *
 * 메일 본문의 이미지는 https://vision4visionary.com/... 를 가리키는 게 맞지만,
 * 로컬에서 그대로 두면 CSP(img-src 'self')가 막아 로고조차 보이지 않습니다.
 * 실제로 발송되는 메일은 이 함수를 거치지 않습니다.
 */
const localize = (html: string) => html.split(SITE_URL).join('');

export default async function EmailStudio(props: {
  searchParams: Promise<{ t?: string; mode?: string; lang?: string }>;
}) {
  if (process.env.NODE_ENV === 'production') notFound();

  const { t = 'welcome', mode = 'preview', lang: rawLang } = await props.searchParams;
  const lang: Lang = rawLang === 'en' ? 'en' : 'ko';

  const sample = findSample(t) ?? SAMPLES[0];
  const email = sample.build(lang);
  const notification = buildNotifications(lang).find((n) => n.id === sample.id);

  const href = (next: { t?: string; mode?: string; lang?: Lang }) =>
    `/studio/emails?t=${next.t ?? sample.id}&mode=${next.mode ?? mode}&lang=${next.lang ?? lang}`;

  return (
    <div className="mx-auto w-full max-w-[1500px] px-6 py-16 md:px-10">
      <header className="flex flex-col gap-2 border-b border-line-soft pb-8">
        <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
          Development only
        </p>
        <h1 className="font-grotesk text-[24px] font-bold tracking-[-0.03em] text-ink">
          Brand Email Studio
        </h1>
        <p className="max-w-[640px] text-[12.5px] font-light leading-[1.9] text-ash">
          브랜드가 보내는 모든 메일이 같은 디자인 시스템(lib/email)에서 나옵니다. 한국어판과
          영문판은 섞이지 않고 따로 만들어지며, 문구를 고치면 우리가 직접 보내는 메일과 쇼피파이가
          보내는 메일에 함께 반영됩니다.
        </p>
      </header>

      <div className="mt-10 flex flex-col gap-10 lg:flex-row">
        {/* 목록 */}
        <nav className="w-full shrink-0 lg:w-[230px]">
          {/* 언어 전환 */}
          <div className="mb-8 flex gap-5 border-b border-line-soft pb-5">
            {(['ko', 'en'] as const).map((l) => (
              <Link
                key={l}
                href={href({ lang: l })}
                className={`font-mono text-[9px] uppercase tracking-[0.2em] transition-opacity duration-300 ${
                  lang === l ? 'text-ink' : 'text-ash hover:opacity-60'
                }`}
              >
                {l === 'ko' ? '한국어' : 'English'}
              </Link>
            ))}
          </div>

          {GROUPS.map((group) => {
            const items = SAMPLES.filter((s) => s.group === group);
            if (!items.length) return null;
            return (
              <div key={group} className="mb-8">
                <p className="mb-3 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  {group}
                </p>
                <ul className="flex flex-col gap-2">
                  {items.map((item) => (
                    <li key={item.id}>
                      <Link
                        href={href({ t: item.id })}
                        className={`flex items-baseline gap-2 text-[12.5px] tracking-[-0.01em] transition-opacity duration-300 ${
                          item.id === sample.id ? 'text-ink' : 'text-ash hover:opacity-60'
                        }`}
                      >
                        {item.id === sample.id && <span className="text-[9px]">—</span>}
                        {lang === 'ko' ? item.label : item.labelEn}
                        {item.shopify && (
                          <span className="font-mono text-[7.5px] uppercase tracking-[0.16em] text-ash/60">
                            shopify
                          </span>
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* 본문 */}
        <section className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-4 border-b border-line-soft pb-4">
            <div className="flex flex-col gap-1">
              <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">Subject</p>
              <p className="text-[13px] text-ink">{email.subject}</p>
            </div>
            <div className="flex gap-5">
              {(['preview', 'text', 'liquid'] as const).map((m) => {
                const disabled = m === 'liquid' && !notification;
                return disabled ? (
                  <span
                    key={m}
                    className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash/35"
                  >
                    {m}
                  </span>
                ) : (
                  <Link
                    key={m}
                    href={href({ mode: m })}
                    className={`font-mono text-[8.5px] uppercase tracking-[0.2em] transition-opacity duration-300 ${
                      mode === m ? 'text-ink' : 'text-ash hover:opacity-60'
                    }`}
                  >
                    {m}
                  </Link>
                );
              })}
            </div>
          </div>

          {mode === 'preview' && (
            <>
              <div className="mb-5 border border-line-soft px-5 py-4">
                <p className="mb-3 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  실제 메일함에서 확인 · {lang === 'ko' ? '한국어판' : '영문판'}
                </p>
                <EmailTestSend templateId={sample.id} lang={lang} />
              </div>

              <div className="border border-line-soft bg-mist p-4 md:p-8">
                <iframe
                  title={`${sample.label} 미리보기`}
                  srcDoc={localize(email.html)}
                  className="mx-auto block h-[900px] w-full max-w-[620px] border-0 bg-paper"
                />
              </div>
            </>
          )}

          {mode === 'text' && (
            <pre className="overflow-x-auto whitespace-pre-wrap border border-line-soft bg-mist p-6 font-mono text-[11px] leading-[1.9] text-ink">
              {email.text}
            </pre>
          )}

          {mode === 'liquid' && notification && (
            <div className="flex flex-col gap-5">
              <div className="border border-line-soft bg-mist p-6">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  붙여 넣는 곳
                </p>
                <p className="mt-3 text-[12.5px] leading-[1.9] text-ink">
                  Shopify 관리자 → 설정 → 알림 → 고객 알림 →{' '}
                  <span className="font-medium">{notification.adminKo}</span>
                  <span className="text-ash"> ({notification.admin})</span> → 이메일 본문 편집에서
                  기존 내용을 모두 지우고 아래를 붙여 넣으세요.
                </p>
                <p className="mt-3 text-[11.5px] leading-[1.8] text-ash">
                  스토어에 언어가 둘 이상 추가되어 있으면 알림 편집기 상단에 언어 선택이
                  나타납니다. 지금 보고 계신 것은{' '}
                  <span className="text-ink">{lang === 'ko' ? '한국어판' : '영문판'}</span>이며,
                  해당 언어 자리에 붙여 넣으세요.
                </p>
                <p className="mt-4 font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  Subject
                </p>
                <p className="mt-2 break-all font-mono text-[11px] text-ink">
                  {notification.subject}
                </p>
              </div>

              <div className="flex items-center justify-between">
                <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
                  Liquid · {lang} · {notification.liquid.length.toLocaleString()} chars
                </p>
                <CopyBlock code={notification.liquid} label="Copy Liquid" />
              </div>

              <pre className="max-h-[520px] overflow-auto border border-line-soft bg-mist p-6 font-mono text-[10px] leading-[1.7] text-ink">
                {notification.liquid}
              </pre>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
