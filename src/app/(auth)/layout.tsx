import type { ReactNode } from "react";
import { Wordmark } from "@/ui";

/*
 * The auth pages (blueprint 7.17, 9.1 step 9): the wordmark only, no tab bar, a 440 px
 * column that is the full width on phones. Static; the forms use the browser client.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="frame">
      <header className="hd">
        <Wordmark />
      </header>
      <div className="mx-auto w-full max-w-[440px]">{children}</div>
    </div>
  );
}
