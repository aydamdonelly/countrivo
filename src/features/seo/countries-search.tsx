"use client";

import { useCallback, useEffect, useRef } from "react";
import { Field } from "@/ui";
import { COUNTRIES_HUB } from "@/content/hubs";

/**
 * The countries filter (blueprint 7.8): every one of the 243 rows is in the server HTML
 * and visible; typing only ever hides rows that do not match, and clearing the field puts
 * them all back. The server never reads `q`, so the page stays static; the field reads it
 * once on mount so a shared /countries?q=ja link lands on the same view. The count line is
 * written straight to the DOM, so the filter holds no React state and re-renders nothing.
 */
export function CountriesSearch({ total }: { total: number }) {
  const field = useRef<HTMLInputElement>(null);
  const count = useRef<HTMLParagraphElement>(null);

  const apply = useCallback(
    (raw: string) => {
      const index = document.getElementById("country-index");
      if (!index) return;
      const query = fold(raw);
      let matches = 0;

      for (const group of Array.from(index.querySelectorAll<HTMLElement>("section[id]"))) {
        let shown = 0;
        for (const row of Array.from(group.querySelectorAll<HTMLElement>("a.row"))) {
          const name = fold(row.querySelector(".title")?.textContent ?? "");
          const capital = fold(row.querySelector("small")?.textContent ?? "");
          if (query === "" || name.includes(query) || capital.includes(query)) {
            row.removeAttribute("data-hide");
            shown += 1;
          } else {
            row.setAttribute("data-hide", "");
          }
        }
        if (shown === 0 && query !== "") group.setAttribute("data-hide", "");
        else group.removeAttribute("data-hide");
        matches += shown;
      }

      if (count.current) {
        count.current.textContent =
          query === ""
            ? ""
            : matches === 0
              ? "No country or capital matches that."
              : `${matches} of ${total}`;
      }
    },
    [total],
  );

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q");
    if (!q) return;
    if (field.current) field.current.value = q;
    apply(q);
  }, [apply]);

  return (
    <div className="cx-search">
      <Field
        id="country-search"
        ref={field}
        label="Search countries"
        hideLabel
        type="search"
        autoComplete="off"
        enterKeyHint="search"
        placeholder={COUNTRIES_HUB.searchPlaceholder}
        onChange={(e) => apply(e.currentTarget.value)}
      />
      <p ref={count} className="t-meta cx-count" aria-live="polite" />
    </div>
  );
}

/** Lowercase and strip diacritics so "cote" finds "Côte d'Ivoire". */
function fold(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
