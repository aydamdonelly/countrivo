# Countrivo · Strategic Brief

*Stand: 26. Mai 2026 · Basierend auf 30 Audit- und Konzept-Dokumenten aus dem Country-AI-Country-Review · Solo-Entwickler-Roadmap*

---

## 1 · Positionierung in einem Satz

**Countrivo ist ein Tageskalender, der zufällig Spiele enthält — und seine Identität gehört dem Datum, nicht dem Spiel.**

One world. One puzzle a day. Forever.

---

## 2 · Das Portfolio

Vier Spiele und eine Sammel-Schicht. Mehr nicht.

### Spiel 1 · Country Draft *(Flaggschiff · bestehend)*
Acht Picks, eine optimale Lösung, ein verteidigbarer USP. Die einzige Mechanik im Geography-Daily-Markt, die MtG-Drafting-DNA mit 21 Statistik-Achsen verbindet. Bedingung vor Launch: das Mid-Game (Pick 5-6) erzählerisch tragen — heute "Brei", muss "Schicksal" werden.

### Spiel 2 · *Trace* (umbenannt aus countryle) *(Daily-Anker · bestehend)*
Sechs Versuche, sechs Stat-Pfeile, ein Land. Wordle-Folgerungslogik auf Stat-Daten. Bedingung vor Launch: Umbenennung ist nicht-verhandelbar — *countryle*-Domain-Kollision mit drei existierenden Produkten ist SEO-tödlich. Arbeitsname für diesen Brief: *Trace*.

### Spiel 3 · Stat-Guesser *(Stat-Hebel · bestehend, mit Anker-Reform)*
Eine Stat-Frage pro Tag, mit Vergleichs-Anker. Heute "Wie viele Einwohner hat Tansania?" — morgen "Tansania vs. Spanien (47M)". Reform: Anker-Vergleichswert ist Pflicht; Daily reduziert auf 1 Frage. Direkter Auftritt der 21-Kategorien-USP.

### Spiel 4 · Cluster *(Connections-für-Geographie · NEU)*
Sechzehn Länderflaggen in vier Gruppen sortieren. Vier Versuche, einer wird zu lila ("obvious-unobvious"). Drei unabhängige Phase-C-Forscher (Mira A · Olav · Lou) haben dieselbe Lücke benannt: Connections-Mechanik fehlt in der Geography-Welt komplett. Bedingung vor Launch: tägliche redaktionelle Hand für die "lila Gruppe" — das ist Verlagsarbeit, keine Engineering-Aufgabe.

### Meta-Layer · Atlas Album *(Sammel-Schicht über alle vier · NEU)*
243 Länder als Sticker. Jeder gewonnene Daily stempelt sein Land. Pokémon-Logik auf Geography übertragen. Das einzige strukturelle Element, das in der gesamten Geography-Game-Welt nicht existiert. **Ohne Atlas Album ist Countrivo eine Spielmenge. Mit Atlas Album wird Countrivo ein Pfad.**

---

## 3 · Brand & Visual Identity

### Die eine Idee
*Today's challenge is live.*

### Die Klammer
**Der mittlere Punkt (U+00B7)** als wiederkehrende typografische Geste, an acht Stellen identisch:

- Wortmark: `Coun · trivo`
- Streak-Badge: `23 · day · streak`
- Hero-Subline: `Tuesday · May 26 · Resets in 7h 23m`
- Game-Landing-Datums-Tag: `26 · 05 · 26`
- OG-Card: Wortmark + Datums-Zeile
- Share-Card: Score + Datum durch Punkt verbunden
- Footer: `Countrivo · One puzzle a day · Since 2026`
- Game-Over: Score · Rank · Datum

Eine einzige Geste, an zwanzig Stellen wiederholt — leise, ernst, präzise. Kein LLM würde an genau diese Stelle einen Punkt setzen.

### Farbe
**Ein Goldton: `#b8860b`.** Alle anderen Goldtöne — Logo-Amber (`#f59e0b/#d97706`), Hero-Globus-Mischton (`#c9a44c`), gold-bright als Standalone — werden eingezogen. `--color-gold-bright: #d4a017` bleibt nur als Hover-State, `--color-gold-deep: #96700a` nur als Active-State. Keine Verläufe als Brand-Element. Keine Drop-Shadows. Keine Glows.

### Typografie
**Inter** als Bedienschrift (Body, Headlines, UI). **Geist Mono** als Stat-Schrift (Scores, Streaks, Datums-Stempel, Reset-Timer, Country-Codes). Roboto Mono als technischer Fallback wenn Geist nicht lädt. JetBrains/IBM Plex Mono werden explizit *nicht* gewählt — sie tragen IDE- bzw. Corporate-Schatten. Sechs Schriftgrößen-Stufen, vier Gewichte, eine Caps-Tracking-Regel (`0.06em`, nicht Tailwind-Default).

### Logo
**Rein typografisch, kein Symbol.** *Coun · trivo* in Inter Extrabold. `Coun` in `--color-cream`, mittlerer Punkt in Gold, `trivo` in Gold. Favicon: einzelnes *C* in `--color-gold` auf transparent, kein Container. OG-Card: Cremegrund (`#fafaf8`), Wortmark + Datums-Zeile, keine Tagline-Bullets.

### Bewegung
**Vier Dauern, drei Easings, neun Keyframes.** Reduziert von vorher fünf, zwei und vierzehn. Eine einzige "Feel"-Animation auf der Marken-Ebene: der Streak-Counter atmet beim Inkrementieren (350ms, `--ease-game`). Alles andere ist Spielfeedback.

### No-Gos (Hellas Index + Marwah-Erweiterung)
1. Lineare Verläufe als Brand-Element
2. Glasmorphismus / `backdrop-blur` ohne funktionalen Grund
3. Floating Particles · Confetti · Live-Dots
4. Zentrierte Hero-Sektionen mit Radial-Glow
5. Emoji-Inflation (max 1 pro Sektion, nur wenn semantisch)
6. Der pulsierende "Live"-Punkt mit dem Wort "Live"

---

## 4 · Architektur & Code-Plan

Die kritische Erkenntnis aus der Phase-J-Review: **drei Pläne (Multiplayer-Removal, Auth-Vereinfachung, Token-Refactor) lassen neun Operationen ungelöst zwischen sich.** Der finale Brief schließt diese Lücken.

### 4.1 · Schritt 0 — Die Aorta *(Pflicht, heute Abend)*

Vor allem anderen. Ein Nachmittag Arbeit.

- **`daily_puzzles` Insert-RLS PUBLIC** schließen auf `auth.uid() IS NOT NULL`, besser noch via SECURITY DEFINER RPC `ensure_daily_puzzle(game_slug, date)`.
- **`submitGameRun:474` "not yet validated"** für blitz/borderline/supremacy: weil diese Spiele Drills werden, muss kein Server-Submit mehr passieren. Validierungs-Lücke wird geschlossen, indem diese drei Spiele *keine* Daily-Submissions mehr akzeptieren.
- **`searchUsers` ILIKE-Sanitization** erweitern um `,` und `()` für PostgREST-OR-Injection-Schutz.
- **`game_results` + `sessions`** droppen (ungenutzt, offene Türen).

*Owner: Solo-Entwickler. Zeit: 4-6 Stunden. Pflicht vor jedem anderen Commit.*

### 4.2 · Schritt 1 — Multiplayer-Removal *(Heigh-Plan)*

Vier atomare Commits, in einem Zug. Build muss zwischen jedem Commit grün bleiben.

1. **Dateien löschen:** `src/lib/supabase/rooms.ts`, `src/hooks/use-multiplayer.ts`, `src/app/vs/`, 3× `create-game-button.tsx`
2. **DB-Migration:** `DROP TABLE game_rooms, game_results, sessions` — vorher SELECT-Count zur Verifikation
3. **Type-Migration:** `mode: "daily" | "practice" | "versus"` → `"daily" | "practice"`, gefolgt von Compile-Sweep
4. **Engine-Refactor:** supremacy (Versus-State raus, AI bleibt), blitz (opponentScore raus), borderline (Board-Versus-State raus)

Friend-Challenges bleiben — async, entkoppelt, das überlegene Sozial-Konstrukt.

*Owner: Solo-Entwickler. Zeit: 8-12 Stunden in 1-2 Sitzungen.*

### 4.3 · Schritt 2 — Auth-Vereinfachung *(Vellanti-Plan)*

Magic-Link und OAuth komplett raus. Email + Passwort als einziger Weg.

- Auth-Modal-Rewrite mit Tab-Toggle (Sign In / Sign Up), Show-Password, Caps-Lock-Warning, Mobile-Bottom-Sheet
- `handle_new_user`-Trigger: Username aus Email-Local-Part, Discriminator bei Kollision
- `/auth/reset-password` und `/auth/forgot-password` Routes neu
- Bestehende User: Reset-Mail an alle, Setup-Flow
- Confirm-Email ON für Sicherheit, "Limited"-Status für sofortiges Spielen ohne Verify
- Drei Sign-In-Trigger-Punkte: Daily-Spiel-Sieg (Score-saving-modal), Streak-Tag-3, Friend-Challenge-Reception

*Owner: Solo-Entwickler. Zeit: 16-24 Stunden über 3-5 Sitzungen.*

### 4.4 · Schritt 3 — VERDICT-Reduktion *(Olbricht)*

Vor Token-Refactor: Game-Inventory reduzieren.

- 11 Spiele aus Hauptmenü entfernen (oder in `/drills/`-Sektion verschieben)
- `game-registry.json`: nur 4 Hauptspiele + Drills-Subsektion
- Routes löschen oder zu `/drills/{slug}/` verschieben
- Engine-Code für gestrichene Spiele bleibt (kann später als Drills aktiviert werden)
- countryle → Trace umbenennen (Route, Slug, Registry, alle Boards)

*Owner: Solo-Entwickler. Zeit: 6-8 Stunden.*

### 4.5 · Schritt 4 — Token-Refactor *(Bruckner-Plan, reduziert auf 4 Spiele)*

Erst nach VERDICT-Reduktion. Sonst baut man Tokens für tote Spiele.

- `@theme` neu (siehe Bruckner-Bericht für copy-paste-Block)
- Per-Game-Tokens: nur für die 4 VERDICT-Spiele + Drills-Sektion (gemeinsamer `--game-drills-bg/-fg`)
- `<Button>`-Komponente bauen, 15 Gold-Button-Stellen migrieren
- `<Modal>` extrahieren *nach* Vellanti's Auth-Modal-Spec
- `<Pill>` für 17 Inline-Spans
- `<Toast>` für `alert()`-Ersatz
- `TopoBg` löschen, `--font-serif`-Token löschen
- `HeroGlobe`: Strokes auf `rgba(26,26,26,0.06-0.10)` umfärben, 10 Punkte auf 3 reduzieren (gestern/heute/morgen), Bézier-Arcs streichen
- 36× `text-[10px]/[11px]` Bracket-Hacks sweepen auf `text-xxs`-Token
- **Zusätzlich (Naeir-Erweiterung):** `font-feature-settings: "tnum" 1` für Mono-Numerik, `.label-caps`-Utility mit `tracking: 0.06em`

*Owner: Solo-Entwickler. Zeit: 12-16 Stunden.*

### 4.6 · Schritt 5 — Atlas Album DB & Trigger *(neu, ungelöst in den Phasen)*

Architektur *vor* Cluster. Sonst stempelt Cluster auf Sand.

```sql
CREATE TABLE atlas_stickers (
  user_id uuid REFERENCES auth.users(id),
  country_iso3 text NOT NULL,
  game_slug text NOT NULL,
  daily_date date NOT NULL,
  first_stamped_at timestamptz DEFAULT now(),
  stamp_count int DEFAULT 1,
  PRIMARY KEY (user_id, country_iso3)
);

CREATE OR REPLACE FUNCTION stamp_atlas() RETURNS TRIGGER AS $$
DECLARE
  countries_in_run text[];
BEGIN
  IF NEW.mode = 'daily' AND NEW.won = true THEN
    countries_in_run := extract_countries(NEW.game_slug, NEW.result_json);
    INSERT INTO atlas_stickers (user_id, country_iso3, game_slug, daily_date)
    SELECT NEW.user_id, c, NEW.game_slug, NEW.daily_date
    FROM unnest(countries_in_run) c
    ON CONFLICT (user_id, country_iso3) DO UPDATE
      SET stamp_count = atlas_stickers.stamp_count + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_stamp_atlas
  AFTER INSERT ON game_runs
  FOR EACH ROW EXECUTE FUNCTION stamp_atlas();
```

Server-seitige `extract_countries(game_slug, result_json)`-Funktion pro VERDICT-Spielslug (4 Branches). Plus UI für `/album`-Route. Plus Sticker-Tier-System (1× gestempelt = Bronze, 5× = Silber, 10× = Gold).

*Owner: Solo-Entwickler. Zeit: 8-12 Stunden.*

### 4.7 · Schritt 6 — Cluster-Engine *(neu)*

Nach Atlas. Parallel kann redaktionelle Hand aufgebaut werden.

- `src/lib/game-logic/cluster/engine.ts` (pure, seeded RNG, 4×4 Grid)
- `src/lib/game-logic/cluster/generator.ts` (Tages-Curriculum aus `content/cluster/YYYY-MM-DD.md`)
- `src/components/games/cluster/cluster-board.tsx` (Drag-or-tap-to-group)
- `src/app/games/cluster/page.tsx` + `play/page.tsx`
- Aldrich-Tests C1-C8 als Vitest-Suite (Pflicht vor Launch)
- Editorial: 30 Tages-Puzzles vor Launch handkuratiert (eine Monatslieferung)

*Owner: Solo-Entwickler (Engine) + Solo-Entwickler oder Co-Curator (Editorial). Zeit: 20-30 Stunden + ongoing Pflege.*

### 4.8 · Schritt 7 — Share-Grids + Streak-Halbwertszeit *(Mira-M3)*

Jedes der vier Spiele bekommt ein Share-Grid-Format:
- Country-Draft: 8 Pick-Symbole, gefärbt nach Rang (gold/grün/gelb/grau)
- Trace: 6 Reihen × 6 Stat-Pfeile (existiert quasi schon)
- Stat-Guesser: Anker-Distanz-Symbolik
- Cluster: 4×4 Farbgrid mit Reveal-Reihenfolge

Streak-Halbwertszeit: `game_runs.weight DECIMAL DEFAULT 1.0`, gerechnet aus `(today - date_key)` zum Submission-Zeitpunkt. Verpasste Tage zählen 50%, 25%, 12.5%. Streak-Race-Bedingung (Konstantinou Säule #8) wird gleichzeitig gefixt durch Aggregations-Query statt inkrementelle Updates.

*Owner: Solo-Entwickler. Zeit: 8-12 Stunden.*

### 4.9 · Schritt 8 — Friend-Challenge-Notifications *(ungelöst in den Phasen)*

Email-Trigger via Postgres-Function + In-App-Badge im Header. Kein Realtime-Stack (gerade entfernt).

```sql
CREATE OR REPLACE FUNCTION notify_friend_challenge() RETURNS TRIGGER AS $$
BEGIN
  PERFORM net.http_post(
    url := 'https://...supabase.co/functions/v1/send-challenge-email',
    body := jsonb_build_object('challenge_id', NEW.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

In-App-Badge: Header-Query `SELECT COUNT(*) FROM friend_challenges WHERE challenged_id = $1 AND status = 'pending'`, getriggert beim Auth-Status-Change und alle 60s wenn Tab aktiv.

*Owner: Solo-Entwickler. Zeit: 6-8 Stunden.*

### 4.10 · Schritt 9 — Server-Side Re-Compute *(Aldrich-Defekte 7/9/10)*

Pflicht vor Leaderboard-Live-Schaltung. Pure Engines machen es billig.

- `validateGameResult(slug, dateKey, userResult)` ruft serverseitig die Engine mit demselben Daily-Seed
- Vergleicht `userResult.score` mit `serverResult.maxPossibleScore`
- Lehnt Submissions mit `score > maxPossibleScore` ab
- 4 Branches (einer pro VERDICT-Spiel)

*Owner: Solo-Entwickler. Zeit: 6-10 Stunden.*

### 4.11 · Schritt 10 — Repo-Hygiene & country-draft RNG-Fix

- `country-draft/engine.ts:6` Signatur ändern auf `createGame(rng: () => number, mode, dateKey)` — Engine-Purity wiederherstellen
- 17 PNG-Screenshots aus Repo-Root nach `docs/screenshots/` verschieben
- `README.md` ersetzen (Next.js-Default raus)
- `country-streak/streak-board.tsx` von `useState` auf `useReducer` migrieren
- 4 play-pages (blitz/supremacy/borderline) Client-Wrapper extrahieren

*Owner: Solo-Entwickler. Zeit: 6-8 Stunden.*

---

## 5 · Roadmap *(12 Wochen)*

| Woche | Phase | Deliverable |
|---|---|---|
| 1 | Schritt 0 (Aorta) + Cluster-Spec parallel | RLS-Patch live; Cluster-Spec geschrieben |
| 2-3 | Schritt 1 (Multiplayer raus) | Vier Commits sauber gemerged |
| 4-5 | Schritt 2 (Auth-Vereinfachung) | Email/Password live; Magic-Link/OAuth weg |
| 6 | Schritt 3 (VERDICT-Reduktion) | 4-Spiele-Hauptmenü; Drills-Sektion; Trace-Rename |
| 7-8 | Schritt 4 (Token-Refactor) | Neue Tokens; `<Button>`, `<Modal>`, `<Pill>`, `<Toast>` |
| 9 | Schritt 5 (Atlas Album) | DB-Trigger live; `/album`-Route mit leeren Stickern |
| 10-11 | Schritt 6 (Cluster) + Editorial Onboarding | Cluster live mit 30 kuratierten Tages-Puzzles |
| 12 | Schritte 7-10 (Share, Notifications, Re-Compute, Hygiene) | Launch-Bereit |

**Total: ~120-160 Stunden Engineering plus laufende Cluster-Redaktion.**

---

## 6 · Top-3-Risiken

### Risiko 1 · Aorta-Insuffizienz
*Wahrscheinlichkeit: hoch · Impact: existenz-bedrohend für das Daily-Versprechen.*

`daily_puzzles` PUBLIC + Validierungs-Lücke werden in drei Phasen identifiziert und in keinem Plan als erste Aufgabe verankert. Wenn Schritt 0 nicht *vor* allem anderen passiert, hat das Produkt eine offene Tür, durch die der erste neugierige Reddit-Leser zum ersten Cheater wird. *Mitigation: Schritt 0 ist nicht-verhandelbar.*

### Risiko 2 · Halb-Reduktion
*Wahrscheinlichkeit: mittel · Impact: System-Inkohärenz.*

Wenn Multiplayer-Removal zwischen Commit 3 und 4 hängt (Solo-Leben), driftet das System in einen Zwischen-Zustand mit TypeScript-Errors und DB-Constraint-Failures. *Mitigation: Heigh-Plan in 16 zusammenhängenden Stunden ausführen, nicht zerstückeln.*

### Risiko 3 · Atlas Album als Client-Implementation
*Wahrscheinlichkeit: mittel-hoch · Impact: Verb-Bruch.*

Wenn Atlas mit "localStorage zuerst, Server später" gebaut wird, ist das Sammel-Versprechen tot, bevor es lebt. *Mitigation: Schritt 5 ist Postgres-Trigger-First, niemals Client-First.*

---

## 7 · Offene Entscheidungen vor Launch

Drei Stellen, an denen die Phasen keinen Konsens hatten. Sie müssen vor MVP-Launch entschieden werden:

### 7.1 · Friend-Challenge-Determinismus
Teilen Friend-Challenges das globale Daily-Puzzle (Hint-via-Discord-Risiko bleibt) oder bekommen sie einen eigenen Seed (Atlas-Album-Sticker zählen dann nicht)? **Empfehlung: globales Daily-Puzzle, `challengerScore` post-completion-only sichtbar.** Atlas-Album-Konsistenz schlägt Hint-Risiko, weil das Album das größere Asset ist.

### 7.2 · Cluster Redaktionelle Hand
Wer kuratiert die "lila Gruppe" obvious-unobvious täglich? **Empfehlung: Markdown-Dateien pro Tag in `content/cluster/YYYY-MM-DD.md`**, vom Cluster-Generator als Input genommen. Solo-Entwickler übernimmt 30 Tage vorab, sucht danach einen Co-Curator (Geographie-Lehrer:in als ehrenamtlicher Pflege-Partner).

### 7.3 · Confirm-Email Setting
Sofortige Spielbarkeit ohne Verify vs. Account-Squatting-Schutz. **Empfehlung: Confirm-Email ON, "Limited"-Status für unverifizierte Accounts** (kann spielen, aber nicht Friend-Challenges starten, keine Atlas-Sticker dauerhaft).

---

## 8 · Die Streich-Disziplin *(Dunmar-Praxis)*

Eine monatliche, wiederkehrende Praxis nach Launch: jeden Monat ein UI-Element streichen, das nicht zwingend gebraucht wird. Nicht hinzufügen — streichen. Eine Marke, die nicht regelmäßig schlanker wird, wird automatisch breiter, weil Engineering immer hinzufügt. Die einzige Gegenkraft ist die geplante Reduktion.

Erster Streich-Kandidat im Monat 1 nach Launch: vermutlich der `backdrop-blur` am Header, falls die Lesbarkeit ohne ihn überlebt.

---

## 9 · Quellen *(die 30 Berichte hinter diesem Brief)*

### Phase A · Bestandsaufnahme
- [Mira Voss · Architektur-Karte](phase-a-inventory/01-mira-voss-architecture.md)
- [Jonas Eberhardt · Schichtgrenzen](phase-a-inventory/02-jonas-eberhardt-layers.md)
- [Lina Hadid · Auth & Multiplayer](phase-a-inventory/03-lina-hadid-auth.md)
- [Aurelie Ferré · Design-System](phase-a-inventory/04-aurelie-ferre-design-system.md)
- [Kasimir Joren · Datenfluss](phase-a-inventory/05-kasimir-joren-data-pipeline.md)
- [Synthese](phase-a-inventory/SYNTHESIS.md)

### Phase B · Design-Konzept
- [Hella Branken · Brand & Feel](phase-b-design/01-hella-branken-brand-and-feel.md)
- [Reto Bruckner · System & Rhythmus](phase-b-design/02-reto-bruckner-system-and-rhythm.md)
- [Aleksandr Vodník · Signage & Affordance](phase-b-design/03-aleksandr-vodnik-signage-and-affordance.md)

### Phase C · Game-Research
- [Mira Andrasković · Retention-Mechaniken](phase-c-research/01-mira-andraskovic-retention-mechanics.md)
- [Olav Tirvik · USP & Marktlücken](phase-c-research/02-olav-tirvik-usp-gap-analysis.md)
- [Lou Yang · Fun-Forensik](phase-c-research/03-lou-yang-fun-forensics-game-concepts.md)
- [Kandidaten-Liste](phase-c-research/CANDIDATES.md)

### Phase D · Multiplayer-Removal & Auth
- [Anders Heigh · Multiplayer-Entfernung](phase-d-multiplayer-auth/01-anders-heigh-multiplayer-removal-plan.md)
- [Sera Vellanti · Auth-Vereinfachung](phase-d-multiplayer-auth/02-sera-vellanti-auth-simplification.md)

### Phase E · Gerichtsverfahren
- [Tilda Renström · Anklage](phase-e-court/01-tilda-renstrom-prosecution.md)
- [Yusuf Marek · Verteidigung](phase-e-court/02-yusuf-marek-defense.md)
- [Margaret Wolfe · Jurorin](phase-e-court/03-margaret-wolfe-juror.md)
- [Hans Lubavič · Juror](phase-e-court/04-hans-lubavic-juror.md)
- [Marius Olbricht · Verfahrens-Transkript](phase-e-court/05-marius-olbricht-transcript.md)
- [**Urteil**](phase-e-court/VERDICT.md)

### Phase F · Talkshow "Countrivo AI Country"
- [Episode 144 · "Die vier, die bleiben"](phase-f-talkshow/01-country-ai-country-episode-144.md)

### Phase G · Anti-AI-Slop-Kritiker
- [Rahul Marwah-EO · Forensik](phase-g-anti-ai/01-rahul-marwah-eo.md)
- [Rahul Naeir-EO · Typografie](phase-g-anti-ai/02-rahul-naeir-eo.md)
- [Frieda Dunmar · Komposition](phase-g-anti-ai/03-frieda-dunmar.md)

### Phase H · Edge-Case "Ticker" QA
- [Tessa Korovi · QA aus dem Exil](phase-h-edge-case-qa/01-tessa-korovi.md)
- [Boroš Aldrich · Algorithmische Defekte](phase-h-edge-case-qa/02-boros-aldrich.md)
- [Yvel Konstantinou · Säulen-Defekte](phase-h-edge-case-qa/03-yvel-konstantinou.md)

### Phase I · Autopsie
- [Dr. Olabisi Renard · Forensische Produkt-Autopsie](phase-i-autopsy/01-olabisi-renard-autopsy.md)

### Phase J · Final Quality Control
- [Halit Vermes · Architektur-QC](phase-j-final-qc/01-halit-vermes-architectural.md)
- [Naima Bechara · Produkt-QC](phase-j-final-qc/02-naima-bechara-product.md)
- [Stanisław Mraz · Brand-QC](phase-j-final-qc/03-stanislaw-mraz-brand.md)

---

## 10 · Maxime

Vier Sätze, die durch den ganzen Prozess getragen haben. Sie hängen in keiner Roadmap-Tabelle und in keinem Token-Block — sie sind die Grundtöne, auf denen die Architektur steht:

> **Konvergenz vor Brillanz.** *— Selma's Lederheft, zitiert von Halit Vermes*

> **Eine Marke ist eine Stille.** *— Stanisław Mraz*

> **Das Wasser findet seinen Weg, aber du musst helfen.** *— Linda Joren, zitiert von Kasimir*

> **Den hatten wir schon.** *— Felix Wolfe, sechs Jahre alt, November 2019*

---

## 11 · Schluss

Dieser Brief ist die Lupe, durch die der Solo-Entwickler die nächsten zwölf Wochen sieht. Die Pläne sind nicht meine — sie sind die Substanz von dreißig unabhängigen Stimmen, die in zehn Phasen unabhängig zu denselben Schlüssen gekommen sind: **reduzieren, sichern, eine Klammer setzen, das Datum zur Marke machen.**

Was bleibt zu tun, ist klein: die Aorta schließen, vier Pläne in der richtigen Reihenfolge ausführen, die neun Lücken zwischen ihnen mit Eigentum und Datum versehen, einen einzelnen mittleren Punkt zur typografischen Geste der Marke machen.

Was bleibt, wenn das gelingt: ein Tageskalender, der zufällig Spiele enthält. Vier Spiele. Ein Album. Eine Klammer. Eine Stille.

— Stand 26. Mai 2026. Auswertbar in 18 Monaten.
