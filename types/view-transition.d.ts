// Next.js가 번들링한 React에는 <ViewTransition>이 포함되어 있지만
// @types/react에는 아직 타입이 없어 여기서 보강해 줍니다.
import 'react';

declare module 'react' {
  type ViewTransitionClass = string | 'auto' | 'none';
  type ViewTransitionClassPerType = Record<string, ViewTransitionClass>;

  interface ViewTransitionProps {
    children?: React.ReactNode;
    name?: string;
    default?: ViewTransitionClass | ViewTransitionClassPerType;
    enter?: ViewTransitionClass | ViewTransitionClassPerType;
    exit?: ViewTransitionClass | ViewTransitionClassPerType;
    update?: ViewTransitionClass | ViewTransitionClassPerType;
    share?: ViewTransitionClass | ViewTransitionClassPerType;
  }

  export const ViewTransition: React.FC<ViewTransitionProps>;
}
