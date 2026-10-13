import type { Metadata } from "next";
import { portraitCredits } from "@/lib/data/loader";
import { SiteFoot } from "@/ui/site-foot";
import { PageTitle } from "@/ui";


export const metadata: Metadata = {
  title: { absolute: "Picture credits | Countrivo" },
  description: "Every portrait in Country Draft, with its licence and the person who made it.",
  alternates: { canonical: "/credits" },
  robots: { index: false, follow: true },
};

/**
 * The people on the draft board are real, so their pictures are real too: freely licensed
 * images from Wikimedia Commons. This page names every one of them and its licence, which
 * is both the honest thing and what the licences ask for.
 */
export default function CreditsPage() {
  const rows = Object.values(portraitCredits).sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <PageTitle title="Picture credits" meta={`${rows.length} portraits`} />
      <p className="t-body prose-lead">
        Country Draft draws real people, so it shows real pictures: portraits from Wikimedia
        Commons that are in the public domain or under a Creative Commons licence. Where no
        free portrait exists we draw a monogram rather than invent a likeness.
      </p>
      <ul className="credits">
        {rows.map((c) => (
          <li key={c.slug}>
            <b className="t-list">{c.title}</b>
            <small className="t-meta">
              {c.author}
              {c.author && c.licence ? " · " : ""}
              {c.licence}{" "}
              <a href={c.url} rel="noreferrer nofollow" target="_blank">
                source
              </a>
            </small>
          </li>
        ))}
      </ul><section className="mt-8"><h2 className="t-h2 mb-4">Clay illustrations</h2><p className="t-body">The handmade-looking game objects are generated clay illustrations. They do not depict real artefacts or photographs. Country flags and portraits keep their original source identities.</p></section><SiteFoot />
    </>
  );
}
