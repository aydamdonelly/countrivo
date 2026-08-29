import { Button, FadeBar, Header, PageTitle, TabBar } from "@/ui";

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
        <PageTitle title="Not on the map" />
        <p className="t-body" style={{ color: "var(--color-mute)" }}>
          That page does not exist.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <Button href="/" prefetch>
            Home
          </Button>
          <Button variant="text" href="/games" prefetch>
            All games
          </Button>
        </div>
      </div>
      <FadeBar />
      <TabBar />
    </>
  );
}
