#!/usr/bin/env python3
"""The monthly Countrivo numbers in one folder: Search Console plus stored play.

Writes reports/<date>/summary.md (the page to read), the Search Console export from
search-console-report.py under reports/<date>/search-console/, and posts a macOS
notification. The Orca automation "Countrivo Monatsbericht" runs it on the 1st of each
month at 09:00 and has an agent append a short German reading (launchd cannot: macOS
blocks it from ~/Desktop). Run it by hand any time with `python3 scripts/monthly-report.py`.
The Search Console key is ~/.config/countrivo-seo/gsc-sa.json, never in the repo.

Play numbers come from completed `countrivo_runs` with the dedicated server key
in .env.local. They cover the account-free relaunch only: browser/device identities
are not people, old account records are separate, and labelled bot rows are excluded.
Vercel Analytics > Events has no API on this plan. Python 3.9 standard library only;
read-only everywhere.
"""

from collections import Counter
from datetime import date, datetime, timedelta, timezone
import json
from pathlib import Path
import subprocess
import sys
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parent.parent
DAYS = 28


def env_value(name):
    for line in (ROOT / ".env.local").read_text().splitlines():
        key, _, value = line.partition("=")
        if key.strip() == name:
            return value.strip().strip('"').strip("'")
    raise RuntimeError(f"{name} is missing from .env.local")


def fetch_runs():
    base = env_value("NEXT_PUBLIC_SUPABASE_URL").rstrip("/")
    service = env_value("COUNTRIVO_SUPABASE_SERVICE_KEY")
    headers = {"apikey": service, "Authorization": f"Bearer {service}"}
    runs, offset = [], 0
    while True:
        query = urlencode({
            "select": "device_id,game_slug,mode,date_key,completed_at,display_name",
            "status": "eq.complete",
            "order": "completed_at.asc", "limit": 1000, "offset": offset,
        })
        with urlopen(Request(f"{base}/rest/v1/countrivo_runs?{query}", headers=headers), timeout=60) as r:
            page = json.load(r)
        runs.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    names = {}
    for run in runs:
        if run.get("display_name"):
            names[run["device_id"]] = run["display_name"]
    return runs, names


def stamp(run):
    # Python 3.9 parses only 0, 3 or 6 fractional digits; Postgres trims trailing zeros.
    raw = run["completed_at"].replace("Z", "+00:00")
    head, plus, zone = raw.rpartition("+")
    whole, dot, frac = head.partition(".")
    if dot:
        head = f"{whole}.{frac[:6].ljust(6, '0')}"
    return datetime.fromisoformat(f"{head}{plus}{zone}")


def play_section(runs, names, since):
    recent = [r for r in runs if stamp(r) >= since]
    first_seen = {}
    for r in runs:
        first_seen.setdefault(r["device_id"], stamp(r))
    new_devices = sum(1 for t in first_seen.values() if t >= since)
    devices = Counter(r["device_id"] for r in recent)
    games = Counter(r["game_slug"] for r in recent)
    lines = [
        f"## Stored play, last {DAYS} days",
        "",
        f"- **{len(recent)} completed runs** on **{len(devices)} devices** ({new_devices} first seen). "
        f"Since the account-free relaunch: {len(runs)} runs on {len(first_seen)} devices.",
        f"- Daily {sum(1 for r in recent if r['mode'] == 'daily')}, "
        f"practice {sum(1 for r in recent if r['mode'] != 'daily')}.",
        f"- {sum(1 for r in recent if r.get('display_name'))} runs have an optional public name.",
        "- Device counts are browser identities, not a count of people. Old account data and simulated bots are excluded.",
    ]
    if games:
        lines.append("- Games: " + ", ".join(f"{g} {n}" for g, n in games.most_common()) + ".")
    named_devices = [(device, count) for device, count in devices.most_common() if device in names]
    if named_devices:
        lines.append("- Optional names on active devices: " + ", ".join(
            f"{names[device]} {count}" for device, count in named_devices[:10]) + ".")
    return lines


def search_section(out_dir):
    report = out_dir / "report.md"
    if not report.is_file():
        return ["## Search Console", "", "Export failed; see search-console.log."]
    rows = [l for l in report.read_text().splitlines() if l.startswith("| site:")]
    lines = ["## Google Search, last 28 days against the 28 before", "",
             "| Period | Clicks | Impressions | CTR | Position |", "| --- | ---: | ---: | ---: | ---: |"]
    lines += [row.replace("| site: ", "| ", 1) for row in rows]
    lines += ["", "Top queries and pages: `search-console/report.md`."]
    return lines


def notify(text):
    script = f'display notification "{text}" with title "Countrivo monthly report"'
    subprocess.run(["osascript", "-e", script], check=False, capture_output=True)


def main():
    today = date.today()
    out = ROOT / "reports" / today.isoformat()
    gsc = out / "search-console"
    gsc.mkdir(parents=True, exist_ok=True)
    with open(out / "search-console.log", "w") as log:
        subprocess.run(
            [sys.executable, str(ROOT / "scripts/search-console-report.py"), "--days", str(DAYS),
             "--page", "/games/country-draft", "--output-dir", str(gsc)],
            stdout=log, stderr=subprocess.STDOUT, check=False, timeout=600,
        )
    lines = [f"# Countrivo, {today.strftime('%B %Y')}", ""]
    lines += search_section(gsc) + [""]
    try:
        runs, names = fetch_runs()
        since = datetime.now(timezone.utc) - timedelta(days=DAYS)
        lines += play_section(runs, names, since)
    except Exception as error:  # noqa: BLE001 - the report still ships its search half
        lines += ["## Stored play", "", f"Supabase read failed: {error}"]
    lines += ["", "Visitor, started-game and share counts are unavailable through an API on this Vercel plan. "
              "Check Vercel > countrivo > Analytics > Events (play_start, play_finish, run_saved, share)."]
    (out / "summary.md").write_text("\n".join(lines) + "\n")
    notify(f"Report ready in reports/{today.isoformat()}")
    print(out / "summary.md")


if __name__ == "__main__":
    main()
