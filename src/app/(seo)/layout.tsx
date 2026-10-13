import type { ReactNode } from 'react';
import { Header } from '@/ui/header';
export default function SeoLayout({ children }: { children: ReactNode }) {
  return <div className="frame table-frame"><Header variant="static" />{children}</div>;
}
