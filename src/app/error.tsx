"use client";

import { Clay } from "@/ui/clay";
import { useEffect } from "react";
import { Button } from "@/ui/button";
import { Header } from "@/ui/header";
import { PageTitle } from "@/ui/page-title";

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
        <div className="system-page"><Clay object="cl-24" state="americas" /><PageTitle title="Something broke on our side." />
        <p className="t-body" style={{ color: "var(--color-mute)" }}>
          Your saved moves are kept. Try again to continue.
        </p>
        <div className="flex flex-wrap items-center gap-4 mt-6">
          <Button onClick={() => reset()}>Try again</Button>
          <Button variant="text" href="/">
            Home
          </Button>
        </div>
      </div></div>
    </>
  );
}
