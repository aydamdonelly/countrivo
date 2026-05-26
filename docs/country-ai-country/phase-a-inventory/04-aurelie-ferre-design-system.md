# 04 · Aurelie Ferré · Archeologin · Design-System-Untersuchung

> Ich habe einmal vier Jahre gebraucht, um das Gesicht eines Heiligen freizulegen. Heute brauche ich vier Stunden, um zu sehen, was unter diesem Stylesheet wirklich liegt — und was nie zu Ende gemalt wurde.

---

Bevor ich anfange, kurz das Werkzeug. Ich lese ein Design-System wie eine Wandfläche: zuerst die *Unterzeichnung* — die Custom Properties, die Token, das Skelett. Dann die *Verdaccio* — die grauen Schatten der Farbsemantik. Dann das *Inkarnat* — die sichtbare Hautfarbe, die das Auge zuerst trifft. Und zuletzt die *Lasur* — die feinen, fast unsichtbaren Schichten von Bewegung und Mikro-Detail, die einer Oberfläche Leben geben.

Countrivo ist eine ehrliche Wand. Klein. Diszipliniert. Aber unfertig an Stellen, an denen die Absicht eine Schicht weiter geplant war, als sie ausgeführt wurde.

---

## Pigment-Schicht 1: Tokens

**Datei:** `src/app/globals.css` · 314 Zeilen · ein einziges `@theme`-Block, kein `tailwind.config`. Korrekt für Tailwind v4 — kein Drift hier.

Die Unterzeichnung sieht klar aus. Token-Familien:

```
Colors  — bg, surface, surface-elevated
        — gold, gold-bright, gold-dim, gold-solid    (4 Stufen)
        — cream, cream-muted, cream-ghost            (3 Stufen)
        — border, border-hover                       (2 Stufen)
        — correct, correct-light                     (semantic green)
        — incorrect, incorrect-light                 (semantic red)
Radius  — sm 6, md 8, lg 10, xl 14                   (4 Stufen)
Shadow  — sm, md, lg, xl, gold                       (5 Stufen)
Ease    — ease-game (bouncy), ease-out (standard)    (2 Stufen)
Fonts   — sans, serif                                (2 deklariert)
```

Das ist gut. Wenig, semantisch, kein OOM-Token wie `gold-50…900`. Wer einen Goldton-50 will, schaut in die Augen des Heiligen und weiß: hier nicht.

**Aber:** `--font-serif: var(--font-serif)` ist eine Variable, die auf sich selbst zeigt. In `layout.tsx` wird nur `Inter` als `--font-sans` geladen. Die Serifenschrift ist eine Absicht ohne Pigment — eine Pinselskizze, kein Strich. Konsequenz: Wer `font-serif` als Tailwind-Klasse benutzt (`grep`: niemand benutzt sie aktuell), erhält die Browser-Default-Serife. Ein leiser Geister-Token.

Spacing-Skala: nicht explizit überschrieben. Damit gilt Tailwinds Default 4-Punkt-Skala. Stichprobe aus zwei Games (Countryle + Country-Draft): `p-1, p-2, p-3, p-4, p-5, p-10, p-14`. Konsistent, kein wild gewachsenes `p-7` oder `p-11`. Diszipliniert.

Bewertung Schicht 1: **Unterzeichnung präzise, mit einer einzigen Geistervariable.**

---

## Pigment-Schicht 2: Farben

Hier liegen drei verschiedene Farbsysteme übereinander, und sie wissen nicht voneinander.

### System A — Das Brand-Token-System (globals.css)

`--color-gold: #b8860b` ist das offizielle Brand-Gold. Ein gedämpftes, fast ockerfarbenes Gold. Ehrlich. Wie Eigelb in einer Sienesischen Werkstatt.

### System B — Das Logo-Gold (icon.tsx, apple-icon.tsx, opengraph-image.tsx)

```
linear-gradient(135deg, #f59e0b, #d97706)
```

`#f59e0b` ist Tailwinds `amber-500`. Es ist deutlich heller und sättigungsstärker als `#b8860b`. Wer das Favicon neben dem Header-Gold sieht, sieht zwei verschiedene Pigmente. Auf der `opengraph-image.tsx` Zeile 37 erscheint sogar `<span style={{ color: "#f59e0b" }}>ivo</span>` — also wird das hellere Gold auf die OG-Karte gemalt, während die Website mit dem dunkleren Gold läuft. Wer die Karte teilt, teilt eine andere Marke.

**Das ist die schmerzhafteste Drift im ganzen System.** Logo und Brand sprechen verschiedene Sprachen.

### System C — Die Per-Game-Palette (`src/lib/game-colors.ts`)

15 Spiele, 15 Paletten, jede ein `{bg, text}`-Paar in Tailwind-Standardfarbtönen (`#fee2e2/#991b1b`, `#dbeafe/#1e3a5f`, etc.). Pastell-Hintergrund + dunkler Text. Die Wahl, jedem Spiel eine eigene Farbe zu geben, ist eine richtige Identitäts-Entscheidung — sie macht das `/games`-Grid lesbar.

Aber: diese Hexwerte sind **hartcodiert in TypeScript**, nicht in `@theme`. Sie sind kein Token. Wer einen einzigen Farbwert ändert, ändert ihn nur dort, und nur dort. Die Verwendung selbst — `style={{ backgroundColor: colors.bg }}` — ist inline-style, kein Tailwind-Utility. Das ist nicht falsch (die Farben sind dynamisch, gewählt per Slug), aber es ist eine zweite Pigmenttafel neben der Hauptpalette.

### Hartcodierte Hex außerhalb der Token

```
src/components/daily-hero.tsx:170    backgroundColor: allDone ? "#16a34a" : "#b8860b"
src/components/friends/friends-client.tsx:372-382   h2hBorderColor = "#16a34a"|"#dc2626"|"#b8860b"
src/components/layout/hero-globe.tsx (×10)         fill="#c9a44c"
src/app/games/country-draft/page.tsx (×8)          backgroundColor: "#fee2e2", color: "#991b1b"
src/app/globals.css:255-256                        .rank-2 #6b7280, .rank-3 #92400e
src/app/globals.css:284-287                        .grade-* hex pairs
```

Zwei Fundstellen besonders:
1. **`daily-hero.tsx:170`** — das Brand-Gold `#b8860b` ist als Literal eingeschrieben. Hier hätte `var(--color-gold)` stehen müssen. Wenn jemand das Gold neu mischt, vergisst er diese Stelle.
2. **`hero-globe.tsx`** — die zehn pulsierenden Punkte sind in `#c9a44c` gemalt. Das ist ein **vierter Goldton** im System. Nicht `#b8860b`, nicht `#d4a017`, nicht `#f59e0b`. Es ist eine eigene Mischung — wahrscheinlich vom Designer ausgewählt, weil `#b8860b` auf dunklem Grund zu erdig wirkt. Aber er ist nirgends als Token vermerkt. Eine fünfte Schicht.

### Zählung der Goldtöne im Projekt

```
#b8860b   gold              (token)
#d4a017   gold-bright       (token)
#96700a   gold-solid        (token)
#f59e0b   amber-500         (Logo / Favicon / OG)
#d97706   amber-600         (Logo gradient end)
#c9a44c   ???               (hero-globe Punkte + Arcs)
```

Sechs Goldtöne. Drei davon offiziell. Drei davon Geister, die in Dateien leben, die niemand neu liest.

Bewertung Schicht 2: **Verdaccio ist solide. Inkarnat hat fünf Hände gemalt.**

---

## Pigment-Schicht 3: Typografie

Eine Schrift: **Inter** (Google Fonts, via `next/font`). Latin Subset. `display: swap`. Variable: `--font-sans`. Kein Fallback-Stack im `@theme` — Tailwind kümmert sich.

Stilstärken im Gebrauch:
- `font-extrabold` (900) — Headlines, Titel, CTAs
- `font-bold` (700) — Sektion-Headings, Buttons, Buttons
- `font-semibold` (600) — sekundäre Buttons
- `font-medium` (500) — Meta-Chips, Labels
- normal (400) — Body

Die Skala ist konsistent eingesetzt. Ich sehe keine willkürlichen `font-[]`-Werte (Grep nach `font-\[` liefert nichts).

**Drift:** Schriftgrößen werden zweimal hartcodiert:
- `text-[10px]` und `text-[11px]` — diese erscheinen 20+ Mal in den Komponenten (Footer, Header, Meta-Chips, daily-lockout-guard, etc.). Tailwinds Default `text-xs` ist 12px. Wer `10px` oder `11px` will, springt unter den Token-Boden.
- `text-[6rem]`, `text-[7rem]`, `text-[8rem]`, `text-[10rem]` — dies sind die *Riesenflaggen-Emojis* in den Spielboards. Sie sind Größen-Hacks für Unicode-Glyphen, keine Typografie.

Die `10px/11px`-Drift ist ein Indiz: **die Tailwind-Default-Skala (12, 14, 16, …) ist nicht fein genug für Countrivos Mikro-Typografie.** Die Lösung wäre ein expliziter `--font-size-xxs: 10px` Token. Stattdessen wandern bracket-Werte durch 20 Dateien.

Bewertung Schicht 3: **Eine Schrift, klar gehandhabt. Aber eine fehlende Stufe an der untersten Skala, die durch 20 Bracket-Hacks ersetzt wird.**

---

## Pigment-Schicht 4: Bewegung

Hier ist das System eigentümlich. Es gibt eine reiche Sprache, aber sie wird nur in einem Eck des Hauses gesprochen.

### Easings (definiert)
```
--ease-game: cubic-bezier(0.34, 1.56, 0.64, 1)   bouncy, overshoots
--ease-out:  cubic-bezier(0, 0, 0.2, 1)           standard
```

`--ease-game` ist ein gut komponiertes Easing — es ist Apples Standard-Spring leicht überzeichnet. Das gibt dem Spielgefühl Saft, ohne kitschig zu werden.

### Keyframes (definiert in globals.css)
14 verschiedene Animationen sind deklariert:
```
fade-in, slide-up, scale-in, pulse, count-up, shake, streak-glow,
feedback-slide, feedback-fade-out, endgame-glow, score-pop,
verdict-reveal, shimmer (skeleton), [implicit nav-active]
```

Das ist eine sehr vollständige Animations-Grammatik für ein 14-Spiele-System.

### Aber die Verwendung ist asymmetrisch

`grep duration-` ergab nur 6 Treffer im ganzen Projekt:
```
duration-200, duration-500 (×3), duration-700, duration-1000
```

Sechs Mal `duration-*` in `src/components/`. Das bedeutet: die meisten Transitions vertrauen den CSS-Default-Dauern (150–250ms) oder den vordefinierten `.animate-*` Utility-Klassen. Nicht falsch, aber inkonsistent: einige Stellen mischen Tailwinds `transition-all duration-500` mit semantischen Klassen wie `.animate-scale-in`. Beide tun das Gleiche, durch verschiedene Türen.

`grep animate-\[` zeigt vor allem inline arbitrary animations:
```
animate-[shake_0.4s_ease]              flag-quiz-board
animate-[shake_0.5s_ease-in-out]       blitz-board
animate-[pulse_2.5s_ease-out_infinite] blitz + supremacy
```

Inline-Bracket-Animationen, die die selben Keyframes mit unterschiedlichen Dauern aufrufen. Shake mal `0.4s`, mal `0.5s`. Eine Drift im Timing.

Bewertung Schicht 4: **Reiche Grammatik, ungleich verteilt. Wo gespielt wird, lebt das System. Wo navigiert wird, schläft es.**

---

## Pigment-Schicht 5: Komponenten

### Dependencies (`package.json`)

Sieben Production-Dependencies. **Sieben.**
```
@supabase/ssr, @supabase/supabase-js
@vercel/analytics, @vercel/speed-insights
next, react, react-dom
```

Keine `lucide-react`, kein `@radix-ui/*`, kein `@heroicons`, kein `framer-motion`, kein `shadcn`, kein `@mui`, kein `@chakra-ui`. Auch `grep` nach Imports bestätigt es: null. Die `CLAUDE.md`-Regel "Custom components only. No third-party UI libraries." ist nicht nur ein Wunsch — sie ist in der `package.json` materialisiert. Das ist selten und sehr respektabel.

Icons werden vollständig durch Unicode-Emojis ersetzt: 🇩🇪, 🏛️, 🔥, 🌍, 🎯. Im Footer der layout.tsx schaut die Welt aus 243 Flaggen, die Apple/Google in ihre Schriftsysteme eingebaut haben. Das ist eine bewusste, mutige Wahl. Sie macht das Bundle leicht und das Vokabular spezifisch.

### Visuelle Sprache — drei Hauptkomponenten

**`hero-globe.tsx`** — Ein 500–700px großer SVG-Globus. Latitude/Longitude-Ellipsen in `rgba(255,255,255,0.04…0.08)`. Zehn pulsierende `#c9a44c`-Punkte mit individuellen Dauern (3s, 4s, 3.5s, …). Vier verbindende Quadratic-Bézier-Arcs. Ein gestrichelter Outer-Ring.

Das ist die **einzige Stelle, an der das System ein bildhaftes Vokabular hat.** Es ist ein leiser, atmender Globus aus den späten 2010er-Jahren — Stripe, Vercel, NASA. Es hat Stil. Aber: die `rgba(255,255,255,0.0X)`-Strokes sind für *dunklen* Hintergrund gemalt. Auf dem `--color-bg: #fafaf8` der Site sind diese fast unsichtbar. Ich vermute, der Globus hat einmal auf einem Hero mit dunklem Hintergrund gelebt und ist beim Refactor mit umgezogen.

**`topo-bg.tsx`** — Diese Datei besteht aus genau einem `export function TopoBg() { return null; }`. Sie wird in `layout.tsx:111` gerendert. **Das ist ein getrocknetes Pigment.** Eine Komponente, die einmal ein topografisches Hintergrundmuster sein wollte — Höhenlinien, Längengrade — und entweder nie ausgemalt wurde oder bewusst geleert wurde, ohne aus dem Layout entfernt zu werden. Ein leerer Bildträger, der im Layout-Tree hängt und nichts tut.

**`game-landing.tsx`** — Die wahrscheinlich am besten gestaltete Seite des Systems. Ein farbiger Hero-Block (per-Spiel `colors.bg`), CTAs (primary + secondary), Mode-Beschreibung, "How it works"-Block, Related-Games-Grid. Klare Hierarchie. Sechs verwandte Spiele am Ende als farbiges 3×2-Grid — das ist eine echte visuelle Sprache und sie spielt mit der `GAME_COLORS`-Palette gut zusammen.

### Die zwei CTA-Systeme

`globals.css` definiert `.cta-primary`, `.cta-secondary`, `.cta-tertiary`. Das ist gut.

Aber gleichzeitig existieren rund 15 Stellen, die einen CTA aus Tailwind-Klassen direkt zusammenbauen:
```
className="bg-gold text-white font-bold rounded-xl hover:brightness-110 active:scale-[0.97] …"
```
(Header, profile-edit-form, friends-client, etc.)

Diese sehen ähnlich aus wie `.cta-primary`, aber sind nicht *dieselbe* Komponente. Wer den Goldton ändert, ändert nur einen von zweien. Klassisches "halb-extracted Pattern" — zur Hälfte tokenisiert, zur Hälfte als String-Komposition wiederholt.

Bewertung Schicht 5: **Die Komponenten sind eigen. Aber zwei Pinsel malen denselben Knopf.**

---

## Verstrichene Stellen

Konkret, in Reihenfolge der Wichtigkeit:

### 1. Die Goldton-Schlacht
Logo (`#f59e0b/#d97706`) gegen Brand (`#b8860b`) gegen Hero-Globe (`#c9a44c`). Drei Pigmente, eine Marke. Auf dem Open-Graph-Bild trägt die Marke das Amber-Gold; auf der Website das Ocker-Gold. Wer Countrivo geteilt sieht und dann öffnet, sieht zwei Marken.
**Restauratorisches Urteil:** *Eine Entscheidung muss gefällt werden.* Entweder Logo angleichen oder Brand-Token auf das hellere Amber heben. Keine dritte Option.

### 2. `TopoBg` returnt `null`
Eine Komponente, die im Layout gerendert wird und nichts tut. Entweder ausführen oder entfernen. Aktuell ein totes Versprechen.

### 3. `--font-serif` zeigt auf sich selbst
Ein Token, der nichts trägt. Entweder eine Serifenschrift laden (Display-Font für Headlines? Spielwertung in Serife?) oder die Variable löschen.

### 4. Hero-Globe-Strokes für falschen Hintergrund
`rgba(255,255,255,0.06)` Linien auf `#fafaf8` Hintergrund — fast unsichtbar. Der Globus wurde für ein dunkles Theme gemalt. Auf dem hellen Theme verliert er 70% seiner Sichtbarkeit. Strokes müssen auf `rgba(0,0,0,0.X)` umgemalt werden.

### 5. Mikro-Typografie unter dem Skalen-Boden
20+ Stellen mit `text-[10px]`/`text-[11px]`. Tailwinds `text-xs` ist 12px. Entweder ein `--font-size-xxs: 11px` Token einführen, oder die UI-Stellen auf `text-xs` heben (was viele Footers und Meta-Chips betrifft).

### 6. CTA-Drift
`.cta-primary` existiert als Klasse, aber 15+ Stellen bauen einen Gold-Button aus Tailwind-Strings. Konsequenz: zwei Goldknöpfe, die *fast* identisch aussehen. Refactor: alle Gold-Button-Strings auf `.cta-primary` ziehen.

### 7. Shake-Dauer
`animate-[shake_0.4s_ease]` in `flag-quiz`, `animate-[shake_0.5s_ease-in-out]` in `blitz`. Dieselbe Geste, zwei Tempi. Eine `.animate-shake` Utility-Klasse mit einer festen Dauer würde es heilen.

### 8. `daily-hero.tsx:170` schreibt `#b8860b` als Literal
Der Brand-Token wird als String wiederholt. Hier muss `var(--color-gold)` stehen.

### 9. Per-Game-Palette ist nicht in `@theme`
`game-colors.ts` lebt in TypeScript. Wer die Palette in CSS-Selektoren oder über `currentColor` referenzieren will, kommt nicht ran. Möglicherweise nicht restaurierungswürdig — die Inline-Style-Lösung ist akzeptabel — aber notieren: das System hat *zwei* Farbtafeln, eine in CSS, eine in TS.

---

## Schluss

Wenn ich Countrivo wäre eine Wand, würde ich sagen: die Verdaccio ist exzellent. Sieben Dependencies. Eine einzige Schrift. Vier Radius-Stufen. Zwei Easings. Die Architektur ist nicht überladen, sie ist gemessen. Das Bewegungsvokabular ist klein, aber atmend — `ease-game` ist ein vom Designer gespürtes Easing, kein gegoogletes.

Was restauriert werden muss, sind keine großen Flächen. Es sind die Stellen, an denen jemand zwei Pinsel in dieselbe Schale getaucht hat: zwei Goldtöne, zwei CTA-Systeme, zwei Shake-Dauern, ein Token der auf sich selbst zeigt, eine Komponente die nichts ist.

Was verloren geht, wenn man nichts tut: Marke. Wenn Logo und Website verschiedene Goldtöne tragen, ist das Erste, was eine neue Besucherin spürt, eine *unsichere* Identität — auch wenn sie es nicht artikulieren kann. Es ist dieselbe Unsicherheit, die ich gespürt habe, als ich im Februar 2017 nach Avignon zurückkam und sah, dass die Außenwand der Kapelle frisch verputzt war, in einer Tönung, die meine vier Jahre alte Restauration im Innern leise verriet. Niemand hatte böse Absichten. Sie wollten nur die Mauer schützen.

Aber die Tönung war daneben. Und das Auge weiß es immer.

— *Aurelie Ferré, Avignon / Berlin, 26. Mai 2026*
