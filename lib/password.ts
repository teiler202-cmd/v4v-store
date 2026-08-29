/**
 * 비밀번호 정책.
 * 클라이언트(즉시 안내)와 서버 액션(최종 검증)이 같은 규칙을 씁니다.
 * 클라이언트 검사는 안내용일 뿐이므로, 서버에서 반드시 한 번 더 확인합니다.
 */

export const PASSWORD_MIN = 10;

/** 흔히 쓰여 바로 뚫리는 비밀번호는 막습니다 */
const COMMON = [
  'password', 'passw0rd', '12345678', '123456789', '1234567890',
  'qwerty', 'qwertyuiop', 'iloveyou', 'admin123', 'letmein',
  'welcome1', 'abcd1234', 'a1234567', 'p@ssword', 'shopify',
  'vision4visionary', 'v4vstore',
];

export type PasswordCheck = {
  id: 'length' | 'variety' | 'personal' | 'common';
  label: { en: string; ko: string };
  passed: boolean;
};

export type PasswordAssessment = {
  ok: boolean;
  /** 0–4 */
  score: number;
  checks: PasswordCheck[];
  message: string | null;
};

function varietyCount(password: string) {
  let types = 0;
  if (/[a-z]/.test(password)) types++;
  if (/[A-Z]/.test(password)) types++;
  if (/[0-9]/.test(password)) types++;
  if (/[^A-Za-z0-9]/.test(password)) types++;
  return types;
}

export function assessPassword(
  password: string,
  context: { email?: string; firstName?: string; lastName?: string } = {}
): PasswordAssessment {
  const value = password ?? '';
  const lower = value.toLowerCase();

  const longEnough = value.length >= PASSWORD_MIN;
  const varied = varietyCount(value) >= 3;

  const personalBits = [
    context.email?.split('@')[0],
    context.firstName,
    context.lastName,
  ]
    .filter((bit): bit is string => Boolean(bit && bit.length >= 3))
    .map((bit) => bit.toLowerCase());

  const noPersonal = value.length > 0 && !personalBits.some((bit) => lower.includes(bit));
  const notCommon =
    value.length > 0 && !COMMON.some((bad) => lower.includes(bad)) && !/^(.)\1+$/.test(value);

  const checks: PasswordCheck[] = [
    {
      id: 'length',
      label: { en: `At least ${PASSWORD_MIN} characters`, ko: `${PASSWORD_MIN}자 이상` },
      passed: longEnough,
    },
    {
      id: 'variety',
      label: {
        en: '3 of: lowercase, uppercase, number, symbol',
        ko: '소문자·대문자·숫자·기호 중 3종 이상',
      },
      passed: varied,
    },
    {
      id: 'personal',
      label: { en: 'Not your name or email', ko: '이름·이메일과 다르게' },
      passed: noPersonal,
    },
    {
      id: 'common',
      label: { en: 'Not a commonly used password', ko: '흔한 비밀번호가 아닐 것' },
      passed: notCommon,
    },
  ];

  const passed = checks.filter((check) => check.passed).length;
  // 아주 긴 비밀번호는 조합이 단순해도 실제로 강합니다.
  const bonus = value.length >= 16 ? 1 : 0;
  const score = Math.min(4, passed === 0 ? 0 : passed - 1 + bonus);

  const failed = checks.find((check) => !check.passed);
  const ok = checks.every((check) => check.passed);

  return {
    ok,
    score,
    checks,
    message: ok ? null : failed ? `${failed.label.ko} — ${failed.label.en}` : null,
  };
}
