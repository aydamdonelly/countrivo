# Owner checklist — things only you can do

Researched 2026-08-02 by a 5-agent swarm against primary docs. Every item says where to click, how
long, and what it actually buys. Items marked **unverified** could not be confirmed at primary source.

---

## BLOCKERS — nothing else works until these are done

### 0. `vercel login` — the deploy is stuck
Your Vercel CLI token is expired (`Error: Not authorized`). Run in the Claude Code prompt:

```
! npx vercel login
```

Then say the word and the deploy goes out. **Nothing described below is live yet.**

### 1. Turn on Anonymous sign-ins in Supabase — 2 min
`https://supabase.com/dashboard` → countrivo → **Authentication → Sign In / Providers → Anonymous sign-ins → ON**

**Verified, not guessed.** A probe against your project returned:
```
POST /auth/v1/signup → HTTP 422
{"error_code":"anonymous_provider_disabled","msg":"Anonymous sign-ins are disabled"}
```
Without this the guest leaderboard shows "Guest play is not enabled yet" and nothing saves.

- While there, glance at **Authentication → Rate Limits**. Defaults are fine at your volume — don't raise them yet.
- **Do NOT enable CAPTCHA in the same sitting.** If guest join then fails you won't know which switch broke it.
- **Unverified:** whether your existing RLS policies admit `is_anonymous` users on the leaderboard write path. Step 3 is what proves it.

---

## AFTER THE DEPLOY — verify, in this order

### 2. Confirm the sitemaps are real XML — 8 min
Open with the `view-source:` prefix (status 200 is a **false pass**; you must read the body):

| URL | expect |
|---|---|
| `view-source:https://countrivo.com/countries/sitemap.xml` | `<?xml …?>` + **243** `<loc>` |
| `view-source:https://countrivo.com/lists/sitemap.xml` | `<?xml …?>` + **15** |
| `view-source:https://countrivo.com/games/sitemap.xml` | `<?xml …?>` + **17** |
| `https://countrivo.com/robots.txt` | four `Sitemap:` lines, one `User-agent: *` group |

> **Read this before you look at the dates, or you will "fix" something that is correct.**
> The right answer is **243 identical** `lastmod` values. All country + list URLs = `2026-04-01`,
> games = `2026-05-31`, categories = `2026-05-29`. Variation is *between* shards, not within them.
> The bug was every URL carrying the **build** time. A regression looks like today's date.

Ctrl+F for `changefreq` and `priority` — both must return **zero** matches.

Then paste into a terminal (this tests server-rendering with real AI-crawler agents — the thing that
dies silently with no error anywhere):

```bash
curl -sA 'Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)' \
  https://countrivo.com/countries/germany | grep -c 'What is the capital of Germany'
# must print 1 or more

curl -sA 'Mozilla/5.0 (compatible; ClaudeBot/1.0)' -o /dev/null -w '%{content_type}\n' \
  https://countrivo.com/countries/sitemap.xml
# must print application/xml — NOT text/html
```

Also eyeball `https://countrivo.com/countries/tuvalu` — Germany passes trivially; Tuvalu is where a
missing data value would render a question with no answer under it.

> **Note on a false alarm:** production *currently* serves HTML at `/countries/sitemap.xml`. That is
> only because the shards don't exist in the live deploy yet, so the request falls through to the
> `[slug]` route. In the new build all four return `application/xml` — measured locally. Recheck anyway.

### 3. Confirm guest entry works — 6 min
Genuinely **private** window (not just logged out) → play one round to the end → enter a name.

- PASS = no sign-in modal, no email, no password.
- Open `/games/geo-wordle/leaderboard` in that private window — your run should appear.
- **Then open the same URL in your normal logged-in window.** If it only shows in the private one, the
  write never reached the database. This step is the only one that catches a fake pass.

**Unverified by me:** the success path. I could only test the failure path (the Supabase switch is off),
and it produced the right message. Everything after the toggle is untested.

### 4. Push `.github/workflows` — 7 min
**Your two crons do not exist yet.** `.github/` is entirely untracked and you have **7 unpushed
commits**; the last push to GitHub was 2026-05-29.

- **Check `Vercel → Settings → Git` first.** If a GitHub repo is connected, pushing also ships a
  production deploy. Deploy with the CLI first, then push.
- Scheduled workflows only run from the **default branch**.
- Actions tab → each workflow → "Run workflow" to smoke-test now instead of waiting for the cron.
- **The one way these die:** GitHub auto-disables scheduled workflows in public repos after 60 days
  with no repository activity. Your repo just went 65 days without a push, so this *will* happen.
  GitHub emails first — don't filter those.

---

## SET UP

### 5. Search Console — 9 min
`https://search.google.com/search-console` (property `sc-domain:countrivo.com`)

**Baseline first — you cannot recover it retroactively.** Screenshot, with today's date in the filename:
- Performance → Last 3 months → the four top-line boxes (309 clicks / 3,268 impressions / 9.5% / 36.8)
- Queries tab sorted by impressions, top ~20
- `+ New → Page → URL contains → /countries/`

Then **Sitemaps → Add a new sitemap**, three times: `countries/sitemap.xml`, `lists/sitemap.xml`,
`games/sitemap.xml`.

> Submitting adds **zero** discovery benefit — robots.txt already lists all four and Google finds them
> on its own. What it buys is the diagnostics panel, which only shows sitemaps submitted through it.
> That's the only way you'd ever catch a silently-empty shard.

- Do **not** re-add `sitemap.xml` (already registered) and do **not** build a sitemap index file.
- 60 seconds of insurance: **Settings → "Search generative AI"** → confirm it reads *Include*. It's the
  default, so it's almost certainly right — but if it ever said Exclude, all 243 answer capsules are
  dead weight and nothing else in GSC would tell you.
- Do this **before** the Bing import, so Bing inherits all four sitemaps.

### 6. Bing Webmaster Tools — 8 min
`https://www.bing.com/webmasters/` → **"Import from Google Search Console"** (not manual entry).

Bing's index feeds Bing, Copilot, DuckDuckGo and Ecosia — roughly 5–10% of your search surface that
never shows up in GSC. The IndexNow panel is also the *only* feedback loop IndexNow has; the API itself
only ever returns 200/202 and never tells you whether anything got crawled.

- **Unverified:** whether Bing's import handles `sc-domain` domain properties (yours) like URL-prefix
  ones. If countrivo.com doesn't appear in the list, fall back to manual + CNAME verification (+10 min).
- Your click history does **not** transfer. Bing starts from zero — documented behaviour, not a failure.
- ~1 week after the first IndexNow run, check `bing.com/webmasters/indexnow`. Submitted climbing but
  Crawled stuck at 0 = Bing is receiving and rejecting → recheck the key file.

### 7. listdle.com — 5 min
`https://listdle.com/submit` — submit the **hub** `https://countrivo.com/games`, not a single game.

Eligibility, quoted from the form: *"the game must be a free-to-play daily game which does not require
log in."* **Step 3 must be passing and live first.**

### 8. AlternativeTo — 3 min today, 25 min on 2026-08-09
`https://alternativeto.net` → sign up **today and do nothing else**. Verified on their FAQ: *"New users
must wait a week after the creation of their account to submit a new app page."* That clock only starts
if you sign up now.

On 2026-08-09: create the listing, then the higher-value half — add Countrivo as an alternative on
`/software/geoguessr/` and `/software/worldle/`. Those pages already rank for "GeoGuessr alternatives",
which is exactly the source shape answer engines cite.

- Website URL with **no UTM parameters** — they get stripped or rejected.
- **Unverified:** whether their "Worldle" page is Antoine Teuf's original. The description reads like a
  different game. List anyway, just don't assume you're next to the famous one.

### 9. Submit the iOS app — ~4 h
**Reality check that reorders your plan:** the iTunes lookup API returns `resultCount 0` for
`com.countrivo.app` in both US and DE storefronts. There is no listing to rewrite — the task is *submit*.

Copy is already paste-ready in `docs/APP-STORE-MASTER.md`. Two edits before pasting:
1. Subtitle "Flags, capitals & countries" (a feature list) → **"Daily geography game, 17 modes"** (a category claim).
2. Prepend one definitional sentence to the Description: *"Countrivo is a free daily geography game platform: one shared puzzle across 17 games, 243 countries, reset at midnight."*

Once live, send me the **Apple ID** number (App Store Connect → App Information) — it becomes one line
in `<head>` for the Smart App Banner.

### 10. Show HN — 30 min
`https://news.ycombinator.com/submit`, title beginning `Show HN:`. Their rule, verified: don't submit
until users can actually try it — **step 3 must pass first**.

Leave the text field empty and post your first comment immediately: why you built it, the deterministic
`mulberry32` daily seed keyed to Europe/Berlin, the 243-country pipeline, and one honest limitation.
HN rewards specificity and disclosed tradeoffs. **Don't ask anyone to upvote** — that's an explicit rule.

The durable payoff isn't traffic, it's a permanent indexed third-party page discussing Countrivo by
name. You currently have zero of those.

---

## DECISION: rename GeoWordle?

**The case for.** A search for "geowordle" surfaces geoworldle.com, geodle.me, worldle.teuteuf.fr,
geotrivia.com/geodle, georankle.io/geodle, globle-game.com, geodle.io — Countrivo is not in the top 7.
I independently fetched **geoworldle.com** and confirmed it is a platform of ~15 geography Wordle-style
games with daily + unlimited modes — almost exactly your positioning.

Your GSC data agrees: position 5.4, **2% CTR** — about a third of normal for that position. People see
your result, realise it isn't the game they meant, and scroll on.

**What's at risk:** 11 clicks per 3 months. Roughly one a week. Tripling CTR buys ~130 clicks a year.

**The other reason:** Apple guideline 5.2.1, verified verbatim — *"don't include misleading, false, or
copycat representations, names, or metadata in your app bundle."* Your app has **not** been submitted
yet, so this is the cheapest possible moment to remove that surface.

**Unverified:** that NYT holds a registered trademark on "Wordle" — couldn't reach a primary source.
The recommendation stands on the "copycat representations" clause alone.

Candidates: **Bearing**, **Waypoint**, **Compass**. If you say go, I'll do the slug, a permanent 301
from `/games/geo-wordle`, registry/H1/title, and regenerate that OG image. Keep *"a Wordle-style
geography game"* in body copy only — never the brand name, H1, title tag, or App Store metadata.

Do **not** buy geowordle.com — it's unregistered, which will feel like an opportunity. It isn't. You'd
be paying to permanently anchor your brand to a competitor's misspelling.

---

## Don't panic about these

- **243 identical lastmod dates.** Correct, not a bug. See step 2.
- **Impressions rise while clicks stay flat for 2–4 weeks, CTR appears to collapse from 9.5%.** Normal
  shape — new content shows at poor positions first. Do not rewrite titles in week 2.
- **Average position bouncing 36.8 → 45 → 22.** At 3,268 impressions, a handful of new long-tail
  queries at position 80 drags the average down even while every page improves.
- **Most new URLs sitting in "Crawled – currently not indexed" for weeks.** Default state at your size.

## Don't bother

- **Removals tool** — the one thing here that could actively hurt you. It hides URLs for ~6 months.
- **"Request indexing"** beyond 2–3 URLs. Google routes bulk cases to sitemaps, which you've done.
- **Resubmitting sitemaps after future deploys.** One-time pointer registration.
- **Named AI-bot groups in robots.txt.** robots.txt is not additive — a named group can only *remove* access.
- **Yandex / Naver / Seznam / Yep consoles.** All are IndexNow participants; the fan-out already reaches them.
- **DuckDuckGo / Ecosia / Copilot signups.** All served from Bing's index.
- **Everything Applebot-related.** No console, no submission, no verification. `Allow: /` already covers it.
- **apple-app-site-association / universal links.** No `associated-domains` entitlement — dead weight.
- **Wikipedia article** — permanently. You fail notability and have a COI; a deleted article is a lasting
  negative record.
- **Wikidata** — worth 30 min *eventually*, zero today. Your only reference is your own site describing
  itself, which is exactly the profile that gets deletion-nominated. Revisit once the app is live, the
  AlternativeTo listing is approved, and a Show HN thread with real comments exists.
- **Product Hunt** unless Show HN goes well. If you do: personal account only, 12:01am Pacific, block the whole day.
- **BigQuery export** unless you'll genuinely write SQL. At 3,268 impressions you're nowhere near the
  1,000-row UI limit. (Counter-argument: it isn't retroactive.)
- **itch.io, wordle.global, ISTE directory, OER Commons** — structural mismatch or no submission
  mechanism at all. (ISTE 404s; wordle.global has literally nowhere to click.)
- **X/Twitter Card Validator** — 307-redirects to a login wall. For a 30-second OG check, paste a game
  URL into a Discord DM to yourself; the embed that renders *is* the test.
- **Bulk directory packages, paid placement, Google Business Profile.**
- **Reddit** — excluded by design, not skipped. Genuinely valuable, but it's a habit, not a checklist
  item. A drive-by promo post gets removed and the account flagged.
