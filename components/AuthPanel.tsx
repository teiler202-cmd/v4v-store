'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { requestPasswordReset, signIn, signUp } from '@/app/account/actions';
import { useAccount } from '@/components/AccountProvider';
import Bilingual from '@/components/Bilingual';
import { SILK } from '@/components/Reveal';
import { assessPassword } from '@/lib/password';

type Mode = 'signin' | 'signup' | 'recover';

const MODES: { key: Mode; en: string; ko: string }[] = [
  { key: 'signin', en: 'Sign in', ko: '로그인' },
  { key: 'signup', en: 'Create account', ko: '회원가입' },
];

const field =
  'w-full border-0 border-b border-line bg-transparent pb-2.5 pt-1 font-grotesk text-[14px] tracking-[-0.015em] text-ink outline-none transition-colors duration-500 placeholder:text-ash/50 focus:border-ink';
const labelClass = 'font-mono text-[8.5px] uppercase tracking-[0.18em] text-ash';

function StrengthMeter({
  password,
  email,
  firstName,
  lastName,
}: {
  password: string;
  email: string;
  firstName: string;
  lastName: string;
}) {
  const assessment = useMemo(
    () => assessPassword(password, { email, firstName, lastName }),
    [password, email, firstName, lastName]
  );

  if (!password) return null;

  return (
    <div className="flex flex-col gap-3 pt-1">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={`h-px flex-1 transition-colors duration-500 ease-silk ${
              i < assessment.score ? 'bg-ink' : 'bg-line'
            }`}
          />
        ))}
      </div>

      <ul className="flex flex-col gap-1.5">
        {assessment.checks.map((check) => (
          <li key={check.id} className="flex items-start gap-2">
            <span
              aria-hidden
              className={`mt-[5px] h-[3px] w-[3px] shrink-0 rounded-full transition-colors duration-500 ${
                check.passed ? 'bg-ink' : 'bg-line'
              }`}
            />
            <Bilingual
              en={check.label.en}
              ko={check.label.ko}
              className={`font-mono text-[8px] uppercase leading-[1.7] tracking-[0.1em] transition-colors duration-500 ${
                check.passed ? 'text-ink' : 'text-ash'
              }`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AuthPanel({ next }: { next: string }) {
  const [mode, setMode] = useState<Mode>('signin');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // 비밀번호 안내를 실시간으로 보여주기 위해 몇 개만 상태로 둡니다.
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const router = useRouter();
  const { refresh } = useAccount();

  const reset = (nextMode: Mode) => {
    setMode(nextMode);
    setError(null);
    setNotice(null);
  };

  const submit = (formData: FormData) => {
    setError(null);
    setNotice(null);

    startTransition(async () => {
      const action = mode === 'signin' ? signIn : mode === 'signup' ? signUp : requestPasswordReset;
      const result = await action(formData);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (mode === 'recover') {
        setNotice(result.message ?? '메일을 보냈습니다.');
        return;
      }

      await refresh();
      // 서버가 이미 걸렀지만, 클라이언트에서도 한 번 더 내부 경로인지 확인합니다.
      router.replace(next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/account');
      router.refresh();
    });
  };

  return (
    <div className="mx-auto w-full max-w-[390px]">
      {/* 모드 전환 */}
      <div className="mb-11 flex items-start justify-center gap-9">
        {MODES.map(({ key, en, ko }) => {
          const on = mode === key || (mode === 'recover' && key === 'signin');
          return (
            <button
              key={key}
              type="button"
              onClick={() => reset(key)}
              className={`group relative pb-1.5 transition-colors duration-500 ease-silk ${
                on ? 'text-ink' : 'text-ash hover:text-ink'
              }`}
            >
              <Bilingual
                en={en}
                ko={ko}
                className="font-mono text-[9px] uppercase tracking-[0.18em]"
              />
              <span
                className={`absolute bottom-0 left-0 h-px w-full origin-left bg-ink transition-transform duration-[600ms] ease-silk ${
                  on ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.form
          key={mode}
          action={submit}
          initial={{ opacity: 0, y: 12, filter: 'blur(5px)' }}
          animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
          exit={{ opacity: 0, y: -8, filter: 'blur(5px)' }}
          transition={{ duration: 0.55, ease: SILK }}
          className="flex flex-col gap-7"
        >
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-5">
              <div className="flex flex-col gap-2">
                <Bilingual en="First name" ko="이름" inline className={labelClass} />
                <input
                  name="firstName"
                  className={field}
                  autoComplete="given-name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="flex flex-col gap-2">
                <Bilingual en="Last name" ko="성" inline className={labelClass} />
                <input
                  name="lastName"
                  className={field}
                  autoComplete="family-name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Bilingual en="Email" ko="이메일" inline className={labelClass} />
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={field}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {mode !== 'recover' && (
            <div className="flex flex-col gap-2">
              <Bilingual en="Password" ko="비밀번호" inline className={labelClass} />
              <input
                name="password"
                type="password"
                required
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                className={field}
                placeholder="••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {mode === 'signup' && (
                <StrengthMeter
                  password={password}
                  email={email}
                  firstName={firstName}
                  lastName={lastName}
                />
              )}
            </div>
          )}

          {mode === 'signup' && (
            <label className="flex cursor-pointer items-start gap-3 pt-1">
              <input
                type="checkbox"
                name="acceptsMarketing"
                className="mt-1 h-3 w-3 shrink-0 appearance-none border border-line bg-paper transition-colors duration-300 checked:border-ink checked:bg-ink"
              />
              <Bilingual
                en="Send me new releases and archive notes (optional)"
                ko="신제품 · 아카이브 소식 메일 수신에 동의합니다 (선택)"
                className="font-mono text-[8.5px] uppercase leading-[1.75] tracking-[0.1em] text-ash"
              />
            </label>
          )}

          {error && (
            <p className="font-mono text-[9px] uppercase leading-[1.8] tracking-[0.08em] text-ink">
              {error}
            </p>
          )}
          {notice && (
            <p className="font-mono text-[9px] uppercase leading-[1.8] tracking-[0.08em] text-ash">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full bg-ink py-4 text-paper transition-opacity duration-500 ease-silk hover:opacity-80 disabled:opacity-40"
          >
            <Bilingual
              en={pending ? 'Please wait' : mode === 'signin' ? 'Sign in' : mode === 'signup' ? 'Create account' : 'Send reset link'}
              ko={pending ? '잠시만요' : mode === 'signin' ? '로그인' : mode === 'signup' ? '가입하기' : '재설정 메일 받기'}
              inline
              className="justify-center font-mono text-[9.5px] uppercase tracking-[0.22em]"
            />
          </button>

          <button
            type="button"
            onClick={() => reset(mode === 'recover' ? 'signin' : 'recover')}
            className="mx-auto text-ash transition-colors duration-500 hover:text-ink"
          >
            <Bilingual
              en={mode === 'recover' ? '← Back to sign in' : 'Forgot your password?'}
              ko={mode === 'recover' ? '← 로그인으로 돌아가기' : '비밀번호를 잊으셨나요?'}
              inline
              className="justify-center font-mono text-[8.5px] uppercase tracking-[0.14em]"
            />
          </button>
        </motion.form>
      </AnimatePresence>
    </div>
  );
}
