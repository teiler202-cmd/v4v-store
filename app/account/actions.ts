'use server';

import { revalidatePath } from 'next/cache';
import {
  ACCESS_TOKEN_CREATE,
  ACCESS_TOKEN_DELETE,
  ADDRESS_CREATE,
  ADDRESS_DELETE,
  ADDRESS_UPDATE,
  CUSTOMER_CREATE,
  CUSTOMER_FULL,
  CUSTOMER_RECOVER,
  CUSTOMER_UPDATE,
  DEFAULT_ADDRESS_UPDATE,
  customerFetch,
  humanizeError,
} from '@/lib/shopify-customer';
import { clearSessionToken, getSessionToken, setSessionToken } from '@/lib/session';
import { assessPassword } from '@/lib/password';
import { clearRateLimit, rateLimit, tooManyMessage } from '@/lib/rateLimit';

export type ActionResult = { ok: true; message?: string } | { ok: false; message: string };

/* ---------------------------------------------------------------
   인증
   --------------------------------------------------------------- */

async function issueToken(email: string, password: string): Promise<ActionResult> {
  const { data, errors } = await customerFetch(ACCESS_TOKEN_CREATE, {
    input: { email, password },
  });

  if (errors?.length) return { ok: false, message: '로그인 요청을 처리하지 못했습니다.' };

  const payload = data?.customerAccessTokenCreate;
  const failure = payload?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  const token = payload?.customerAccessToken;
  if (!token?.accessToken) return { ok: false, message: '로그인 토큰을 받지 못했습니다.' };

  await setSessionToken(token.accessToken, token.expiresAt);
  return { ok: true };
}

export async function signIn(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');

  if (!email || !password) return { ok: false, message: '이메일과 비밀번호를 입력해 주세요.' };

  // 비밀번호를 사전으로 찍어 보는 걸 막습니다 — 10분에 8번까지.
  const limit = await rateLimit('signin', { limit: 8, windowMs: 600_000, blockMs: 900_000 });
  if (!limit.ok) return { ok: false, message: tooManyMessage(limit.retryAfterSec) };

  const result = await issueToken(email, password);
  if (result.ok) {
    await clearRateLimit('signin'); // 제대로 로그인했으면 기록을 지워 줍니다
    revalidatePath('/account');
  }
  return result;
}

export async function signUp(formData: FormData): Promise<ActionResult> {
  const firstName = String(formData.get('firstName') || '').trim();
  const lastName = String(formData.get('lastName') || '').trim();
  const email = String(formData.get('email') || '').trim();
  const password = String(formData.get('password') || '');
  const acceptsMarketing = formData.get('acceptsMarketing') === 'on';

  if (!email || !password) return { ok: false, message: '이메일과 비밀번호를 입력해 주세요.' };

  // 가입 폼은 '이 이메일이 이미 있는지' 알려주는 창구이기도 해서,
  // 계정 목록을 긁어가는 데 쓰일 수 있습니다 — 1시간에 5번으로 제한합니다.
  const limit = await rateLimit('signup', { limit: 5, windowMs: 3_600_000, blockMs: 3_600_000 });
  if (!limit.ok) return { ok: false, message: tooManyMessage(limit.retryAfterSec) };

  // 클라이언트 검사는 안내일 뿐이라, 서버에서 정책을 한 번 더 강제합니다.
  const strength = assessPassword(password, { email, firstName, lastName });
  if (!strength.ok) {
    return { ok: false, message: strength.message ?? '더 안전한 비밀번호를 사용해 주세요.' };
  }

  const { data, errors } = await customerFetch(CUSTOMER_CREATE, {
    input: { firstName, lastName, email, password, acceptsMarketing },
  });

  if (errors?.length) return { ok: false, message: '가입 요청을 처리하지 못했습니다.' };

  const failure = data?.customerCreate?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  // 가입 직후 바로 로그인 상태로 이어줍니다.
  const signedIn = await issueToken(email, password);
  if (!signedIn.ok) {
    return {
      ok: false,
      message: '가입은 완료되었습니다. 스토어 설정에 따라 인증 메일 확인 후 로그인해 주세요.',
    };
  }

  revalidatePath('/account');
  return { ok: true };
}

export async function signOut(): Promise<ActionResult> {
  const token = await getSessionToken();
  let revoked = true;

  if (token) {
    // 쇼피파이 쪽에서도 토큰을 죽여야 합니다 —
    // 우리 쿠키만 지우면, 누군가 그 토큰 값을 이미 갖고 있을 때 계속 쓸 수 있습니다.
    const { data, errors } = await customerFetch(ACCESS_TOKEN_DELETE, {
      customerAccessToken: token,
    });
    revoked = !errors?.length && !data?.customerAccessTokenDelete?.userErrors?.length;
    if (!revoked) {
      console.error('[auth] 쇼피파이 토큰 폐기 실패 — 쿠키는 정리했지만 토큰은 만료까지 살아 있습니다');
    }
  }

  // 폐기에 실패했더라도 이 기기에서는 반드시 로그아웃시킵니다.
  await clearSessionToken();
  revalidatePath('/account');

  return revoked
    ? { ok: true }
    : { ok: true, message: '로그아웃했습니다. (서버 세션 정리는 잠시 뒤 완료됩니다)' };
}

export async function requestPasswordReset(formData: FormData): Promise<ActionResult> {
  const email = String(formData.get('email') || '').trim();
  if (!email) return { ok: false, message: '이메일을 입력해 주세요.' };

  // 남의 메일함에 재설정 메일을 퍼붓지 못하게 합니다 — 1시간에 4번까지.
  const limit = await rateLimit('recover', { limit: 4, windowMs: 3_600_000, blockMs: 3_600_000 });
  if (!limit.ok) return { ok: false, message: tooManyMessage(limit.retryAfterSec) };

  const { data, errors } = await customerFetch(CUSTOMER_RECOVER, { email });
  if (errors?.length) return { ok: false, message: '메일을 보내지 못했습니다.' };

  const failure = data?.customerRecover?.customerUserErrors?.[0];
  // 가입 여부를 알려주지 않는 편이 안전합니다 — 없는 이메일도 같은 안내를 보여줍니다.
  if (failure && failure.code !== 'UNIDENTIFIED_CUSTOMER') {
    return { ok: false, message: humanizeError(failure) };
  }

  return { ok: true, message: '가입된 이메일이라면 재설정 메일이 발송됩니다. 메일함을 확인해 주세요.' };
}

/* ---------------------------------------------------------------
   마이페이지
   --------------------------------------------------------------- */

/**
 * 세션 상태를 네 가지로 구분해서 돌려줍니다.
 *
 * '만료'와 '통신 실패'를 뭉뚱그리면, 쇼피파이가 잠깐 흔들릴 때마다
 * 멀쩡히 로그인한 사용자가 로그아웃당합니다. 그래서 나눠서 알립니다.
 */
export type CustomerSession =
  | { status: 'anonymous' }
  | { status: 'expired' }
  | { status: 'error' }
  | { status: 'ok'; customer: any };

export async function getCustomerSession(): Promise<CustomerSession> {
  const token = await getSessionToken();
  if (!token) return { status: 'anonymous' };

  const { data, errors } = await customerFetch(CUSTOMER_FULL, { customerAccessToken: token });

  // 네트워크 오류·쇼피파이 5xx·rate limit — 세션이 죽은 게 아닙니다.
  if (errors?.length) return { status: 'error' };

  const customer = data?.customer;
  if (!customer) return { status: 'expired' };

  return { status: 'ok', customer };
}

/**
 * 화면 렌더용 축약형.
 *
 * ⚠️ 여기서 쿠키를 지우면 안 됩니다.
 *    이 함수는 서버 컴포넌트가 화면을 그리는 도중에 호출되는데,
 *    Next는 렌더 단계의 쿠키 변경을 금지하고 예외를 던집니다 (= /account 가 500).
 *    만료된 쿠키 청소는 쿠키 변경이 허용된 app/api/account/session/route.ts 가 맡습니다.
 */
export async function getCustomer() {
  const session = await getCustomerSession();
  return session.status === 'ok' ? session.customer : null;
}

export async function updateProfile(formData: FormData): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: '로그인이 필요합니다.' };

  const customer: Record<string, unknown> = {
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    phone: String(formData.get('phone') || '').trim() || null,
    acceptsMarketing: formData.get('acceptsMarketing') === 'on',
  };

  const password = String(formData.get('password') || '');
  if (password) {
    const strength = assessPassword(password, {
      email: String(formData.get('email') || ''),
      firstName: String(customer.firstName || ''),
      lastName: String(customer.lastName || ''),
    });
    if (!strength.ok) {
      return { ok: false, message: strength.message ?? '더 안전한 비밀번호를 사용해 주세요.' };
    }
    customer.password = password;
  }

  const { data, errors } = await customerFetch(CUSTOMER_UPDATE, {
    customerAccessToken: token,
    customer,
  });

  if (errors?.length) return { ok: false, message: '정보를 저장하지 못했습니다.' };

  const failure = data?.customerUpdate?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  // 비밀번호를 바꾸면 새 토큰이 발급됩니다.
  const renewed = data?.customerUpdate?.customerAccessToken;
  if (renewed?.accessToken) await setSessionToken(renewed.accessToken, renewed.expiresAt);

  revalidatePath('/account');
  return { ok: true, message: '저장했습니다.' };
}

function addressFromForm(formData: FormData) {
  return {
    firstName: String(formData.get('firstName') || '').trim(),
    lastName: String(formData.get('lastName') || '').trim(),
    address1: String(formData.get('address1') || '').trim(),
    address2: String(formData.get('address2') || '').trim(),
    city: String(formData.get('city') || '').trim(),
    province: String(formData.get('province') || '').trim(),
    zip: String(formData.get('zip') || '').trim(),
    country: String(formData.get('country') || 'South Korea').trim(),
    phone: String(formData.get('phone') || '').trim(),
  };
}

export async function saveAddress(formData: FormData): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: '로그인이 필요합니다.' };

  const id = String(formData.get('id') || '');
  const address = addressFromForm(formData);

  if (!address.address1 || !address.city) {
    return { ok: false, message: '주소와 시/도를 입력해 주세요.' };
  }

  const { data, errors } = id
    ? await customerFetch(ADDRESS_UPDATE, { customerAccessToken: token, id, address })
    : await customerFetch(ADDRESS_CREATE, { customerAccessToken: token, address });

  if (errors?.length) return { ok: false, message: '배송지를 저장하지 못했습니다.' };

  const payload = id ? data?.customerAddressUpdate : data?.customerAddressCreate;
  const failure = payload?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  // 새 주소를 기본 배송지로 지정할 수 있습니다.
  const makeDefault = formData.get('makeDefault') === 'on';
  const addressId = payload?.customerAddress?.id ?? id;
  if (makeDefault && addressId) {
    await customerFetch(DEFAULT_ADDRESS_UPDATE, { customerAccessToken: token, addressId });
  }

  revalidatePath('/account');
  return { ok: true, message: '배송지를 저장했습니다.' };
}

export async function deleteAddress(formData: FormData): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: '로그인이 필요합니다.' };

  const id = String(formData.get('id') || '');
  if (!id) return { ok: false, message: '삭제할 배송지를 찾지 못했습니다.' };

  const { data, errors } = await customerFetch(ADDRESS_DELETE, {
    customerAccessToken: token,
    id,
  });

  if (errors?.length) return { ok: false, message: '배송지를 삭제하지 못했습니다.' };

  const failure = data?.customerAddressDelete?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  revalidatePath('/account');
  return { ok: true, message: '배송지를 삭제했습니다.' };
}

export async function setDefaultAddress(formData: FormData): Promise<ActionResult> {
  const token = await getSessionToken();
  if (!token) return { ok: false, message: '로그인이 필요합니다.' };

  const addressId = String(formData.get('id') || '');
  if (!addressId) return { ok: false, message: '배송지를 찾지 못했습니다.' };

  const { data, errors } = await customerFetch(DEFAULT_ADDRESS_UPDATE, {
    customerAccessToken: token,
    addressId,
  });

  if (errors?.length) return { ok: false, message: '기본 배송지를 바꾸지 못했습니다.' };

  const failure = data?.customerDefaultAddressUpdate?.customerUserErrors?.[0];
  if (failure) return { ok: false, message: humanizeError(failure) };

  revalidatePath('/account');
  return { ok: true, message: '기본 배송지를 변경했습니다.' };
}
