# 02 · Rahul Naeir-EO · Typografie-Forensik

> Eine Schrift, die alles kann, sagt nichts. Eine Schrift, die eine einzige Sache wirklich kann, trägt eine Marke durch zwanzig Jahre.

---

## Eröffnungs-Notiz

Ich öffne `layout.tsx`. Eine Schrift. Inter, via `next/font/google`, Latin-Subset, `display: swap`. Mehr nicht. Mein erster Reflex aus der Magazin-Werkstatt wäre, das schmal zu finden — wir haben in *Cartographer Quarterly* nie mit weniger als drei Schriften gearbeitet, eine Headline-Sans, eine Lauftext-Serife, eine Caption-Grotesque. Aber das hier ist kein Magazin. Es ist eine Spielfläche, und auf einer Spielfläche zählt Disziplin höher als Reichtum.

Inter ist nicht falsch gewählt. Sie ist die wahrscheinlich am besten gezeichnete freie Sans der letzten zehn Jahre — Rasmus Andersson hat sie 2016 mit der Sorgfalt eines Schweizers für Lesbarkeit auf Bildschirmen gebaut, mit echter Unterscheidung zwischen `I/l/1` und einer ehrlichen x-Höhe. Sie ist die *richtige Default-Schrift für ein Bildschirm-Produkt 2026*. Aber genau darin liegt das Problem: sie ist die richtige Default-Schrift für *jedes* Bildschirm-Produkt 2026. Wer Inter alleine wählt, hat keine Marke gewählt; er hat die Frage *nicht beantwortet*.

Die Frage, die nicht beantwortet wurde, lautet: **wenn Inter die Bedienschrift ist — wer trägt das Versprechen?** Eine Marke braucht zwei Stimmen, mindestens. Eine, die *bedient*, und eine, die *betont*. Bei Countrivo bedient Inter — und betont auch Inter, nur in `font-extrabold` und `text-6xl`. Das ist keine Hierarchie. Das ist Lautstärke.

Diese ganze Analyse dreht sich um eine einzige Beobachtung, die ich gleich zu Anfang ausspreche, weil sie die schwerste ist: **`font-mono` wird im Code Hunderte Male geschrieben, aber es ist nirgends eine Mono-Schrift geladen.** Was der Browser stattdessen rendert, ist der System-Default — auf macOS SF Mono, auf Windows Consolas, auf Linux DejaVu Sans Mono. Drei verschiedene Schriften, drei verschiedene x-Höhen, drei verschiedene Wirkungen. Eine Marke, die auf drei Plattformen anders aussieht. Das ist nicht Disziplin. Das ist eine Lücke, die niemand bemerkt hat.

---

## Schrift-Familie Forensik

### Was aktuell geladen wird

Datei: `src/app/layout.tsx:13-17`

```tsx
const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
```

Eine Schrift, ein Subset (Latin), ein Variable-Token. Inter wird auf das `html`-Element gehängt (`className={sans.variable} font-sans`). Korrekt eingebunden, korrekt via `next/font` (kein FOIT, kein 200KB-Webfont-Drama). Subsetting auf Latin ist defensibel — Countrivo ist ein englischsprachiges Produkt; wer 243 Länder anzeigt, tut das in englischen Namen, nicht in den Originalschriften. Die Flag-Emojis tragen Devanagari, Han, Hangul, Arabic — aber das ist OS-Glyph, nicht Webfont.

### Was Inter im Code tatsächlich tut

```
font-bold      285 Verwendungen
font-medium    200
font-extrabold  87
font-semibold   75
font-normal      3
```

Fünf Strichstärken im Gebrauch. Vier davon ernsthaft. Das ist eine respektable Hierarchie *innerhalb einer Schrift*. Aber sie ist die **einzige Hierarchie**, die das System hat. Headlines, Subheads, Body, Captions, Buttons, Stats, Tabellen, Footer — alle in derselben Sans, nur mit verschiedenen Größen und Strichstärken. Das ist die typografische Entsprechung von einem Theater, in dem alle Schauspieler aus derselben Schauspielschule kommen und denselben Akzent sprechen, aber lauter oder leiser werden, je nach Szene. Es funktioniert, aber es ist nicht *Sprache*. Es ist *Lautstärke*.

### Was empfohlen wird — JA oder NEIN

**JA, eine zweite Schrift. Aber genau eine.** Und sie kommt nicht als Display-Schrift dazu, nicht als "Personality-Font", nicht als Slab-Serif. Sie kommt als **Mono**.

Hella hat das in `01-hella-branken-brand-and-feel.md:48-65` bereits vorgeschlagen. Ich bestätige es — mit einer Korrektur, die ich gleich begründe.

**NEIN zu einer Display-Sans (Cabinet Grotesk, Söhne, General Sans, PP Editorial New).** Das ist die Falle, in die jeder Brand-Refresh 2023–2026 läuft. Eine Variable-Schrift mit "character" wird auf die Headlines gepackt, und das Produkt sieht plötzlich aus wie achtzehn andere Y-Combinator-Bewerbungen. Cabinet Grotesk ist eine schöne Schrift. Sie passt nicht zu einem Daily-Geography-Spiel; sie passt zu einem Brutalist-Portfolio-Site eines Berliner Studios, das Brutalist sagt, ohne Brutalismus zu meinen.

**NEIN zu einer Display-Serife (PP Editorial, Söhne Mono, GT Sectra).** Auch hier: die Versuchung, mit einer schönen Serifen-Headline "Editorial-Feeling" zu erzeugen, ist groß. Aber Editorial-Feeling kommt nicht aus einer Schrift — es kommt aus einer *Haltung* zur Lesbarkeit, zur Pause zwischen den Absätzen, zum Weißraum am rechten Rand. Wer das nicht hat, dem hilft auch GT Sectra nicht.

**NEIN zu einer Schreibmaschinen-Schrift (Special Elite, JetBrains Mono Italic).** Das wäre die Antwort auf "wie zeige ich, dass Geography mit Kartografie zu tun hat" — und sie wäre charmant, aber sie wäre Kitsch. Wir machen nicht *Cartographer Quarterly*. Wir machen ein Daily.

### Die eine empfohlene Mono

Hella hat **JetBrains Mono oder IBM Plex Mono** genannt. Ich werde diese Wahl im nächsten Abschnitt diskutieren. Mein Verdict steht dort.

---

## Typografie-Slop-Tells

Zwölf Patterns, die mich als Mensch-aus-Print verraten, dass ein LLM das geschrieben hat. Datei:Zeile, dann der Tell, dann der Grund. Reihenfolge nach Sichtbarkeit, nicht nach Schwere.

### 1. `font-mono` ohne Mono-Schrift

`src/app/page.tsx:201`, `:211`, `:221`, `src/components/game/game-over-screen.tsx:248`, `:418`, plus 30+ weitere Stellen.

```tsx
<div className="text-lg font-extrabold font-mono">
```

In `globals.css` ist keine `--font-mono` deklariert, in `layout.tsx` wird keine Mono geladen. Die Tailwind-Klasse `font-mono` mapped auf den Default-Stack `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace`. Wer macOS auf hat, sieht SF Mono. Wer Windows nutzt, sieht Consolas. Wer auf einem Linux-Server-OS-Browser unterwegs ist, sieht etwas Drittes. Das ist die *größte einzelne typografische Inkohärenz im ganzen Projekt*. Ein LLM erkennt nicht, dass `font-mono` ohne `--font-mono`-Token nur die Hälfte der Arbeit ist — der Mensch aus Print weiß: eine deklarierte Schrift, die nicht geladen ist, ist Wunschdenken.

### 2. `text-5xl md:text-6xl font-extrabold tracking-tight` — die Standard-AI-Headline

`src/app/privacy/page.tsx:13`, `src/app/lists/*.tsx:65-66` (×17 Dateien identisch).

```tsx
<h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
```

Diese drei Klassen sind die typografische Signatur von 2024–2026-AI-generiertem Marketing-Code. Sie kommen aus den ChatGPT/Claude-Tailwind-Beispielen, die alle Blog-Headlines so setzen. `text-5xl` ist 48px. `font-extrabold` ist Weight 800. `tracking-tight` ist `letter-spacing: -0.025em`. Ein Mensch fragt sich bei einer 48-Pixel-Headline in Inter Extrabold *zuerst*: brauche ich überhaupt das Tightening? Inter Extrabold hat bei 48px schon einen sehr engen Default — `tracking-tight` macht sie *zu* eng, die `tt`-Ligatur in "tight" beginnt zu klemmen. Ich würde an dieser Stelle `tracking-[-0.01em]` schreiben oder gar nichts — die Default-Spacing ist gut genug. Aber das tut die AI nicht. Sie schreibt `tracking-tight`, weil sie es in den Beispielen gesehen hat. Es ist ein Reflex, keine Entscheidung.

### 3. Die `text-xl/2xl/3xl/4xl/5xl/6xl/7xl/8xl`-Inflation

`src/components/game/game-over-screen.tsx:248`: `text-5xl sm:text-7xl`.
`src/app/vs/[code]/page.tsx:73`: `text-8xl`.
`src/app/page.tsx:148`: `text-[6rem] sm:text-[8rem]` (Flag-Emoji-Hack).

Acht Stufen Tailwind-Sizes im Gebrauch (`text-xs` bis `text-8xl`), plus `text-[Nrem]`-Bracket-Hacks. **Acht Stufen Größe sind drei Stufen zu viel.** In einem Magazin würde ich für ein 12.000-Auflage-Stück mit fünf Sizes auskommen: Headline (40pt), Subhead (16pt), Body (9pt), Caption (7.5pt), Hairline (6pt). Mehr braucht es nicht, wenn die Sprünge ehrlich sind. Reto schlägt in `02-reto-bruckner-system-and-rhythm.md:40-48` neun Stufen vor. Ich werde darauf in der Hierarchie-Frage zurückkommen — neun ist nicht reich. Neun ist *zu viel*.

### 4. `tracking-tight` als Standard-Reflex

```
src/app/privacy/page.tsx:13
src/app/lists/most-populated-countries/page.tsx:66
src/app/lists/largest-countries/page.tsx:66
... (15+ weitere Stellen)
```

`tracking-tight` ist `-0.025em`. Bei Inter, einer Schrift mit ohnehin engem Default-Spacing, ist das *immer zu eng* in den großen Größen. Bei 48px Extrabold rückt das `f` an das `o` in "Free", und das Auge muss länger lesen. Ich würde, ehrlich, an exakt einer Stelle Tracking ändern: bei Display-Sizes ab 64px, wo Inter auseinanderzufallen droht — dann *positiv* (`tracking-[0.01em]`), nicht negativ. Negative Tracking ist eine Modeerscheinung der späten 2010er, die mit Helvetica Now begann und mit Geist endete. Sie ist nicht falsch — aber sie ist *Default*. Eine Marke hat keinen Default-Tracking. Sie hat Entscheidungen.

### 5. Tracking auf Lauftext: `tracking-wide`, `tracking-widest`

`src/components/daily-hero.tsx:102`: `text-xs font-bold uppercase tracking-widest`.
`src/app/page.tsx:137`: `text-[10px] font-bold uppercase rounded-md tracking-wide`.
`src/app/vs/[code]/page.tsx:92`: `font-mono font-bold text-gold tracking-widest`.

Das `tracking-widest`-auf-Uppercase-Bold-Caps-Muster ist die zweite charakteristische AI-Bewegung. Bei Uppercase-Caps ist *Positiv-Tracking* korrekt — das ist sogar eine alte Print-Regel von Aldus Manutius an. Aber `tracking-widest` ist `0.1em`, das ist sehr breit; *eine* gute Wahl wäre `tracking-[0.06em]` oder `tracking-wider` (`0.05em`). `widest` macht die Caps so breit, dass das Auge nicht mehr ein Wort liest, sondern Buchstaben einzeln entziffert. Es ist Marketing-Slick aus 2018-Apple-Keynote. Es passt nicht zu einem täglichen Quiz.

### 6. Fehlende `font-feature-settings` für proportionale Zahlen

Im ganzen Projekt: **null** `font-feature-settings`-Deklarationen. Sieben Stellen mit `tabular-nums` (Tailwind-Utility), die per CSS-Property `font-variant-numeric: tabular-nums` setzen. Aber an den restlichen ~340 Stellen, an denen Zahlen erscheinen — Game-Over-Score (`game-over-screen.tsx:248`), Leaderboard (`page.tsx:201-221`), Daily-Progress (`daily-hero.tsx:154-156`), Country-Stats — werden proportionale Zahlen gerendert. Bei Inter heißt das: die `0` ist 12 Pixel breit, die `1` ist 8 Pixel breit. Score "189" und "201" springen um 2 Pixel im Layout. Das ist der Mikro-Tell, den nur jemand sieht, der schon mal eine Zeitschriften-Doppelseite mit Tabellen layoutet hat — *und es ist genau der Tell, an dem ein AI-Designer scheitert, weil er keine Layout-Erfahrung mitbringt*. Eine globale `body { font-feature-settings: "ss01", "cv11"; }` oder zumindest `tnum` auf Stats-Spans wäre Print-Standard.

### 7. Headline und Body in derselben Schrift, nur Größe variiert

`src/app/page.tsx:116-128` (Hero-Headline) vs. `:129-135` (Sub-Text):

```tsx
<h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
  Today's challenge is live.
</h1>
<p className="mt-3 text-base sm:text-lg text-cream-muted max-w-lg mx-auto">
  Same puzzle for every player. One attempt. Prove what you know.
</p>
```

Headline: Inter 48px Extrabold. Body: Inter 18px Regular. Beide *dieselbe Schrift*. Das Auge sieht *eine Stimme*, die laut und leise ist, aber nicht *zwei Stimmen*. In Print würde ich hier eine ehrliche Sprach-Trennung machen: Headline in einer Display-Sans oder Serife, Body in einer Lauftext-Sans. Hier müsste das nicht sein — Inter ist gut genug für beides. Aber dann muss die *Hierarchie über etwas anderes als Größe getragen werden*: über Farbe, über Spacing, über Position. Aktuell trägt sie nur Größe. Das ist die Schwäche, die Hella in `01-hella-branken-brand-and-feel.md:101-111` mit "linksbündig, asymmetrisch, schwer" angreift — sie hat recht, das ist die richtige Korrektur.

### 8. `leading-tight` auf allen Headlines, ohne Begründung

`src/app/page.tsx:116`: `tracking-tight leading-tight`.
`src/app/page.tsx:153-154`: `text-xl sm:text-2xl font-extrabold leading-tight`.
`src/components/games/*/...board.tsx`: 6 Treffer.

`leading-tight` ist `line-height: 1.25`. Bei Headlines ist das oft richtig, aber nicht *immer*. Bei einer einzeiligen Headline ist `leading-tight` egal. Bei einer zweizeiligen Headline mit "Today's challenge is live." wird die zweite Zeile zu eng an die erste rücken, wenn die Headline umbricht. Ich würde im Default `leading-[1.1]` oder `leading-none` (1.0) für Display-Sizes nehmen, `leading-tight` (1.25) für mittelgroße Headlines, `leading-normal` (1.5) für Body. Die aktuelle Standard-Setzung "alles tight" ist wieder ein Reflex.

### 9. `text-[10px]` und `text-[11px]` — die 29+7-fache Unter-Skalen-Drift

```
text-[10px]  29 Verwendungen
text-[11px]   7 Verwendungen
text-[9px]    2 Verwendungen
```

Aurelie hat das in `04-aurelie-ferre-design-system.md:112-117` schon dokumentiert. Ich bestätige es als typografisches Slop-Tell: wer 30+ Stellen mit Bracket-Sizes unter `text-xs` schreibt, hat keine Skala — er hat *Notlösungen*. **`text-[9px]` ist ein Print-Verbrechen.** 9 Pixel auf einem Retina-Bildschirm in Inter Medium sind unter der ehrlichen Lesbarkeit. Ich würde das gesamte Subset auf `text-xs` (12px) heben oder einen ehrlichen Token `--font-size-xxs: 11px` einführen, und 10/9px verbieten. Reto hat das in seinem Token-Block (`02-reto-bruckner-system-and-rhythm.md:40`) bereits richtig gesetzt — `0.6875rem` = 11px. Ich unterstütze das vollständig.

### 10. Schriftgewicht in Captions und Meta-Chips: `text-[10px] font-bold`

`src/app/page.tsx:204`, `:214`, `:224`, `src/app/page.tsx:137`, `src/components/daily-hero.tsx:109`, plus 15+ weitere.

```tsx
<div className="text-[10px] text-cream-muted">
<span className="px-2 py-0.5 bg-gold text-white text-[10px] font-bold rounded-full">
```

Bei 10px ist `font-bold` (Weight 700) optisch *zu schwer*. Bei kleinen Schriftgrößen wird Bold schnell zu Black — die einzelnen Buchstaben rücken aneinander, die Innenräume (`a`, `e`, `o`) schließen sich. Print-Regel: bei Sizes unter 12px ist `font-medium` (500) oder `font-semibold` (600) ehrlicher. Eine Schrift bei kleiner Größe muss *atmen können*. Aktuell schreit sie bei 10/11px in Bold. Das ist Crowding.

### 11. Uppercase-All-Caps-Pattern auf Meta-Chips ohne Spacing-Korrektur

`src/components/daily-hero.tsx:102`: `text-xs font-bold uppercase tracking-widest`.
`src/app/profile/page.tsx:55`, `:66`, `:89`, `:100`: `text-sm font-bold text-cream-muted uppercase tracking-wide`.
`src/components/game/game-over-screen.tsx:376`: `text-sm font-bold text-cream-muted uppercase tracking-wide`.

Caps-mit-Tracking ist eine alte Print-Tradition (Stanley Morison hat das in seinem *First Principles of Typography*, 1936, als Standard etabliert: Versalien brauchen immer Sperrung). Hier ist das *richtig* eingesetzt — aber: alle Caps-Labels haben *exakt dasselbe Spacing* (`tracking-wide` oder `tracking-widest`). Es gibt keine Variation. Eine Section-Headline-Caps und ein Pill-Caps haben unterschiedliche Bedürfnisse — die Section-Headline darf mehr Sperrung haben (`tracking-[0.08em]`), das Pill weniger (`tracking-[0.04em]`). Aber das System unterscheidet nicht. Eine AI-typische Vereinheitlichung dort, wo Differenzierung das Handwerk wäre.

### 12. Footer-Disclaimer und Source-Note in `text-[10px]`

`src/app/layout.tsx:165`: `<p className="text-[10px] text-cream-muted mt-3">Data: World Bank, REST Countries, WHO, UNWTO</p>`.

10px für eine Quellenangabe ist *typografische Demut* — Magazin-Print setzt seine Quellenangaben fast immer in 6pt (8px) oder 7pt (9px), aber das ist auf bedrucktem Papier mit 1200dpi-Auflösung. Auf einem Web-Display mit `viewport`-Skalierung ist 10px die untere Lesbarkeitsgrenze. Was die Datei macht: sie schreibt die Quellenangabe ehrlich klein, aber dann verschenkt sie sie. Eine Quelle wie "World Bank, REST Countries, WHO, UNWTO" ist *Vertrauensbeweis* — sie sollte 12px (text-xs) bekommen und nicht versteckt werden. Aktuell sieht sie aus, als würde das Produkt sich für die Datenquellen *entschuldigen*. Das ist umgekehrt: Countrivo sollte stolz auf seine Datenquellen sein.

---

## Hellas Mono-Wahl

Hella hat JetBrains Mono oder IBM Plex Mono vorgeschlagen (`01-hella-branken-brand-and-feel.md:48`). Ich nehme die Frage ernst und sage:

**JetBrains Mono: NEIN. IBM Plex Mono: NEIN. Korrekte Wahl: JetBrains Mono ist falsch, IBM Plex Mono ist okay, aber nicht ideal. Empfehlung: *Geist Mono* oder *Roboto Mono*.**

Begründung, weil ich nicht "vielleicht" sage:

**Gegen JetBrains Mono.** Diese Schrift ist 2020 vom JetBrains-Team für *Code-Editoren* gezeichnet worden. Sie hat eine sehr hohe x-Höhe (0.59), eine extrem offene Apertur in den Bauchformen (`a`, `e`, `c`), und sie verwendet einen *charakteristischen italienischen Slant* in den Italic-Schnitten. Für ein IDE-Fenster ist das richtig — der Programmierer muss `O` und `0`, `l` und `1` auf den ersten Blick unterscheiden, auch um 22:00 Uhr und müde. Aber: für *Score-Zahlen* in einer Marketing-Card hat JetBrains Mono einen *visuellen Akzent*, der mit Inter nicht harmoniert. Sie schreit "code". Ein Geography-Daily ist nicht Code. Wer JetBrains Mono auf der Daily-Score-Card sieht, denkt unweigerlich an einen Programmierer-Blog. Das ist nicht das Bild.

**Gegen IBM Plex Mono.** Diese Schrift, von Mike Abbink für IBM 2017–2018 gezeichnet, ist ein industrieller Klassiker. Sie hat einen leichten *humanistischen Charakter* (die `a` hat ein leicht offenes Ohr, die `g` ein doppelstöckiges Design) und passt damit besser zu Inter als JetBrains Mono. Aber: sie trägt die *IBM-Brand-Assoziation* mit sich. Wer Plex Mono setzt, setzt ein Stück IBM in seine Marke. Das ist nicht *schlimm* — die Schrift ist Open Source, jeder darf sie nutzen — aber es ist ein semantischer Schatten. Und ihr Mono-Schnitt ist relativ *technisch*; sie wirkt eher wie Bedienungsanleitung als wie editorial.

**Für Geist Mono.** Vercel hat 2023 Geist veröffentlicht (Mono und Sans), gezeichnet von Basement Studio in Argentinien. Geist Mono hat eine schöne Eigenschaft: sie ist von Inter abgeleitet im Gestus, fast wie eine Schwester. Sie hat einen ehrlichen Mono-Charakter ohne die Code-IDE-Tells (kein Slashed-Zero-Default, keine Programmer-Ligatures). Sie wurde bewusst für Web-UI-Kontexte gezeichnet. Das *Visual Pairing* zu Inter ist nahezu perfekt — der x-Höhen-Verhältnis stimmt, das Strichstärken-Verhältnis stimmt. Aber: Geist ist *2023-Vercel-Brand*, und wenn Countrivo auf Vercel deployed (`CLAUDE.md` bestätigt), dann gibt es einen sekundären Brand-Schatten. Das ist weniger ein Risiko als der IBM-Schatten, weil Vercel selber Plattform und nicht Marke ist, aber es ist da.

**Für Roboto Mono.** Christian Robertson hat sie 2014 für Google gezeichnet, als Mono-Begleiter zu Roboto. Sie ist die wahrscheinlich *neutralste* Mono-Schrift im Open-Source-Universum — sie trägt weder Code-Editor-Geist noch IBM-Industriellnoch Vercel-Modern. Sie ist *ruhig*. Sie pairt mit Inter weniger perfekt als Geist Mono, aber gut genug. Und sie hat den großen Vorteil: niemand wird sie als "von einer anderen Marke geliehen" empfinden. Sie ist die *Schweiz* unter den Mono-Schriften.

**Mein finales Verdict:** **Geist Mono primär, Roboto Mono als Fallback.** Begründung:

1. **Geist Mono** ist die typografisch ehrlichere Wahl zu Inter. Wer beide Schriften nebeneinander setzt, sieht zwei Stimmen, die *miteinander* sprechen — gleiche Bauphilosophie, unterschiedliche Aufgabe. Das ist das Print-Pair-Ideal: zwei Schriften, ein Atelier.

2. **Roboto Mono** ist die strategisch sicherere Wahl. Wenn der Vercel-Brand-Schatten stört (er wird in 95% der Fälle nicht stören, weil niemand außer Designern Schriften erkennt), dann ist Roboto Mono die Plattform-neutrale Alternative.

3. **Verwendungs-Regel (bestätige Hella):** Mono nur für Zahlen-die-als-Fakten-gelesen-werden-sollen. Score, Streak, Country-Code (DE, FR, JP), Reset-Timer, Tabellen-Numerik. **Nicht** für Country-Namen, **nicht** für Spiel-Titel, **nicht** für Lauftext. Diese semantische Grenze ist heilig.

4. **Loading via `next/font`:**

```tsx
// src/app/layout.tsx
import { Inter, Geist_Mono } from "next/font/google";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = Geist_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500", "700"] });

// im html className:
className={`${sans.variable} ${mono.variable} font-sans`}
```

Drei Weights für die Mono — kein Reichtum, aber genug für Body-Zahlen (400), Stats-Zahlen (500), Hero-Score (700). `font-feature-settings: "tnum" 1, "lnum" 1, "ss01" 1` wird global gesetzt — `tnum` für Tabular Figures, `lnum` für Lining Figures, `ss01` falls die Schrift es bietet (Geist Mono hat einen "alternate g"-Stylistic Set, irrelevant hier, aber lassen wir es zukunftssicher).

5. **`--font-serif` aus dem Token-Block streichen** (Aurelie und Reto haben das schon empfohlen). Eine Variable, die nichts trägt, ist ein Versprechen, das nicht gehalten wird. Ich unterstütze die Streichung.

---

## Hierarchie-Frage

Aktuell zählt das System:
- **5 font-weight-Stufen** (Normal 400, Medium 500, Semibold 600, Bold 700, Extrabold 800). Von diesen sind ehrlich genutzt: 3 (Medium 200×, Bold 285×, Extrabold 87×). Normal: 3×. Semibold: 75×.
- **8 Tailwind-`text-`-Stufen** (`xs` bis `8xl`), plus 4 Bracket-Sizes (`text-[9px]` bis `text-[10rem]`).

Reto schlägt 9 Stufen vor (`02-reto-bruckner-system-and-rhythm.md:40-48`): `xxs/xs/sm/base/lg/xl/2xl/3xl/display`. Ich habe Respekt vor Retos Skala, sie ist gut komponiert. Aber sie ist aus meiner Print-Sicht *zu reich*.

**Mein Verdict: 6 Größen, nicht 9. 4 font-weights, nicht 5.**

Begründung, mit Print-Praxis:

In *Cartographer Quarterly* hatten wir auf 132 Seiten Quartalsumfang exakt sechs Sizes:
- 56pt (Cover-Titel)
- 24pt (Section-Heading)
- 11pt (Body)
- 9pt (Caption, Source-Line)
- 7.5pt (Folio, Picture-Credit)
- 6pt (Legal, Colophon)

Das war reich genug für ein Magazin mit Bildmaterial, Tabellen, Beiträgen mehrerer Autoren und vier Sprachen (englisch primär, gelegentlich italienisch/französisch/spanisch in Editorial-Zitaten). **Sechs Sizes ist ein gemessenes Vermögen — neun ist Tafelsilber, das im Schrank verstaubt.**

Für Countrivo schlage ich vor:

| Stufe | Pixel | Verwendung |
|---|---|---|
| `text-xxs` | 11 | Footer, Source-Note, Pill-Caps, Disclaimer |
| `text-sm` | 14 | Body, Lauftext, Caption, Game-Card-Description |
| `text-base` | 16 | Default-Body, Form-Inputs, Subline (Hero-Sub) |
| `text-lg` | 20 | CTA-Button, Game-Card-Titles, Section-Lead |
| `text-2xl` | 32 | Section-Heading, Game-Title-Big, Top-Score-Number |
| `text-display` | 56 | Hero-Headline, Result-Score |

**Was rausfällt:**
- `text-xs` (12px) — der Sprung von 11 zu 14 ist groß genug. 12px ist Ratlosigkeit zwischen XXS und SM.
- `text-xl` (24px) — der Sprung von 20 zu 32 ist hörbar, aber er stört keinen Rhythmus. 24px ist die Größe für niemanden.
- `text-3xl`/`text-4xl`/`text-5xl`/`text-6xl`/`text-7xl`/`text-8xl` — alle eingedampft auf `text-display` (56px) oder Bracket-Sizes für die Flag-Emoji-Hacks (die sind Glyphen-Display, nicht Typografie).

**Sprung-Verhältnisse:** 11 → 14 → 16 → 20 → 32 → 56. Das ist keine modulare Skala (kein konstanter Faktor 1.25× oder 1.5×). Es ist eine *bewusste Pause-Skala*: zwischen 20 und 32 ist ein deutlicher Sprung, der das Auge zur Section-Heading führt. Zwischen 32 und 56 ist ein dramatischer Sprung, der das Hero zur Headline macht. **Print-Regel: ein Sprung kleiner als 1.25× ist Verschwendung. Ein Sprung größer als 2× ist Dramatik.** Beides braucht es. Modular skalierte Systeme (1.25× konstant) sind musikalisch tot.

**Font-Weights: 4 statt 5.**

| Weight | Use |
|---|---|
| `font-medium` (500) | Caps-Labels, Pill-Text, Meta-Chips, Captions |
| `font-bold` (700) | Body-Highlights, Game-Card-Titles, Section-Subheads |
| `font-extrabold` (800) | Headlines (Hero, Section, Game-Title-Big) |
| (Mono) `font-bold` (700) | Score, Stats, Streak-Counter — alle Mono-Numerik |

**Was rausfällt:**
- `font-normal` (400) für Sans — wird durch Mono-Regular ersetzt, wo es um Numerik geht; sonst ist Body in Medium (500) ehrlicher (Inter Normal ist auf Bildschirm leicht dünn).
- `font-semibold` (600) — der Sprung von 500 zu 700 ist hörbar, 600 ist ein Zwischending, das niemand braucht. Print-Regel: zwei Strichstärken-Abstände sind ehrlicher als drei.

Wer am Ende des Refactors 4 Weights und 6 Sizes hat, hat eine **Hierarchie, die das Auge in 250ms erfasst**. Das ist die Print-Lesbarkeitsgrenze — was das Auge nicht in 250ms ordnen kann, ordnet es gar nicht.

---

## Drei Empfehlungen

Drei konkrete typografische Korrekturen, die Countrivo aus der "generic SaaS"-Schublade rücken. Mit Schrift, Größe, Tracking — exakt.

### Empfehlung 1: Geist Mono für alle Numerik, mit aktivierten OpenType-Features

**Was:** Geist Mono via `next/font/google` laden, `--font-mono` deklarieren, global `font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1` für `.font-mono` setzen.

**Wo:** `src/app/layout.tsx:13-17` ergänzen, `src/app/globals.css:3-5` Token, `src/app/globals.css` neue Utility-Klasse:

```css
.font-mono {
  font-family: var(--font-mono), ui-monospace, monospace;
  font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1, "ss01" 1;
}
```

`zero` 1 aktiviert das slashed Zero — wichtig, weil eine `0` in einer Streak-Zahl nicht mit einem `O` (Buchstabe) verwechselt werden darf. `tnum` 1 erzwingt Tabular Figures — Score "189" und "201" stehen pixelgenau übereinander. `ss01` ist ein Stylistic Set, in Geist Mono optional aber konsistent.

**Warum:** Aktuell wird `font-mono` 40+ Mal geschrieben, ohne dass *irgendeine* Mono-Schrift geladen ist. Das ist die größte typografische Lücke im System. Die Korrektur sortiert nicht nur das Rendering — sie aktiviert die Print-Numerik-Standards, die ein Daily-Geography-Produkt unbedingt braucht.

**Größe in Verwendung:** `text-display` (56px) für Result-Score (Geist Mono Bold 700), `text-2xl` (32px) für Section-Top-Score, `text-lg` (20px) für Country-Code-Chips (Geist Mono Medium 500), `text-sm` (14px) für Tabellen-Numerik.

### Empfehlung 2: Hero-Headline in Inter Display-Größe mit positivem Tracking statt `tracking-tight`

**Was:** Die Hero-Headline (`src/components/daily-hero.tsx:116-128`, `src/app/page.tsx`-Variante) bekommt:

```tsx
<h1 className="text-display font-extrabold leading-none tracking-[-0.005em]">
```

Konkret: 56px, Extrabold (800), Line-Height 1.0, Tracking `-0.005em` (nahezu Default — fast keine Korrektur, weil Inter Extrabold bei 56px schon dicht genug ist).

**Wo:** Streichen von `text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight` (die fünfschichtige AI-Default-Klasse). Eine einzige Größe für Hero — keine responsive Kaskade. Auf mobilen Devices ist 56px immer noch lesbar (Geist nutzt 48px für Hero, Linear nutzt 56px). Wenn die Headline auf 320px-Viewport bricht, soll sie brechen — eine 2-Zeilen-Hero ist nicht schlechter als eine 1-Zeilen-Hero.

**Warum:** `text-3xl sm:text-5xl lg:text-6xl` ist der Marker einer AI-Hand. Die Print-Korrektur ist: *wähle eine Größe für den Hero, und steh dazu*. Print-Magazine machen keine "responsive Headline-Sizes". Sie wählen eine Größe und setzen sie. Wenn sie zu groß ist auf einem mobilen Gerät, ist sie eben groß. Das ist Charakter.

**`tracking-tight` ersetzen durch `tracking-[-0.005em]`** ist eine fast unsichtbare Korrektur, die einen Unterschied macht: Inter Extrabold bei 56px hat einen Default von `0em` (keine Korrektur). `-0.025em` (Tailwind `tracking-tight`) ist zu eng, `0em` ist gut, `-0.005em` ist ein Hauch Anziehung. Das ist die Print-Mikro-Korrektur, die ein LLM nie tut.

### Empfehlung 3: Stats-Caps-Labels in Inter Medium (nicht Bold) mit `tracking-[0.06em]` statt `tracking-widest`

**Was:** Alle Caps-Labels (Section-Headings, Pill-Caps, Footer-Sources):

```tsx
<span className="text-xxs font-medium uppercase tracking-[0.06em] text-cream-muted">
```

Konkret: 11px, Medium (500), Uppercase, Tracking `0.06em` (6% Sperrung).

**Wo:** Ersetzt alle Stellen mit Pattern `text-xs font-bold uppercase tracking-wide` oder `text-[10px] font-bold uppercase tracking-wide`. Eine globale Utility-Klasse `.label-caps`:

```css
.label-caps {
  font-size: var(--font-size-xxs);
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-cream-muted);
}
```

**Warum:** Drei Print-Korrekturen in einer:

1. **Medium statt Bold** — bei 11px ist Bold (700) zu schwer, das Innenraum der `e/a/o` schließt sich. Medium (500) atmet.
2. **`0.06em` statt `0.1em` (tracking-widest)** — `widest` macht Caps so weit, dass das Wort als Einzelbuchstaben gelesen wird. 6% ist die alte Stanley-Morison-Print-Regel: "Versalien tragen 5–8% Sperrung", je nach Schrift.
3. **Eine semantische Klasse** statt vier Tailwind-Klassen wiederholt. Wer in zwei Jahren die Sperrung von 6% auf 7% ändern will, ändert eine Zeile.

Das `tracking-[0.06em]` ist der typografische Unterschied, an dem das Auge spürt: *jemand hat das mit der Hand gemessen*. `tracking-widest` ist ein Klick. `0.06em` ist eine Entscheidung.

---

## Notiz an Aurelie

*Aurelie —*

Du hast die Typografie als "Schicht 3" benannt und sehr klar gemacht, dass Inter alleine eine Skizze ist, die zwischen `text-[10px]` und `text-6xl` durch 20 Bracket-Hacks atmet. Du hast recht — und du hast es so gesehen, wie eine Restauratorin sieht: die Stelle, an der das Pigment dünn wird.

Was ich aus Print ergänze: was du nicht sehen konntest, ist die *Stille zwischen den Buchstaben*. `font-feature-settings`, `font-variant-numeric`, `letter-spacing` bei Caps, der Sprung von `font-bold` zu `font-medium` bei kleinen Sizes — das sind Stellen, an denen eine Wand ohne sichtbaren Riss trotzdem ungleichmäßig altert. Bei meiner Tante Indira hieß das: *eine Schrift weiß, was sie sagen will. Sie zeigt es in den Pausen zwischen den Buchstaben.* Was im Frescen-Handwerk die Verdaccio ist, sind in der Typografie die OpenType-Features.

Die größte Lücke des Systems hast du nicht sehen können, weil sie unsichtbar ist: 40+ `font-mono`-Aufrufe ohne geladene Mono-Schrift. Das ist nicht Drift — das ist *Wunschdenken*. Ein Token, der auf nichts zeigt.

Sechs Größen, vier Weights, zwei Schriften (Inter + Geist Mono). Mehr nicht. Das ist mein Vorschlag an deine Pigment-Schicht 3.

— *Rahul*

---

## Schluss

Eine Schrift weiß, was sie sagen will. Sie zeigt es in den Pausen zwischen den Buchstaben — nicht in der Größe, nicht im Gewicht, sondern in der ehrlichen Pause.

Inter ist eine richtige Default-Wahl, und Geist Mono wäre die ehrliche Schwester. Sechs Sizes, vier Weights, OpenType-Features aktiviert, Caps mit gemessenem Tracking, Bracket-Sizes verboten unter 11px. Das ist nicht reich. Das ist auch nicht arm. Das ist *gemessen*.

Wer im Mai 2018 die letzte Doppelseite von *Cartographer Quarterly* gesetzt hat, weiß: eine Schrift, die ein einziges Mal richtig auf der Seite steht, trägt die ganze Ausgabe. Eine Schrift, die zwanzig Mal in zwanzig verschiedenen Strichstärken auf der Seite steht, ist nur Lärm. Indira hat in ihrer Devanagari-Variante an einem Wintertag in Pune einen einzigen Satz an mich geschrieben, und der Satz hatte mehr Würde als die nächsten vierzig Tage SaaS-Marketing-Mails zusammen. Weil die Pause zwischen den Buchstaben einer Hand gehörte, die wusste, wann sie aufhören sollte.

So soll Countrivos Typografie sein. Sie soll wissen, wann sie aufhört.

— *Rahul Naeir-EO, Edinburgh / Berlin, 26. Mai 2026*
