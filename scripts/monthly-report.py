#!/usr/bin/env python3
"""The monthly Countrivo numbers in one folder: Search Console plus stored play.

Writes reports/<date>/summary.md (the page to read), the Search Console export from
search-console-report.py under reports/<date>/search-console/, and posts a macOS
notification. The Orca automation "Countrivo Monatsbericht" runs it on the 1st of each
month at 09:00 and has an agent append a short German reading (launchd cannot: macOS
blocks it from ~/Desktop). Run it by hand any time with `python3 scripts/monthly-report.py`.
The Search Console key is ~/.config/countrivo-seo/gsc-sa.json, never in the repo.

Play numbers come from `game_runs` over PostgREST with the public anon key in
.env.local, so they cover signed-in and guest runs only. Anonymous play lives in
Vercel Analytics > Events (play_start, play_finish, run_saved, share), which has no
API on this plan. Python 3.9 standard library only; read-only everywhere.
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
    anon = env_value("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    headers = {"apikey": anon, "Authorization": f"Bearer {anon}"}
    runs, offset = [], 0
    while True:
        query = urlencode({
            "select": "user_id,game_slug,mode,daily_date,completed_at",
            "order": "completed_at.asc", "limit": 1000, "offset": offset,
        })
        with urlopen(Request(f"{base}/rest/v1/game_runs?{query}", headers=headers), timeout=60) as r:
            page = json.load(r)
        runs.extend(page)
        if len(page) < 1000:
            break
        offset += 1000
    ids = sorted({r["user_id"] for r in runs})
    names = {}
    for i in range(0, len(ids), 100):
        query = urlencode({"select": "id,username", "id": f"in.({','.join(ids[i:i + 100])})"})
        with urlopen(Request(f"{base}/rest/v1/profiles?{query}", headers=headers), timeout=60) as r:
            names.update({p["id"]: p["username"] for p in json.load(r)})
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
        first_seen.setdefault(r["user_id"], stamp(r))
    new_players = sum(1 for t in first_seen.values() if t >= since)
    players = Counter(r["user_id"] for r in recent)
    games = Counter(r["game_slug"] for r in recent)
    lines = [
        f"## Stored play, last {DAYS} days",
        "",
        f"- **{len(recent)} runs** by **{len(players)} players** ({new_players} new). "
        f"All time: {len(runs)} runs by {len(first_seen)} players.",
        f"- Daily {sum(1 for r in recent if r['mode'] == 'daily')}, "
        f"practice {sum(1 for r in recent if r['mode'] != 'daily')}.",
    ]
    if games:
        lines.append("- Games: " + ", ".join(f"{g} {n}" for g, n in games.most_common()) + ".")
    if players:
        lines.append("- Players: " + ", ".join(
            f"{names.get(u, 'unknown')} {n}" for u, n in players.most_common(10)) + ".")
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
    lines += ["", "Anonymous play: Vercel > countrivo > Analytics > Events "
              "(play_start, play_finish, run_saved, share)."]
    (out / "summary.md").write_text("\n".join(lines) + "\n")
    notify(f"Report ready in reports/{today.isoformat()}")
    print(out / "summary.md")


if __name__ == "__main__":
    main()
