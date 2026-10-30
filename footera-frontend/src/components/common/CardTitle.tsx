import type { PropsWithChildren } from 'react';

export function CardTitle({ children }: PropsWithChildren) {
  return <h2 className="card-title text-base font-bold tracking-tight">{children}</h2>;
}
