'use client';

import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';

export type BriefCustomer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string | null;
  email: string;
};

type AccountContextValue = {
  customer: BriefCustomer | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AccountContext = createContext<AccountContextValue>({
  customer: null,
  loading: true,
  refresh: async () => {},
});

export function AccountProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<BriefCustomer | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/account/session', { cache: 'no-store' });
      const data = await res.json();
      setCustomer(data.customer ?? null);
    } catch {
      setCustomer(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 로그인 상태는 서버 쿠키(httpOnly)에만 있으므로 마운트 직후 한 번 물어봅니다.
  useEffect(() => {
    // 실제 setState는 fetch가 끝난 뒤에 일어납니다(동기 렌더 연쇄가 아닙니다).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
  }, [refresh]);

  return (
    <AccountContext.Provider value={{ customer, loading, refresh }}>
      {children}
    </AccountContext.Provider>
  );
}

export const useAccount = () => useContext(AccountContext);
