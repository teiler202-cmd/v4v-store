import LoginForm from './LoginForm';
import { hasOpsConfig } from '@/lib/ops/db';

export const metadata = { title: '로그인' };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[380px] flex-col justify-center px-6">
      <p className="font-mono text-[8.5px] uppercase tracking-[0.2em] text-ash">
        Vision for Visionary
      </p>
      <h1 className="mt-2 font-grotesk text-[22px] font-bold tracking-[-0.03em]">운영 보드</h1>

      {hasOpsConfig() ? (
        <LoginForm />
      ) : (
        <p className="mt-8 rounded border border-line bg-paper p-4 font-mono text-[11px] leading-[1.9] text-ash">
          아직 데이터베이스가 연결되지 않았습니다.
          <br />
          <code className="text-ink">OPS_DATABASE_URL</code> 과{' '}
          <code className="text-ink">OPS_SESSION_SECRET</code> 을 <code>.env.local</code> 에
          넣어 주세요. 설정 방법은 저장소의 <code>ops-migration/README.md</code> 에 있습니다.
        </p>
      )}
    </div>
  );
}
