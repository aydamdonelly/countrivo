import type { Metadata } from "next";
import { portraitCredits } from "@/lib/data/loader";
import { SiteFoot } from "@/ui/site-foot";
import { PageTitle } from "@/ui/page-title";

interface PortraitCredit {
  slug: string;
  title: string;
  author: string;
  licence: string;
  url: string;
  attribution?: string;
  licenceNotice?: string;
  originalSource?: string;
  licenceUrl?: string;
}

export const metadata: Metadata = {
  title: { absolute: "Picture credits | Countrivo" },
  description: "Every portrait in Country Draft, with its licence and the person who made it.",
  alternates: { canonical: "/credits" },
  robots: { index: false, follow: true },
};

function portraitLicenceUrl(licence: string, source: string): string {
  if (licence === "CC0") return "https://creativecommons.org/publicdomain/zero/1.0/";
  const cc = /^CC (BY(?:-SA)?) ([\d.]+)(?: ([a-z]+))?$/.exec(licence);
  if (!cc) return `${source}#Licensing`;
  return `https://creativecommons.org/licenses/${cc[1].toLowerCase()}/${cc[2]}/${cc[3] ? `${cc[3]}/` : ""}`;
}

/**
 * The people on the draft board are real, so their pictures are real too: freely licensed
 * images from Wikimedia Commons. This page names every one of them and its licence, which
 * is both the honest thing and what the licences ask for.
 */
export default function CreditsPage() {
  const rows: PortraitCredit[] = Object.values(portraitCredits).sort((a, b) => a.title.localeCompare(b.title));
  return (
    <>
      <PageTitle title="Picture credits" meta={`${rows.length} portraits`} />
      <p className="t-body prose-lead">
        Country Draft draws real people, so it shows real pictures: portraits from Wikimedia
        Commons that are in the public domain, under a Creative Commons licence or covered by
        a source-specific reuse permission. Where no
        free portrait exists we draw a monogram rather than invent a likeness.
      </p>
      <p className="t-body prose-lead">
        Portraits are cropped to a square, resized and compressed for Countrivo. Each image
        retains its stated licence, including ShareAlike where applicable. Public-domain and
        other licence details are on the linked source page. No endorsement is implied.
      </p>
      <ul className="credits">
        {rows.map((c) => (
          <li key={c.slug}>
            <b className="t-list">{c.title}</b>
            <small className="t-meta">
              {c.author}
              {c.author && c.licence ? " · " : ""}
              <a href={c.licenceUrl ?? portraitLicenceUrl(c.licence, c.url)} rel="noreferrer nofollow" target="_blank">{c.licence}</a>{" "}
              <a href={c.url} rel="noreferrer nofollow" target="_blank">
                source
              </a>
            </small>
            {c.attribution ? <p className="t-meta">{c.attribution}{c.originalSource ? <> <a href={c.originalSource} target="_blank" rel="noreferrer">Original source</a></> : null}</p> : null}
            {c.licenceNotice ? <p className="t-meta">{c.licenceNotice}</p> : null}
          </li>
        ))}
      </ul><section className="mt-8"><h2 className="t-h2 mb-4">Flags</h2><p className="t-body">Flag artwork comes from <a href="https://github.com/lipis/flag-icons" target="_blank" rel="noreferrer">flag-icons</a>. <a href="/flags/LICENSE.txt">Copyright and MIT licence</a>.</p></section><section className="mt-8"><h2 className="t-h2 mb-4">Clay illustrations</h2><p className="t-body">The handmade-looking game objects are generated clay illustrations. They do not depict real artefacts or photographs. Country flags and portraits keep their original source identities.</p></section><section className="mt-8"><h2 className="t-h2 mb-4">Statistics</h2><p className="t-body">Country statistics, providers and reference years are listed on <a href="/sources">Data sources</a>. World Bank: World Development Indicators, with the named original providers. Data are filtered, rounded and ranked for Countrivo. <a href="https://data.worldbank.org/summary-terms-of-use" target="_blank" rel="noreferrer">World Bank terms and CC BY 4.0</a>, except where an indicator names different terms.</p><p className="t-body mt-3">Military expenditure figures from the Stockholm International Peace Research Institute (SIPRI) are withheld while their reuse permission is clarified. <a href="https://www.sipri.org/about/terms-and-conditions" target="_blank" rel="noreferrer">SIPRI usage terms</a> apply separately from the World Bank’s general data licence.</p></section><SiteFoot />
    </>
  );
}
