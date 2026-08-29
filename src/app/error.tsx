"use client";

import { useEffect } from "react";
import { Button, FadeBar, Header, PageTitle, TabBar } from "@/ui";

/*
 * The route error boundary (blueprint 7.18): "Something went wrong", Try again, Home. It
 * replaces the route-group layout it caught, so it carries the static chrome itself.
 */
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <>
      <div className="frame frame-bar">
        <Header variant="static" />
        <PageTitle title="Something went wrong" />
        <p className="t-body" style={{ color: "var(--color-mute)" }}>
          Something broke on this page. Try again, or head home.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="text" href="/">
            Home
          </Button>
        </div>
      </div>
      <FadeBar />
      <TabBar />
    </>
  );
}
