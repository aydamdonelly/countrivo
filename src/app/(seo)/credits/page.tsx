import type { Metadata } from "next";
import credits from "@/data/figure-credits.json";
import { PageTitle } from "@/ui";

interface Credit { slug: string; title: string; file: string; licence: string; author: string; url: string }

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
  const rows = (Object.values(credits) as Credit[]).sort((a, b) => a.title.localeCompare(b.title));
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
      </ul>
    </>
  );
}
