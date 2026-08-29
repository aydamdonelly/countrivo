import Link from "next/link";
import { EditorialHead, PageTitle, Prose, QaList, SiteFoot } from "@/ui";
import { SUPPORT_EMAIL, type LegalPageCopy } from "@/content/hubs";
import "./seo.css";

/**
 * /privacy and /terms (blueprint 7.18): a title, one lead line, then plain sections. No
 * card, no rules, no columns; the type carries the hierarchy.
 */
export function LegalPage({ copy }: { copy: LegalPageCopy }) {
  return (
    <>
      <PageTitle title={copy.h1} meta={copy.lead} />
      {copy.sections.map((section) => (
        <section key={section.h2}>
          <EditorialHead title={section.h2} />
          <Prose paragraphs={section.paragraphs} />
        </section>
      ))}
      <p className="t-body mail-line">
        Questions go to{" "}
        <a href={`mailto:${SUPPORT_EMAIL}`} className="ilink">
          {SUPPORT_EMAIL}
        </a>
        .
      </p>
      <SiteFoot />
    </>
  );
}

/**
 * /support (blueprint 7.18): the same frame, with the five answers as real details
 * controls that open without JavaScript.
 */
export function SupportPage({
  copy,
}: {
  copy: { h1: string; faq: readonly { q: string; a: string }[] };
}) {
  return (
    <>
      <PageTitle
        title={copy.h1}
        meta={
          <>
            Write to{" "}
            <a href={`mailto:${SUPPORT_EMAIL}`} className="ilink">
              {SUPPORT_EMAIL}
            </a>{" "}
            and we answer.
          </>
        }
      />
      <QaList open="details" items={copy.faq.map((f) => ({ q: f.q, a: f.a }))} />
      <p className="t-body mail-line">
        See also <Link href="/privacy" className="ilink">Privacy</Link> and <Link href="/terms" className="ilink">Terms</Link>.
      </p>
      <SiteFoot />
    </>
  );
}
