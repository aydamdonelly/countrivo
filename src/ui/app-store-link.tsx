import { APP_STORE_URL } from "@/lib/seo/site";
import { ArrowUpRightIcon } from "@/ui/icons/arrow-up-right";
import { cn } from "@/lib/utils";

/**
 * A quiet, visible link to the Countrivo iPhone app. Server rendered, so it is in the
 * first HTML for people and crawlers alike. Inside the iOS app the root element carries
 * `data-native` (set by NativeBootstrap) and ui.css hides it there.
 */
export function AppStoreLink({ className }: { className?: string }) {
  return (
    <a className={cn("app-store-link t-meta", className)} href={APP_STORE_URL} rel="noopener">
      Also on iPhone: Countrivo on the App Store
      <ArrowUpRightIcon size={16} />
    </a>
  );
}
