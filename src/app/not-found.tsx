import { Button } from "@/ui/button";
import { Header } from "@/ui/header";
import { PageTitle } from "@/ui/page-title";
import { Clay } from "@/ui/clay";

/*
 * The 404 (blueprint 7.18): the static chrome, "Not on the map", one line, Home and All
 * games. Rendered for unmatched URLs and for every notFound() in the tree; it carries its
 * own chrome because the root layout renders none.
 */
export default function NotFound() {
  return (
    <>
      <div className="frame frame-bar">
        <Header variant="static" />
        <div className="system-page"><Clay object="cl-24" state="americas" alternate="afreu" /><PageTitle title="No country at this address." />
        <p className="t-body" style={{ color: "var(--color-mute)" }}>
          The page you wanted is not on our map.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <Button href="/" prefetch>
            Home
          </Button>
          <Button variant="text" href="/games" prefetch>
            All games
          </Button>
        </div>
      </div></div>
    </>
  );
}
