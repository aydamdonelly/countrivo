#!/usr/bin/env python3
"""Export Google Search Console comparisons using existing gcloud credentials.

Read-only API access; Python standard library only. Never writes credentials.
https://developers.google.com/webmaster-tools/v1/searchanalytics/query
"""

import argparse
from concurrent.futures import ThreadPoolExecutor
from datetime import date, timedelta
import json
import os
from pathlib import Path
import subprocess
import sys
from urllib.error import HTTPError
from urllib.parse import quote
from urllib.request import Request, urlopen


def parse_args():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--property", default="sc-domain:countrivo.com")
    parser.add_argument("--days", type=int, default=28)
    parser.add_argument(
        "--end-date", type=date.fromisoformat,
        default=date.today() - timedelta(days=3),
        help="Inclusive PT date, YYYY-MM-DD; defaults to three days ago.",
    )
    parser.add_argument("--page", default="/games/geo-wordle", help="Page URL substring to analyze.")
    parser.add_argument("--credentials", type=Path, help="Existing Google service-account JSON file.")
    parser.add_argument(
        "--output-dir", type=Path,
        default=Path("/tmp") / f"countrivo-search-console-{date.today()}",
    )
    args = parser.parse_args()
    if not 1 <= args.days <= 240:
        parser.error("--days must be between 1 and 240, allowing both periods within GSC retention.")
    if not args.page:
        parser.error("--page must not be empty.")
    return args


def access_token(credentials):
    env = os.environ.copy()
    fallback = Path.home() / ".config/countrivo-seo/gsc-sa.json"
    if credentials:
        if not credentials.is_file():
            raise RuntimeError("The --credentials file does not exist.")
        env["GOOGLE_APPLICATION_CREDENTIALS"] = str(credentials.resolve())
    elif not env.get("GOOGLE_APPLICATION_CREDENTIALS") and fallback.is_file():
        env["GOOGLE_APPLICATION_CREDENTIALS"] = str(fallback)
    try:
        result = subprocess.run(
            ["gcloud", "auth", "application-default", "print-access-token",
             "--scopes=https://www.googleapis.com/auth/webmasters.readonly", "--quiet"],
            env=env, capture_output=True, text=True, timeout=60, check=False,
        )
    except FileNotFoundError as error:
        raise RuntimeError("gcloud is required. Use an existing Google Cloud CLI installation.") from error
    if result.returncode or not result.stdout.strip():
        raise RuntimeError(
            "Google authentication failed. Supply --credentials or configure existing "
            "gcloud application-default credentials with Search Console read access."
        )
    return result.stdout.strip()


def metric_cells(row):
    if not row:
        return "0 | 0 | — | —"
    return (f"{row['clicks']:,.0f} | {row['impressions']:,.0f} | "
            f"{row['ctr']:.2%} | {row['position']:.2f}")


def make_report(args, periods, exports):
    lines = [
        f"# Search Console: {args.property}", "",
        f"Web search, finalized data, inclusive Pacific Time dates. Page filter: `{args.page}`.", "",
        "| Scope / period | Clicks | Impressions | CTR | Position |",
        "| --- | ---: | ---: | ---: | ---: |",
    ]
    for scope in ("site", "page"):
        for period, (start, end) in periods.items():
            rows = exports[f"{period}_{scope}_totals"]["response"].get("rows", [])
            lines.append(f"| {scope}: {start} – {end} | {metric_cells(rows[0] if rows else None)} |")
    for scope, dimension in (("site", "query"), ("site", "page"), ("page", "query"),
                             ("page", "device"), ("page", "country")):
        lines += ["", f"## Current {scope}: {dimension}", "",
                  f"| {dimension.title()} | Clicks | Impressions | CTR | Position |",
                  "| --- | ---: | ---: | ---: | ---: |"]
        rows = exports[f"current_{scope}_{dimension}"]["response"].get("rows", [])
        for row in sorted(rows, key=lambda item: item["impressions"], reverse=True)[:25]:
            label = " / ".join(row["keys"]).replace("|", "\\|").replace("\n", " ")
            lines.append(f"| {label} | {metric_cells(row)} |")
    lines += [
        "", "## Data limits", "",
        "GSC omits anonymized queries and returns top rows subject to internal limits. "
        "Each export requests up to 25,000 rows. Grouped and filtered breakdowns can omit "
        "data and need not sum to totals. Site totals aggregate by property; page totals "
        "aggregate by canonical page. CTR and average position alone do not establish why users click.",
        "", "Only final data is requested. Choose an end date before the latest incomplete "
        "day in GSC; requesting a newer date can leave the current period incomplete.",
        "", "[Google API reference](https://developers.google.com/webmaster-tools/v1/searchanalytics/query)",
        "",
    ]
    return "\n".join(lines)


def main():
    args = parse_args()
    token = access_token(args.credentials)
    endpoint = ("https://www.googleapis.com/webmasters/v3/sites/"
                + quote(args.property, safe="") + "/searchAnalytics/query")
    start = args.end_date - timedelta(days=args.days - 1)
    periods = {
        "current": (start.isoformat(), args.end_date.isoformat()),
        "previous": ((start - timedelta(days=args.days)).isoformat(),
                     (start - timedelta(days=1)).isoformat()),
    }
    tasks = []
    for period, (start_date, end_date) in periods.items():
        for scope in ("site", "page"):
            for dimensions in ([], ["query"], ["page"], ["device"], ["country"], ["date"]):
                body = {"startDate": start_date, "endDate": end_date, "dimensions": dimensions,
                        "type": "web", "dataState": "final", "rowLimit": 25000}
                if scope == "page":
                    body["dimensionFilterGroups"] = [{"filters": [{
                        "dimension": "page", "operator": "contains", "expression": args.page,
                    }]}]
                name = f"{period}_{scope}_{'-'.join(dimensions) or 'totals'}"
                tasks.append((name, body))
    args.output_dir.mkdir(parents=True, exist_ok=True)

    def fetch(task):
        name, body = task
        request = Request(endpoint, data=json.dumps(body).encode(), headers={
            "Authorization": f"Bearer {token}", "Content-Type": "application/json",
        })
        try:
            with urlopen(request, timeout=60) as response:
                data = json.load(response)
        except HTTPError as error:
            raise RuntimeError(f"Search Console returned HTTP {error.code} for {name}.") from error
        export = {"property": args.property, "request": body, "response": data}
        (args.output_dir / f"{name}.json").write_text(json.dumps(export, indent=2) + "\n")
        return name, export

    with ThreadPoolExecutor(max_workers=4) as pool:
        exports = dict(pool.map(fetch, tasks))
    (args.output_dir / "report.md").write_text(make_report(args, periods, exports))
    print(f"Saved {len(exports)} JSON exports and report.md to {args.output_dir.resolve()}")


if __name__ == "__main__":
    try:
        main()
    except (RuntimeError, OSError, subprocess.TimeoutExpired) as error:
        print(f"Error: {error}", file=sys.stderr)
        sys.exit(1)
