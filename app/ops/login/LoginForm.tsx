'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signIn } from '../actions';

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 h-11 w-full rounded bg-ink font-mono text-[11px] uppercase tracking-[0.15em] text-paper transition-opacity disabled:opacity-40"
    >
      {pending ? '확인 중' : '들어가기'}
    </button>
  );
}

export default function LoginForm() {
  const [state, action] = useActionState(signIn, null);

  return (
    <form action={action} className="mt-8 flex flex-col gap-3">
      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ash">이메일</span>
        <input
          name="email"
          type="email"
          required
          autoComplete="username"
          autoFocus
          className="h-11 rounded border border-line bg-paper px-3 text-[13px] outline-none focus:border-ink"
        />
      </label>

      <label className="flex flex-col gap-1">
        <span className="font-mono text-[9px] uppercase tracking-[0.15em] text-ash">비밀번호</span>
        <input
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="h-11 rounded border border-line bg-paper px-3 text-[13px] outline-none focus:border-ink"
        />
      </label>

      {state?.message ? (
        <p role="alert" className="font-mono text-[10px] leading-[1.8] text-[#b42318]">
          {state.message}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}
