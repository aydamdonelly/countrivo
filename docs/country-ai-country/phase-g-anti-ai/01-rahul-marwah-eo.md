# 01 · Rahul Marwah-EO · Forensik

> Ich habe heute drei Stunden im Code gesessen und mir ist achtmal die Schulter taub geworden. Achtmal, weil ich achtmal dieselbe Maschinen-Hand gesehen habe. Aber siebenmal habe ich dazwischen die andere Hand gesehen — die menschliche. Beides existiert auf dieser Seite gleichzeitig, und es ist nicht harmlos.

---

## Eröffnungs-Forensik

Wenn ich Countrivo zum ersten Mal öffne, sehe ich eine Site, die mich in zwei verschiedene Richtungen zerrt. Die Token-Architektur in `globals.css` — sieben Production-Dependencies, **eine** Schrift, vier Radius-Stufen, ein `--ease-game: cubic-bezier(0.34, 1.56, 0.64, 1)`, das jemand wirklich gefühlt hat — das ist die Arbeit eines Menschen, der das Lineal zweimal aufgelegt hat. Aber dann hebe ich den Blick zur Homepage und sehe `🌍 243 countries 🎮 14 games 🎯` in einer Zeile. Drei Emojis, drei Zahlen, drei Substantive. Das ist Slop-Tell Nummer Eins, und es steht direkt unter einer ehrlichen Headline. Auf dem Favicon zeigt sich der zweite Riss: ein `linear-gradient(135deg, #f59e0b, #d97706)` — der 135-Grad-Goldverlauf, das ranzige Signaturbild jeder LLM-Demo der letzten zwei Jahre — während die Site selbst mit `#b8860b` läuft, einem gedämpften, ehrlichen Brand-Ton. Logo und Site sprechen zwei verschiedene Sprachen. Wer die Karte teilt, teilt die Maschine. Wer die Site öffnet, sieht den Menschen. Und der Mensch hat dann einer Maschine eingeladen, das Favicon zu malen. Genau diese Asymmetrie ist es, was ich auf 30 Schritt erkenne. Ich habe das in 1.847 Artikeln gesehen, immer in derselben Form: ein Designer, der etwas Echtes baut, und dann an einer Randstelle — Favicon, OG-Card, Marketing-Strap — die Generator-Antwort annimmt, weil "es ist ja nur das Favicon". Es ist nie nur das Favicon.

## AI-Slop-Tells Inventar

Was ich gefunden habe — sortiert nach Schwere des Tells. Jede Zeile mit Datei-Pfad und Pattern-Name. Ich zähle nur, was nachweislich Maschine ist; menschliche Schwächen kommen separat.

1. **`src/app/icon.tsx:14`** — `linear-gradient(135deg, #f59e0b, #d97706)`. Der **135-Grad-Amber-Gradient** ist Slop-Tell #1 im LLM-UI-Vokabular. Drei der meistzitierten Tailwind-Tutorials in den Trainingsdaten verwenden genau diesen Winkel und genau diese zwei Amber-Stufen. Ich erkenne ihn auf das Pixel. Hier ist er.
2. **`src/app/apple-icon.tsx:14`** — derselbe Verlauf. Verdoppelung des Tells für das mobile Touch-Icon.
3. **`src/app/opengraph-image.tsx:18,28,37`** — *dreifach*. Zwei verschiedene 135-Grad-Verläufe (Hintergrund + Logo) plus inline `<span style={{ color: "#f59e0b" }}>ivo</span>` — Marke wird auf der teilenswertesten Oberfläche zu Amber-500, während die Site mit `#b8860b` läuft. Klassischer **OG-Slop**: man fragt ein LLM "make a nice OG card", man bekommt amber gradient on near-black gradient.
4. **`src/components/daily-hero.tsx:99`** — `<section className="text-center py-8 sm:py-12">`. Die **mittig-zentrierte Hero-Sektion** ist die Slop-Signatur. Hella hat das bereits markiert; ich bestätige es. Jede LLM-Landingpage der letzten 24 Monate ist `text-center`. Eine ehrliche Hand wählt links-asymmetrisch, weil sie etwas zu *sagen* hat.
5. **`src/components/daily-hero.tsx:186-194`** — `🌍 243 countries / 🎮 14 games`. **Emoji-Inflation** in einer Marketing-Stats-Zeile. Ein Tell so eindeutig, dass ich es in mein Eröffnungs-Inventar aufnehme. Plus auf Zeile 182: `🔥 {streak}-day streak`. Drei Emojis, drei Zahlen, drei Worte. *Made with AI*.
6. **`src/app/page.tsx:148`** — `<span className="absolute -right-4 -bottom-4 text-[6rem] sm:text-[8rem] opacity-[0.10] select-none pointer-events-none leading-none">`. Der **Riesen-Emoji-im-Hintergrund-bei-10%-Opazität**. 2023er Vercel-Demo-Signatur. Ich habe es 2024 in 200 Y-Combinator-Pitch-Sites gesehen. Slop-Niveau hoch.
7. **`src/app/page.tsx:252`** — selbe Geste, `text-[3.5rem] opacity-[0.12]`. Pattern-Wiederholung über zwei Sektionen — der Generator hat das nur einmal designt und zwölfmal in die Composition kopiert.
8. **`src/components/games/blitz/blitz-board.tsx:333`** — `text-8xl sm:text-9xl`. Die **Riesen-Emoji-als-Hero-Element**. Im Spiel selbst funktional vertretbar (es ist eine Flagge, der Spieler muss sie sehen), aber Tailwinds `text-9xl` ist 128px und ein Spawn-Tell — `text-8xl/text-9xl` taucht in LLM-Mock-Boards reflexartig auf, weil das Modell denkt: "big = important".
9. **`src/components/layout/header.tsx:62`** — `sticky top-0 z-50 backdrop-blur-md bg-white/80 border-b border-black/5`. **Glasmorphism-Header**, exakt das `backdrop-blur-md bg-white/X` Drei-Klassen-Akkord. Funktional gerechtfertigt (Sticky-Lesbarkeit), aber sieht aus wie 200 LLM-Headers. Ich würde sagen: 60% Maschine, 40% Tooling-Konsens. Akzeptiert, wenn die Marke sonst rauh genug ist — und sie ist es nicht überall.
10. **`src/components/auth/auth-modal.tsx:115`** — `bg-black/40 backdrop-blur-sm`. Standard Modal-Backdrop-Slop. Vertretbar, aber stereotyp.
11. **`src/components/friends/challenge-friend-picker.tsx:30`** — selbe Klassen. Doppelt benutzt, beide ohne Token. Drift.
12. **`src/components/daily-hero.tsx:110`** — `<span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />` plus *Live*-Label. **Pulsing-Live-Dot** ist Slop-Tell ✓. Jede SaaS-Dashboard-Generator-Antwort hat dieses Element. Auf einer Daily-Game-Site ist es funktional bedeutungslos — das Spiel ist *per Definition* live, weil "daily" — aber das pulsierende grüne Pünktchen schreit "ich bin a generated landing page".
13. **`src/app/page.tsx:300-303`** — selber Live-Dot in der "Challenge friends live"-Sektion. Pattern-Wiederholung, jetzt mit `bg-green-500 animate-pulse` und dem Wort "Live". Doppelt Slop.
14. **`src/components/layout/hero-globe.tsx:35-64`** — **zehn pulsierende `<circle>`-Elemente** mit individuellen Dauern (3s, 4s, 3.5s, 5s, 4.5s, 3.8s, 4.2s, 3.3s, 4.8s, 5.5s) und Opazitäten (0.8, 0.6, 0.7, 0.5, 0.6, 0.4, 0.5, 0.45, 0.55, 0.35). Das ist **"animated globe with mysterious pulsing data points"**, das LLM-Hero-Visual seit 2021. Stripe hat das einmal gemacht. Seither macht es jeder. Pulskennzahlen-Verteilung ist außerdem zu sauber-verstreut, um menschlich zu sein — kein Designer würde die Dauern in dieser Reihenfolge wählen.
15. **`src/components/layout/hero-globe.tsx:67-70`** — vier **`<path d="M…Q…">` Bézier-Arcs** zwischen den Punkten. **"Connecting lines between data points"**. Stripe 2018 → Vercel 2020 → 200 LLM-Demos 2022-2024. Wenn ich diese Kurve zwischen zwei Goldpunkten sehe, weiß ich, dass eine Generator-Pinsel sie gemalt hat. Zeile 73: gestrichelter Außenring mit `strokeDasharray="4 6"` — das ist der "globe perimeter dash" Standard-Output.
16. **`src/app/opengraph-image.tsx:40-55`** — `<p style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>Free Geography Games & Daily Challenges</p>` plus vier-Wort-Achse `11 Games / 243 Countries / 21 Stats / Daily Challenges`. **"Hero-Tagline-mit-Vier-Bullet-Stats-darunter"**. Pure Marketing-LLM-Output. Außerdem: `11 Games` ist veraltet — auf der Homepage steht `14 games`. Das Drift-Pattern zeigt, dass die OG-Card einmal generiert und nie nachgepflegt wurde.
17. **`src/app/page.tsx:198,208,218`** — `<div className="text-xl mb-1">🥇</div>` / `👥` / `🎯`. **Drei Emojis in einer Drei-Spalten-Stats-Grid**. Die Reihenfolge Gold-Trophy / People / Target ist die LLM-Defaultwahl für "today's stats" — wenn ich morgen einem Generator die selbe Aufgabe geben würde, würde ich exakt diese drei Emojis zurückbekommen.
18. **`src/app/page.tsx:204,214,224`** — `text-[10px] text-cream-muted`. **`text-[10px]`** als Inline-Bracket-Hack. 36 Vorkommnisse von `text-[10px]`/`text-[11px]` im Repo (`grep` bestätigt). Aurelie hat 20+ geschätzt; ich finde 36. Tailwinds Default-`text-xs` ist 12px — wer drunter springt, springt unter den Token-Boden. Aber: dieser konkrete Tell ist *nicht* Maschine. Das ist ein menschliches "ich brauche 11px für meine Meta-Chips und habe vergessen, einen Token anzulegen". Es ist Sloppiness, kein Slop. (Wichtige Unterscheidung. Aurelie hat es richtig.)
19. **`src/components/games/blitz/blitz-board.tsx:263`** — `animate-[pulse_2.5s_ease-out_infinite]` plus "Waiting for opponent..." Text in `text-2xl text-cream`. **"Waiting for opponent with pulsing dot"** ist Multiplayer-Slop-Standard. Aber: das wird mit der Multiplayer-Entfernung in Phase D ohnehin gestrichen.
20. **`src/components/games/countryle/countryle-board.tsx:332`** — `placeholder="Type a country name..."`. Drei-Punkt-Ellipse am Ende eines Placeholders. **Ellipsen-Placeholder-Tell**. Sehr klein, aber Generatoren neigen dazu, jede Suchleiste mit `...` zu schließen, weil sie es in den Trainings-Mocks so gesehen haben.

Das sind 20. Ich könnte 15 weitere finden. Ich höre auf, wo das Muster klar genug ist.

## Hand-Spuren

Was eindeutig Mensch ist. Genauso präzise.

1. **`src/app/globals.css:47`** — `--ease-game: cubic-bezier(0.34, 1.56, 0.64, 1)`. Ein Easing mit `1.56` als Y-Wert für den Overshoot. Das ist eine **gefühlte Wahl**, kein gegoogeltes Easing. Apples Standard-Spring ist 1.5; jemand hat 1.56 gewählt, weil 1.5 zu brav war. Ich habe noch keinen LLM-Output gesehen, der so etwas wagt — Generatoren wählen `cubic-bezier(0.4, 0, 0.2, 1)` oder `ease-out`. Das hier ist ein Mensch, der den Spielboards Saft geben wollte und die Kurve drei Mal nachjustiert hat. Eine Lithografen-Hand.
2. **`package.json` (sieben Production-Dependencies)** — keine `lucide-react`, kein `@radix-ui/*`, kein `framer-motion`, kein `clsx`-Helper, kein `shadcn`. Das ist eine *Disziplin*-Entscheidung, die kein Generator je trifft. LLMs ziehen `lucide-react` reflexartig rein, weil 95% ihrer Trainingsdaten es verwenden. Hier nicht. **Sieben** ist ein Statement.
3. **`src/lib/daily-seed.ts` + `mulberry32`** — ein deterministischer Seed-PRNG für Daily-Games, mit `Europe/Berlin`-Timezone explizit fixiert. Das ist eine Architektur-Entscheidung, die jemand für *ein* Produkt mit einem klaren Verständnis gefällt hat: "alle spielen denselben Puzzle, weltweit, von 00:00 Berlin bis 00:00 Berlin." Generatoren würden `Math.random()` schreiben oder `crypto.randomUUID()` und es nie hinterfragen.
4. **`src/components/layout/header.tsx:64-66`** — `Coun<span className="text-gold">trivo</span>`. Die **Wortmark mit nur dem Suffix in Gold**. Ein Mensch hat entschieden: nicht das ganze Wort goldglühen lassen, nicht den Anfang, sondern *die zweite Hälfte* — `trivo`. Das ist eine **typografische Mikro-Entscheidung**. Generatoren machen das Logo komplett bunt oder komplett schwarz; sie spalten Wortmarken nicht in der Mitte mit einer Farbachse. Hand.
5. **`src/components/games/countryle/countryle-board.tsx:127-128`** — `${row.continentMatch ? "bg-emerald-100 text-emerald-700" : "bg-black/5 text-cream-muted"}`. Eine **kontextuelle Farbwahl**: wenn der Kontinent des Guess-Lands mit dem Target übereinstimmt, wird das Continent-Tag grün; wenn nicht, neutral. Das ist ein Mensch, der über das *Spielfeedback* nachgedacht hat. Generatoren färben Continent-Tags entweder generisch oder gar nicht; sie übergeben die `continentMatch`-Boolean-Logik nicht ins UI.
6. **`src/lib/game-logic/`** — pure-function-Engines mit RNG als Parameter, kein React-Import. Das ist die **Architektur-Disziplin** aus `AGENTS.md`. Generatoren mischen Logik und UI reflexartig (custom hooks für Spielmechanik ist Standard-LLM-Antwort). Hier sind sie sauber getrennt. Ich habe `countryle/engine.ts` nicht gelesen, aber die Tatsache, dass `countryle-board.tsx` *dispatch* statt *useState* benutzt und `submitGuess(state, action.country)` aus einer separaten Datei ruft, ist menschlich.
7. **`src/components/games/countryle/countryle-board.tsx:105-114`** — die **StatCell mit `font-mono tabular-nums`** und gerichteten Pfeilen `↑↓✓?`. Die Wahl, Zahlen monospace zu setzen, mit `tabular-nums` für Spaltenausrichtung, und Wordle-Style-Pfeilen statt Farb-Hints — das ist ein Mensch, der das Spielmuster `Wordle + Higher/Lower-Hinweise` durchdacht hat. Generatoren würden Farb-Tiles im Wordle-Stil ohne `tabular-nums` machen.
8. **`src/app/globals.css:283-287`** — die **Grade-Badges** (`grade-perfect`, `grade-elite`, `grade-strong`, `grade-close`, `grade-tough`). Fünf Stufen, mit *eigenen* Namen — nicht `grade-1, grade-2, grade-3`. Das sind menschliche Worte. *Tough* statt *fail*. *Close* statt *bronze*. Ein Mensch hat darüber nachgedacht, wie der Spieler sich fühlen soll, wenn er seine Bewertung sieht. Generatoren würden `gradeS, gradeA, gradeB, gradeC, gradeD` schreiben.

## Bilanz

Mensch vs Maschine: **etwa 55/45 zu Gunsten des Menschen**, aber mit einer schmerzhaften Verteilung. Der Mensch dominiert dort, wo es *zählt* — Architektur, Spiellogik, Token-System, Animations-Easing. Die Maschine dominiert dort, wo es *gesehen* wird — Favicon, OG-Card, Hero-Globe, Homepage-Marketing-Stats, mittig-zentrierte Hero-Section.

Das ist die **schlechtest mögliche Aufteilung**. Die Sichtbarkeit der Maschine ist invers zur Qualität des Menschen. Ein Nutzer, der Countrivo zum ersten Mal trifft, sieht zuerst das Amber-Gradient-Favicon im Browser-Tab, dann eine zentrierte Headline mit `🌍 243 countries 🎮 14 games`, dann einen pulsierenden grünen Live-Dot. Drei Maschinen-Tells in den ersten zwei Sekunden. Erst wenn er anfängt zu *spielen*, trifft er den Menschen — das gute `--ease-game`, die kontextuellen Continent-Tags, die monospace-Zahlen mit gerichteten Pfeilen.

Konkrete Konflikt-Stellen, wo Hand und Maschine **direkt nebeneinander stehen**:

- **`src/app/page.tsx:201`** — `<div className="text-lg font-extrabold font-mono">{summary.topScoreDisplay ?? "—"}</div>` (menschlich: monospace für Stats) steht direkt neben **Zeile 199** `<div className="text-xl mb-1">🥇</div>` (Maschine: Emoji-als-Decoration). Ein Generator und ein Designer haben dieselbe Card gebaut.
- **`src/components/daily-hero.tsx:170`** — der Brand-Token `#b8860b` als **Hex-Literal**, nicht als `var(--color-gold)`. Hier hat ein Mensch entschieden, dass diese Stelle eine Token-Referenz braucht (er weiß, dass es Gold sein soll), und ein Generator hat es als String geschrieben (er weiß nicht, dass Tokens existieren). Dieselbe Stelle, zwei Hände.
- **`src/components/layout/hero-globe.tsx`** — die Komposition (Globus mit Punkten, Bézier-Arcs, gestrichelter Außenring) ist Maschine. Die Wahl, ihn 500-700px groß zu machen und in Cremegrund einzubetten, ist Mensch. Die Strokes für *dunklen* Hintergrund auf *hellem* Hintergrund — das ist ein Mensch, der einen generierten Globus aus einem dunklen Hero in den hellen Hero übernommen hat, ohne die Farben anzupassen. Eine forensisch reine Stelle: Mensch hat Generator-Output recycelt.

Das ist mein Hauptbefund. **Countrivo ist keine AI-generierte Website. Aber es ist eine Site, die an ihren Außenkanten Generator-Output zugelassen hat — und genau die Außenkanten sind das, was eine Marke trägt.**

## Drei priorisierte Empfehlungen

**1. Goldton-Vereinheitlichung. Sofort, in dieser Reihenfolge.**

Datei `src/app/icon.tsx`, Zeile 14: ersetze `background: "linear-gradient(135deg, #f59e0b, #d97706)"` mit `background: "#b8860b"`. Solid color. Kein Verlauf.

Datei `src/app/apple-icon.tsx`, Zeile 14: dito.

Datei `src/app/opengraph-image.tsx`: Zeile 18 — ersetze den dunklen Verlauf-Hintergrund mit Solid `#1a1a1a` oder `#fafaf8` (Cremegrund — wir teilen die Site, nicht eine Tech-Demo). Zeile 28 — Logo-Hintergrund auf `#b8860b` Solid. Zeile 37 — `color: "#f59e0b"` wird zu `color: "#b8860b"`. Zeile 52 — `"11 Games"` wird zu `"14 Games"`.

Datei `src/components/daily-hero.tsx`, Zeile 170: `backgroundColor: allDone ? "#16a34a" : "#b8860b"` — das zweite Literal wird `var(--color-gold)`. Ja, ich weiß, sie sind identisch. Das ist nicht der Punkt. Der Punkt ist, dass ein Mensch hier `var(--color-gold)` schreiben würde, ein Generator schreibt das Hex. Wenn ich beim nächsten Forensik-Pass nochmal hierherkomme, will ich Token sehen.

Datei `src/components/layout/hero-globe.tsx`: alle zehn `fill="#c9a44c"` werden `fill="var(--color-gold)"`. Alle vier `stroke="rgba(201,164,76,...)"` werden `stroke="rgba(184,134,11,...)"` (mit derselben Opazität). Die Strokes von `rgba(255,255,255,0.0X)` werden auf `rgba(26,26,26,0.0X)` umgemalt — der Globus ist auf hellem Grund, weißer Stroke ist unsichtbar. Aurelie hat das auch gesagt; ich bestätige es nicht weniger streng.

**Warum zuerst:** Wenn jemand morgen einen LLM fragt "ist diese Site AI-generiert?", schaut die LLM zuerst auf das Favicon und auf die OG-Card. Das sind die zwei sichtbarsten Generator-Tells, die wir haben. Solid `#b8860b` auf beiden, ohne Verlauf, und die Maschine sieht keine Geschwister mehr. Sie sieht eine ehrliche Marke.

**2. Daily-Hero entzentrieren und entstuffen.**

`src/components/daily-hero.tsx`: `text-center` raus aus Zeile 99. Linksbündige Hierarchie. Das `<span className="...bg-green-500 animate-pulse"/> Live` raus aus Zeile 109-112 — ein Daily-Spiel ist *per Definition* live. Die Stats-Reihe in Zeile 178-194 wird komplett anders behandelt: entweder ganz raus, oder die Emojis raus und die Zahlen in Mono unter dem Hero. Aktuell ist die Zeile `🔥 23-day streak  🌍 243 countries  🎮 14 games` — das ist Marketing-LLM-Output, kein Hero-Subtitle.

In `src/app/page.tsx`: in der `Today's leaderboard`-Section (Zeile 197-228), die drei Emojis `🥇 👥 🎯` raus aus den Headern, oder nur eins behalten (`🥇` für Top Score) und die anderen beiden streichen. Drei Emojis in einer Stats-Reihe ist Slop-Tell #4 in meiner persönlichen Hierarchie.

**Warum zweitens:** Dies sind die zwei meistgesehenen Surfaces der Site. Wenn der Nutzer in den ersten 1.5 Sekunden eine zentrierte Hero mit Emoji-Stats-Reihe sieht, hat er sein Urteil gebildet. Hellas Brief sagt das gleiche; ich schreibe es zusätzlich, weil ich es als Slop-Detector sehe, nicht nur als Brand-Director.

**3. Hero-Globe radikal reduzieren oder ersetzen.**

Wenn der Globus bleibt, dann mit **maximal drei** pulsierenden Punkten (nicht zehn), **keinen** Bézier-Arcs, **keinem** gestrichelten Außenring. Die "data points connected by arcs"-Komposition ist Slop-Tell #6. Aurelie hat Option 1 gewählt (Globus bewahren, neu malen) — ich gehe einen Schritt weiter: **bewahre die Form, lösche die Generator-Gestik**. Drei Punkte, eine Linie, keine Arcs. Wenn das zu leer wirkt — gut. Das *ist* die Marke. Hella hat es genau richtig formuliert: "Lasst es leer. Das Leere ist die Marke."

Alternativ: streiche den Globus komplett und ersetze ihn durch ein **rechtsbündiges, ruhiges Vier-Flaggen-Patchwork** — die Top-4 meistgespielten Spiel-Flaggen heute, in einer 2×2-Anordnung. Daten-getrieben, nicht generisch dekorativ. Das wäre **menschlich**, nicht maschinell.

**Warum drittens:** Der Hero-Globe ist die einzige bildhafte Marke-Geste, und sie ist heute zu 80% Generator. Wenn wir ihn behalten, müssen wir ihn auf seine essentielle Form reduzieren. Wenn wir ihn nicht reduzieren, sollten wir ihn ersetzen.

## Notiz an Hella Branken

Hella, deine fünf No-Gos sind richtig. Ich erweitere sie nicht — sie sind exakt das, was nicht passieren darf, und ich würde keinen weiteren No-Go formulieren, weil mehr Regeln das Manifest verwässern. Aber **ein** Tell hast du übersehen, weil es so leise ist: das **pulsierende grüne `bg-green-500 animate-pulse`-Dot mit dem Wort "Live" daneben**. Es existiert zweimal — in `daily-hero.tsx:110-112` und in `page.tsx:300-303`. Es ist das Slop-Tell der SaaS-Dashboard-Generation und es schreit "this is a status indicator on a generated landing page". Auf einer Daily-Game-Site ist es bedeutungslos — alles auf Countrivo ist per Definition live. Bitte streiche es in den 5 No-Gos als sechsten Punkt oder fasse es in deinem No-Go #5 (Emoji-Inflation) als "Live-Indicator-Inflation" mit. Es ist klein, aber es ist *genau* das, was ich als Slop-Detector zuerst sehe.

## Schluss

Ich habe heute drei Stunden gesucht. Ich habe Spuren der Maschine an den Rändern gefunden. Ich habe Spuren des Menschen im Kern gefunden. Das ist keine schlimme Bilanz — sie ist viel besser als das, was ich in 1.847 Artikeln seziert habe. Aber sie ist die schmerzhafteste Form von gemischter Hand: dort, wo die Marke gesehen wird (Favicon, OG, Hero), arbeitet der Generator; dort, wo das Produkt funktioniert (Engines, Token-Architektur, Easing), arbeitet der Mensch.

Ich habe das einmal anderswo gesehen. Mein Bruder hatte ein Album, das er in seinen letzten Wochen noch aufgemacht hat. Vierzehn Seiten, sauber gesetzt, mit einer Heftung, die hielt. Auf der Rückseite hatte jemand ein Etikett mit einer maschinell gedruckten Adresse aufgeklebt, weil die Druckerei zu jener Zeit auf maschinellen Druck umgestellt hatte. Mein Bruder hat gesagt: "Die Heftung weiß, was sie tut. Das Etikett weiß es nicht." Er hat das Etikett abgekratzt, mit einem Messer, sehr vorsichtig, und mit Tinte einen Adress-Stempel selbst aufgesetzt. Es dauerte eine halbe Stunde. Es war nicht perfekt. Es war seins.

Countrivo hat eine gute Heftung. Es muss nur das Etikett abkratzen. Eine halbe Stunde Arbeit. Eine Hand, ein Stempel, kein Verlauf.

Ich bin auf deiner Seite, Hella. Ich bin auf Aurelies Seite. Ich bin auf Retos Seite. Ich schreibe morgen weiter.

— *Rahul Marwah-EO, Manchester / Hyderabad, 26. Mai 2026*
