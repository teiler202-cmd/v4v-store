'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  signOut,
  updateProfile,
  type ActionResult,
} from '@/app/account/actions';
import { useAccount } from '@/components/AccountProvider';
import Bilingual from '@/components/Bilingual';
import { SILK } from '@/components/Reveal';

type Tab = 'orders' | 'addresses' | 'profile';

const TABS: { key: Tab; label: string; ko: string }[] = [
  { key: 'orders', label: 'Orders', ko: '주문 내역' },
  { key: 'addresses', label: 'Shipping', ko: '배송지' },
  { key: 'profile', label: 'Profile', ko: '회원 정보' },
];

const FINANCIAL: Record<string, string> = {
  PAID: '결제 완료',
  PENDING: '결제 대기',
  PARTIALLY_PAID: '부분 결제',
  REFUNDED: '환불 완료',
  PARTIALLY_REFUNDED: '부분 환불',
  VOIDED: '결제 취소',
  AUTHORIZED: '승인됨',
};

const FULFILLMENT: Record<string, string> = {
  FULFILLED: '배송 완료',
  UNFULFILLED: '배송 준비 중',
  PARTIALLY_FULFILLED: '부분 배송',
  IN_PROGRESS: '배송 중',
  ON_HOLD: '보류',
  SCHEDULED: '배송 예정',
  RESTOCKED: '재입고 처리',
  OPEN: '처리 중',
};

const field =
  'w-full border-0 border-b border-line bg-transparent pb-2.5 pt-1 font-grotesk text-[14px] tracking-[-0.01em] text-ink outline-none transition-colors duration-500 placeholder:text-ash/50 focus:border-ink';
const label = 'font-mono text-[8.5px] uppercase tracking-[0.24em] text-ash';
const solidButton =
  'bg-ink px-7 py-3.5 font-mono text-[9px] uppercase tracking-[0.26em] text-paper transition-opacity duration-500 ease-silk hover:opacity-80 disabled:opacity-40';
const ghostButton =
  'font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash transition-colors duration-500 hover:text-ink';

function money(amount?: string, currency?: string) {
  if (!amount) return '';
  return `${currency || 'KRW'} ${Math.floor(Number(amount)).toLocaleString()}`;
}

function formatDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export default function AccountDashboard({ customer }: { customer: any }) {
  const [tab, setTab] = useState<Tab>('orders');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const { refresh } = useAccount();

  const orders = (customer.orders?.edges ?? []).map((e: any) => e.node);
  const addresses = (customer.addresses?.edges ?? []).map((e: any) => e.node);
  const defaultAddressId = customer.defaultAddress?.id ?? null;

  const run = (action: (fd: FormData) => Promise<ActionResult>, formData: FormData) => {
    setFeedback(null);
    startTransition(async () => {
      const result = await action(formData);
      setFeedback(result.ok ? (result.message ?? '완료했습니다.') : result.message);
      if (result.ok) router.refresh();
    });
  };

  const handleSignOut = () => {
    startTransition(async () => {
      await signOut();
      await refresh();
      router.replace('/');
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-[900px] px-6 pb-32 pt-16 md:pt-24">
      {/* ---------- 인사 ---------- */}
      <header className="flex flex-col gap-5 border-b border-line-soft pb-10 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-2.5">
          <span className="font-mono text-[8.5px] uppercase tracking-[0.28em] text-ash">
            My Account
          </span>
          <h1 className="font-grotesk text-[24px] font-bold tracking-[-0.035em] text-ink md:text-[30px]">
            {customer.firstName || customer.displayName || 'Visionary'}
          </h1>
          <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-ash">
            {customer.email}
            {customer.createdAt && <> &nbsp;·&nbsp; Since {formatDate(customer.createdAt)}</>}
            {typeof customer.numberOfOrders !== 'undefined' && (
              <> &nbsp;·&nbsp; {customer.numberOfOrders} orders</>
            )}
          </p>
        </div>

        <button onClick={handleSignOut} disabled={pending} className={ghostButton}>
          <Bilingual en="Sign out →" ko="로그아웃 →" inline />
        </button>
      </header>

      {/* ---------- 탭 ---------- */}
      <nav className="scrollbar-hide mt-8 flex gap-8 overflow-x-auto">
        {TABS.map(({ key, label: text, ko }) => {
          const on = tab === key;
          return (
            <button
              key={key}
              onClick={() => {
                setTab(key);
                setFeedback(null);
              }}
              className={`group relative shrink-0 pb-2 text-left transition-colors duration-500 ease-silk ${
                on ? 'text-ink' : 'text-ash hover:text-ink'
              }`}
            >
              <span className="block font-mono text-[9.5px] uppercase tracking-[0.22em]">{text}</span>
              <span className="mt-1 block font-mono text-[8px] uppercase tracking-[0.14em] opacity-60">
                {ko}
              </span>
              <span
                className={`absolute bottom-0 left-0 h-px w-full origin-left bg-ink transition-transform duration-[600ms] ease-silk ${
                  on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>
          );
        })}
      </nav>

      {feedback && (
        <p className="mt-6 font-mono text-[9px] uppercase tracking-[0.14em] text-ink">{feedback}</p>
      )}

      <AnimatePresence mode="wait">
        <motion.section
          key={tab}
          initial={{ opacity: 0, y: 14, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(5px)' }}
          transition={{ duration: 0.5, ease: SILK }}
          className="mt-12"
        >
          {tab === 'orders' && <Orders orders={orders} />}
          {tab === 'addresses' && (
            <Addresses
              addresses={addresses}
              defaultAddressId={defaultAddressId}
              pending={pending}
              onSave={(fd) => run(saveAddress, fd)}
              onDelete={(fd) => run(deleteAddress, fd)}
              onMakeDefault={(fd) => run(setDefaultAddress, fd)}
            />
          )}
          {tab === 'profile' && (
            <Profile customer={customer} pending={pending} onSave={(fd) => run(updateProfile, fd)} />
          )}
        </motion.section>
      </AnimatePresence>
    </div>
  );
}

/* ---------------------------------------------------------------
   주문 내역
   --------------------------------------------------------------- */
function Orders({ orders }: { orders: any[] }) {
  if (!orders.length) {
    return (
      <div className="flex flex-col items-center gap-5 py-20 text-center">
        <Bilingual
          en="No orders yet"
          ko="아직 주문 내역이 없습니다"
          inline
          className="justify-center font-mono text-[9px] uppercase tracking-[0.16em] text-ash"
        />
        <Link href="/" className={ghostButton}>
          Shop →
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-12">
      {orders.map((order) => {
        const items = (order.lineItems?.edges ?? []).map((e: any) => e.node);
        return (
          <article key={order.id} className="flex flex-col gap-5 border-b border-line-soft pb-12 last:border-0">
            <header className="flex flex-wrap items-baseline justify-between gap-3">
              <div className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-ink">
                  {order.name || `#${order.orderNumber}`}
                </span>
                <span className="font-mono text-[8.5px] uppercase tracking-[0.16em] text-ash">
                  {formatDate(order.processedAt)}
                  {order.financialStatus && (
                    <> &nbsp;·&nbsp; {FINANCIAL[order.financialStatus] ?? order.financialStatus}</>
                  )}
                  {order.fulfillmentStatus && (
                    <> &nbsp;·&nbsp; {FULFILLMENT[order.fulfillmentStatus] ?? order.fulfillmentStatus}</>
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-6">
                <span className="font-mono text-[10px] tracking-[0.14em] text-ink">
                  {money(order.currentTotalPrice?.amount, order.currentTotalPrice?.currencyCode)}
                </span>
                {order.statusUrl && (
                  <a href={order.statusUrl} target="_blank" rel="noopener noreferrer" className={ghostButton}>
                    주문 상세 →
                  </a>
                )}
              </div>
            </header>

            <ul className="flex flex-col gap-4">
              {items.map((item: any, i: number) => (
                <li key={`${order.id}-${i}`} className="flex items-center gap-4">
                  <div className="h-16 w-14 shrink-0 overflow-hidden bg-mist">
                    {item.variant?.image?.url && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={item.variant.image.url}
                        alt={item.title}
                        className="h-full w-full object-contain"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col gap-1">
                    <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink">
                      {item.title}
                    </span>
                    <span className="font-mono text-[8.5px] uppercase tracking-[0.14em] text-ash">
                      {item.variant?.title && item.variant.title !== 'Default Title'
                        ? `${item.variant.title} · `
                        : ''}
                      QTY {item.quantity}
                    </span>
                  </div>
                  <span className="font-mono text-[9px] tracking-[0.14em] text-ash">
                    {money(item.variant?.price?.amount, item.variant?.price?.currencyCode)}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}

/* ---------------------------------------------------------------
   배송지
   --------------------------------------------------------------- */
function Addresses({
  addresses,
  defaultAddressId,
  pending,
  onSave,
  onDelete,
  onMakeDefault,
}: {
  addresses: any[];
  defaultAddressId: string | null;
  pending: boolean;
  onSave: (fd: FormData) => void;
  onDelete: (fd: FormData) => void;
  onMakeDefault: (fd: FormData) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null); // address id | 'new' | null

  const form = (address?: any) => (
    <form
      action={onSave}
      className="mt-6 flex flex-col gap-6 border-t border-line-soft pt-8"
    >
      {address?.id && <input type="hidden" name="id" value={address.id} />}

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Bilingual en="First name" ko="이름" inline className={label} />
          <input name="firstName" defaultValue={address?.firstName ?? ''} className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <Bilingual en="Last name" ko="성" inline className={label} />
          <input name="lastName" defaultValue={address?.lastName ?? ''} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="Address" ko="주소" inline className={label} />
        <input name="address1" defaultValue={address?.address1 ?? ''} className={field} required />
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="Address line 2" ko="상세 주소" inline className={label} />
        <input name="address2" defaultValue={address?.address2 ?? ''} className={field} />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Bilingual en="City" ko="시 / 군 / 구" inline className={label} />
          <input name="city" defaultValue={address?.city ?? ''} className={field} required />
        </div>
        <div className="flex flex-col gap-2">
          <Bilingual en="Province" ko="시 / 도" inline className={label} />
          <input name="province" defaultValue={address?.province ?? ''} className={field} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Bilingual en="Postal code" ko="우편번호" inline className={label} />
          <input name="zip" defaultValue={address?.zip ?? ''} className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <Bilingual en="Country" ko="국가" inline className={label} />
          <input name="country" defaultValue={address?.country ?? 'South Korea'} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="Phone" ko="연락처" inline className={label} />
        <input name="phone" defaultValue={address?.phone ?? ''} className={field} />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="makeDefault"
          defaultChecked={!addresses.length}
          className="h-3 w-3 shrink-0 appearance-none border border-line bg-paper checked:border-ink checked:bg-ink"
        />
        <Bilingual
          en="Use as default address"
          ko="기본 배송지로 사용"
          inline
          className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-ash"
        />
      </label>

      <div className="flex items-center gap-6">
        <button type="submit" disabled={pending} className={solidButton}>
          Save
        </button>
        <button type="button" onClick={() => setEditing(null)} className={ghostButton}>
          취소
        </button>
      </div>
    </form>
  );

  return (
    <div className="flex flex-col gap-10">
      {addresses.length === 0 && editing !== 'new' && (
        <Bilingual
          en="No saved addresses"
          ko="저장된 배송지가 없습니다"
          inline
          className="font-mono text-[9px] uppercase tracking-[0.14em] text-ash"
        />
      )}

      {addresses.map((address: any) => {
        const isDefault = address.id === defaultAddressId;
        return (
          <div key={address.id} className="border-b border-line-soft pb-8 last:border-0">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex flex-col gap-1.5">
                {isDefault && (
                  <Bilingual
                    en="Default"
                    ko="기본 배송지"
                    inline
                    className="font-mono text-[8px] uppercase tracking-[0.16em] text-ink"
                  />
                )}
                <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-ink">
                  {[address.lastName, address.firstName].filter(Boolean).join(' ') || '—'}
                </span>
                <span className="text-[13px] font-light leading-[1.8] text-ash">
                  {[address.address1, address.address2].filter(Boolean).join(' ')}
                  <br />
                  {[address.city, address.province, address.zip, address.country]
                    .filter(Boolean)
                    .join(' ')}
                  {address.phone && (
                    <>
                      <br />
                      {address.phone}
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-5">
                {!isDefault && (
                  <form action={onMakeDefault}>
                    <input type="hidden" name="id" value={address.id} />
                    <button type="submit" disabled={pending} className={ghostButton}>
                      <Bilingual en="Set default" ko="기본으로" inline />
                    </button>
                  </form>
                )}
                <button
                  onClick={() => setEditing(editing === address.id ? null : address.id)}
                  className={ghostButton}
                >
                  <Bilingual en="Edit" ko="수정" inline />
                </button>
                <form action={onDelete}>
                  <input type="hidden" name="id" value={address.id} />
                  <button type="submit" disabled={pending} className={ghostButton}>
                    <Bilingual en="Delete" ko="삭제" inline />
                  </button>
                </form>
              </div>
            </div>

            {editing === address.id && form(address)}
          </div>
        );
      })}

      {editing === 'new' ? (
        form()
      ) : (
        <button onClick={() => setEditing('new')} className={`${ghostButton} w-fit`}>
          <Bilingual en="+ Add address" ko="+ 배송지 추가" inline />
        </button>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------
   회원 정보
   --------------------------------------------------------------- */
function Profile({
  customer,
  pending,
  onSave,
}: {
  customer: any;
  pending: boolean;
  onSave: (fd: FormData) => void;
}) {
  return (
    <form action={onSave} className="flex max-w-[440px] flex-col gap-7">
      <div className="grid grid-cols-2 gap-5">
        <div className="flex flex-col gap-2">
          <Bilingual en="First name" ko="이름" inline className={label} />
          <input name="firstName" defaultValue={customer.firstName ?? ''} className={field} />
        </div>
        <div className="flex flex-col gap-2">
          <Bilingual en="Last name" ko="성" inline className={label} />
          <input name="lastName" defaultValue={customer.lastName ?? ''} className={field} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="Email" ko="이메일" inline className={label} />
        <input value={customer.email ?? ''} readOnly className={`${field} text-ash`} />
        <Bilingual
          en="To change your email, contact customer service"
          ko="이메일 변경은 고객센터로 문의해 주세요"
          inline
          className="font-mono text-[8px] uppercase tracking-[0.1em] text-ash/70"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="Phone" ko="연락처" inline className={label} />
        <input
          name="phone"
          defaultValue={customer.phone ?? ''}
          className={field}
          placeholder="+82 10 0000 0000"
        />
      </div>

      <div className="flex flex-col gap-2">
        <Bilingual en="New password" ko="새 비밀번호" inline className={label} />
        <input
          name="password"
          type="password"
          minLength={5}
          className={field}
          placeholder="변경할 때만 입력 · leave blank to keep"
          autoComplete="new-password"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          name="acceptsMarketing"
          defaultChecked={!!customer.acceptsMarketing}
          className="h-3 w-3 shrink-0 appearance-none border border-line bg-paper checked:border-ink checked:bg-ink"
        />
        <Bilingual
          en="Receive new releases and archive notes"
          ko="신제품 · 아카이브 소식 메일 수신"
          inline
          className="font-mono text-[8.5px] uppercase tracking-[0.1em] text-ash"
        />
      </label>

      <button type="submit" disabled={pending} className={`${solidButton} mt-2 w-fit`}>
        Save
      </button>
    </form>
  );
}
