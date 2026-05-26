# 03 · Frieda Dunmar · Komposition

> Eine Designerin entscheidet, was nicht da ist. Eine Maschine kann das nicht — sie hat keinen Magen, der sich beim Auslassen zusammenzieht. Heute morgen, beim Bach, habe ich Countrivos Homepage zum dritten Mal angeschaut, und mir wurde klar: das hier ist kein Design. Das hier ist *Inventar*.

---

## Eröffnungs-Komposition

Eine Bach-Fuge hat vier Stimmen. Jede Stimme tritt zu einem bestimmten Zeitpunkt ein, jede sagt etwas Eigenes, keine ist eitel. Wenn alle vier gleichzeitig anfangen zu sprechen, ist es keine Fuge mehr — es ist ein Geräusch. Ich öffne die Homepage von Countrivo, und ich zähle in der ersten halben Sekunde: das Live-Badge oben, das Datum daneben, eine pulsierende grüne Punkte-Animation, die Headline, der Subtext, der goldene CTA, die Progress-Bar drunter, die Reset-Zeit rechts, dann die Stats-Reihe mit drei Emojis (🔥 🌍 🎮), dann die "Pending Challenges"-Sektion, dann die *Today's featured game*-Karte mit demselben Spiel, das ich gerade im Hero verlinkt sah, dann die Drei-Kacheln-Leaderboard-Reihe, dann ein 12-teiliges Game-Card-Grid, dann "Challenge friends live" mit einem zweiten pulsierenden grünen Punkt, dann ein Join-Code-Input. Das sind mindestens elf Stimmen, die gleichzeitig sprechen. Bach hätte den Stift aus der Hand gelegt. Aleksandr hat schon gezählt: neun Klick-Targets in einer 56-Pixel-Header-Leiste — das gilt nicht nur für den Header, das gilt für die ganze Seite. Aurelie hat es Pinselskizzen ohne Strich genannt; Reto den krummen ersten Falz. Ich sage es härter: das ist *generated visual noise*. Jedes Element steht da, weil es möglich war, nicht weil es notwendig war. Karl-Heinz hätte gesagt: wer beim Beschriften zehn Wörter hinschreibt, weil zehn Wörter passen, hat das Brett nicht verstanden.

---

## Inventar-Diagnose

Hier sind die konkreten Stellen, an denen Elemente "weil möglich" da sind, nicht "weil notwendig":

1. **`src/components/daily-hero.tsx:101-113`** — Date-Plus-Live-Badge-Zeile *über* der Headline. Das Datum sagt: heute. Das Live-Badge sagt: heute. Das Pulsierende sagt: jetzt. Drei Hände, die in dieselbe Richtung deuten. Eine reicht. Streich Live-Badge: ein Daily-Spiel ist per Definition live. Das muss nicht beweisbar sein.

2. **`src/components/daily-hero.tsx:177-194`** — die *Stats-Reihe* unter dem Hero: 🔥 X-day streak · 🌍 243 countries · 🎮 14 games. Drei Emojis, drei Zahlen, drei Konkurrenten. Davon ist nur eines emotional relevant (Streak). "243 countries" und "14 games" sind Marketing-Reflex. Sie gehören in den Footer oder in eine About-Seite, nicht in den Erste-Sekunden-Eindruck.

3. **`src/app/page.tsx:133-187`** — die ganze Sektion *Today's featured game*. Sie wiederholt, was der `DailyHero` direkt darüber bereits gesagt hat. Dasselbe Spiel, derselbe CTA, andere Vignette. Aleksandr hat es richtig genannt: drei Pfeile, dieselbe Richtung. Streich es. Vollständig. Inklusive der Flagship-Pille (Zeile 137-139), inklusive des riesigen Hintergrund-Emojis (Zeile 148-150) — letzteres ist ein klassisches Slop-Tell: dekorativer Hintergrund, weil die Karte sonst "leer" wirken könnte.

4. **`src/app/page.tsx:189-229`** — *Today's leaderboard*-Drei-Kachel-Block. Drei Emojis (🥇 👥 🎯), drei Zahlen, drei kleine Untertitel ("today's best" / "and counting" / "can you beat it?"). Jede einzelne Kachel hat **vier Textebenen**: Emoji, Titel, Wert, Subtext. Bei drei Kacheln sind das zwölf Textebenen für drei Zahlen. Streich die Emojis. Streich die Subtitel ("today's best", "and counting", "can you beat it?") — das ist sentimental-erzählerisches Coaching, das die Zahlen entwertet. Eine Mono-Zahl wiegt, ein Wort wie *and counting* ist Luft.

5. **`src/app/page.tsx:296-335`** — *Challenge friends live*-Sektion mit zweitem pulsierenden grünen Punkt. Zweimal "Live" auf derselben Seite. Beim ersten Mal war es eine Behauptung, beim zweiten Mal ist es Nervosität. Streich den Live-Indicator. Streich die ganze Sektion auf der Homepage (Aleksandr hat das schon entschieden — Power-User-Function gehört nicht above-the-fold).

6. **`src/components/game/game-landing.tsx:114-138`** — die *Mode-Beschreibungen* unter den CTAs: "One puzzle. One shot. Same draw for everyone." und "New countries every run." Die CTA-Labels sagen bereits *Play today's challenge* und *Practice unlimited*. Die Mode-Beschreibungen wiederholen das in anderen Worten. Streich beide Sätze. Wer Daily und Practice nicht versteht, lernt es in einer Runde.

7. **`src/components/game/game-landing.tsx:140-150`** — der *View today's leaderboard*-Link unter den CTAs. Konkurriert visuell mit den primären CTAs. Aleksandr sagt zu Recht: Power-User-Brücke, sekundär. Soll auf die *Game-Over*-Seite, nicht auf die Landing.

8. **`src/components/game/game-landing.tsx:153-168`** — *How it works*-Block mit drei nummerierten Regeln in einem grauen Kasten. Niemand liest "How it works" auf einer Game-Landing-Seite. Wer den CTA gedrückt hat, will spielen. Streich den Block. Wenn die Regeln gebraucht werden, gehören sie in den ersten Spielzustand selbst — als sanfter Tooltip, als zweite Karte, als drei Sekunden Stille.

9. **`src/components/game/game-landing.tsx:170-197`** — *Try next*-Galerie mit sechs alternativen Spielen direkt auf der Landing-Page. Das ist Selbst-Sabotage. Der Spieler ist auf dieser Seite, *weil* er dieses Spiel spielen will. Sechs konkurrierende Pfade signalisieren: "Vielleicht doch nicht?" Streich auf null oder maximal drei, und nur weit unten nach dem Fold.

10. **`src/components/game/game-over-screen.tsx:264-286`** — die *drei Pfeile dieselbe Richtung* auf Layer 1: `#142 / 1247`, `You beat 1105 players`, `Better than 89%`. Aleksandr hat es schon gesagt; ich unterstreiche es kompositorisch: das ist dreimal dieselbe Aussage in drei Worten. Wähl eine. Ich plädiere für **Rank #142** allein, weil eine Zahl wiegt; ein Satz wie "You beat 1105 players" ist Coaching. Streich Punkt 2 und Punkt 3.

11. **`src/components/game/game-over-screen.tsx:301-328`** — Layer 2 hat bis zu **vier StatPills** plus einen *Analytical-insight*-Textkasten darunter. Das ist eine fünfte Stimme in einer Reihe, die schon zu viele hat. Drei Pills max, ohne Insight-Text — oder zwei Pills plus Insight. Niemals beides voll.

12. **`src/components/game/game-over-screen.tsx:333-372`** — Layer 3: vier nebeneinanderstehende CTAs (*Save my score*, *Play again*, *Share result*, *Challenge a friend*) plus darunter *View today's leaderboard*. Fünf Klick-Targets in einer Action-Zone. Drei reichen. Aleksandr hat die Hierarchie bereits gezeichnet: *Play again* primär, *Share* sekundär, *Challenge* sekundär conditional. *Save* darf nie gleichzeitig mit *Play again* erscheinen (das ist gegenseitig ausschließlich). Leaderboard-Link gehört in Layer 4, nicht Layer 3.

13. **`src/components/layout/header.tsx:62`** — der `backdrop-blur-md` am Header. Hella hat es bereits markiert: erlaubt *nur*, wenn funktional notwendig. Auf einem statisch-cremefarbenen Hintergrund mit wenig Scroll-Drama unter dem Header brauche ich keinen Glasweichzeichner. Es ist ein Slop-Tell — *bg-white/80 backdrop-blur-md* ist der Tailwind-Fingerprint, den jeder LLM in 30 Sekunden generiert. Probier es ohne. Wenn die Header-Lesbarkeit beim Scroll leidet, leg eine matte Surface drunter (`bg-bg/95`), aber kein Blur.

14. **`src/app/page.tsx:148-150`** + **`src/app/page.tsx:252-254`** — die *halb-transparenten Riesen-Emojis als Hintergrund-Vignette* in der Featured-Card und in jeder einzelnen Game-Card. `text-[6rem]…[8rem] opacity-[0.10]`. Das ist 2022-SaaS-Marketing-Page-Vokabular. Ein Emoji, das mit 10% Opazität in der Ecke liegt, weil "die Karte sonst leer wirken könnte" — das ist Inventar, nicht Komposition. Eine *gut komponierte* Karte hält die Leere aus. Streich alle Hintergrund-Vignette-Emojis. Behalt das Vordergrund-Emoji oben links (das ist Identitäts-Tag, das funktioniert).

15. **`src/components/daily-hero.tsx:152-175`** — die *Daily-Progress-Bar* (`{completed}/{totalDaily}` plus Reset-Timer plus Balken). Drei Elemente an dieser Position. Der Balken ist die einzige notwendige visuelle Information; die Fraktion und die Reset-Zeit sind Text-Doppelung. Mein Vorschlag: nur den Balken, und beim Hover die Fraktion. Oder die Fraktion als kleines Mono-Label *unter* dem Balken, nicht *über*. Reset-Zeit gehört, wenn überhaupt, in die Headline-Subline der Hero, nicht hier.

Das sind fünfzehn Stellen. Eine konservative Zählung. Wer länger sucht, findet mehr.

---

## Was bleibt, wenn man wegnimmt

Ich gehe sektionsweise durch. *Radikal* heisst hier: ich streiche, bis die Sektion ihre Kernfunktion gerade noch erfüllt. Wenn das Gefühl entsteht "die Seite wirkt etwas leer" — Hella hat es richtig gesagt — *dann ist es richtig gemacht*.

### Hero (`DailyHero`)
- **Bleibt:** Headline, einziger CTA, Streak (klein, unter CTA, als einzeiliger Identitäts-Anker).
- **Streichen:** Date-Plus-Live-Zeile (oder Datum in die Subline integrieren), Stats-Reihe (🔥 🌍 🎮), Reset-Timer (oder in eine zweite Mono-Zeile zur Subline der Headline), Progress-Bar-Block in dieser Form.
- **Test:** Wenn der User in einer Sekunde versteht "heute spielen, jetzt", ist der Hero ein Hero. Wenn er zuerst die Reset-Zeit lesen muss, um zu wissen, dass es ein Daily ist, ist es eine Info-Box.

### Game-Card-Grid (Homepage *More daily games*, `page.tsx:231-294`)
- **Bleibt:** Emoji oben links (klein, identitätstreu), Titel (fett), Kurzbeschreibung (eine Zeile), Difficulty-Chip ODER Time-Chip (nicht beide).
- **Streichen:** das Riesen-Hintergrund-Emoji mit 12% Opazität, der "New"-Pill (lebt vom Schimmer — wenn ein Spiel neu ist, soll es seine erste Reihe als ganzes besetzen, nicht ein Pill bekommen), der zweite Meta-Chip.
- **Test:** Drei Textebenen pro Karte. Kein dekorativer Hintergrund. Die Karte verdient ihre Leere.

### Game-Landing (`game-landing.tsx`)
- **Bleibt:** Emoji + Titel + Subtitle (drei Zeilen, zentriert oder linksbündig), zwei CTAs (Daily + Practice, gleich groß).
- **Streichen:** Meta-Chips (in eine einzige Inline-Zeile unter dem Titel komprimieren oder ganz weg), Mode-Beschreibungen unter den CTAs, View-leaderboard-Link, How-it-works-Block, Try-next-Galerie auf null reduzieren (oder maximal drei Spiele weit unten).
- **Test:** Drei Sekunden Stille. Der Spieler klickt. Wenn ich ihn umlenke, sabotiere ich ihn.

### Game-Over-Screen (`game-over-screen.tsx`)
- **Bleibt:** Score (riesig, Mono, Gold) + Tier-Pill + Rank (nur die Zahl, nicht "of N"). Personal-Best-Banner conditional. Eine Stat-Reihe mit drei Pills max. Drei Actions: Play again, Share, Challenge (conditional). Try-another-Galerie ganz unten.
- **Streichen:** "You beat N players"-Satz, "Better than N%"-Satz (oder eines, nicht beide — siehe Aleksandr), Tier-Message-Satz ("You know your stuff." ist genau die Sorte Coaching, die eine LLM in 30 Sekunden generiert; Hellas Index of Forbidden Patterns hat dafür eine Zeile), Insight-Textbox unter den Pills oder die Pills auf drei, View-leaderboard als eigene Zeile.
- **Test:** Drei Zahlen-Aussagen auf Layer 1 (Score, Tier, Rank). Eine Aussage pro Pixel-Zone. Kein erzählerisches Tröstwort.

---

## Weißraum-Audit

**Wo Weißraum fehlt:**

- **Zwischen `DailyHero` und der ersten Folgesektion (`page.tsx:97`).** Aktuell `mb-6` (24px) zwischen Pending-Challenges-Block und der Featured-Game-Sektion. Das ist Atemnot. Eine Hero-Sektion verdient mindestens 64-96px Abstand zur nächsten Layer-2-Stimme. Hella spricht von "zwei vollen Bildschirmhöhen Abstand" — ich gehe nicht ganz so weit, aber 64px (`mb-16`) ist das absolute Minimum. Erst nach dieser Atempause darf der Spielbetrieb beginnen.

- **Zwischen den Drei-Kachel-Leaderboard-Boxen (`page.tsx:197`).** `gap-3` ist 12px. Drei Kacheln mit 12px Lücke und vier Textebenen pro Kachel — das ist erstickt. Entweder Inhalt pro Kachel reduzieren oder `gap-5` (24px) als Minimum.

- **Innerhalb der `verdict-reveal`-Karte des Game-Over-Screens (`game-over-screen.tsx:247-298`).** Score → Tier-Pill → Rank-Zeile → Tier-Message → Personal-Best-Banner: das sind fünf Zeilen mit jeweils `mt-3` oder `mt-4`. Bei `mt-3` (12px) zwischen Score und Tier hat der Score keine Atempause. Der Score sollte mindestens 24-32px Atempause nach unten haben, bevor das nächste Element auftaucht. Sonst ist er kein Score mehr — er ist ein Listenpunkt.

**Wo zu viel Weißraum (oder Weißraum, der nichts trägt):**

- **`page.tsx:296` — `mt-12` (48px) vor der Challenge-friends-live-Sektion.** Der Weißraum ist hier korrekt dimensioniert, aber er trägt eine Sektion, die ich streichen will. Damit löst sich das Problem.

- **Innerhalb der `GameLanding`-Hero-Box (`game-landing.tsx:69-151`).** `py-10 sm:py-12` plus `mb-3 mt-2 mt-3 mt-8 mt-4 mt-3` — sechs verschiedene Vertikalabstände in einer einzigen Box. Das ist keine Komposition, das ist Trial-and-Error. Vereinheitlich auf eine Rhythmus-Achse: Emoji → 16px → Titel → 8px → Subtitle → 32px → CTAs. Mehr Stufen sind Selbstmisstrauen.

**Eine Beobachtung zum Weißraum, die nicht in den Code passt:**

Weißraum ist nicht Abstand. Weißraum ist *Entscheidung*. Eine Designerin entscheidet, dass an dieser Stelle nichts sein soll — und das *Nichts* wird zum Element. Eine Maschine kann das nicht entscheiden, weil sie keine Gewichtung von Abwesenheit hat. Sie kann nur Anwesenheiten anordnen. Wenn Countrivo eine Designerin haben will, muss sie zuerst die Stellen finden, an denen sie *bewusst nichts setzt*.

---

## Komposition-Geometrie

**Welche Geometrie liegt vor?**

Countrivo arbeitet implizit mit Tailwinds 4-Punkt-Spacing-Skala — Reto hat es bereits diagnostiziert und in Tokens gegossen. Das ist die Schreibsprache, nicht die Komposition. Eine Geometrie wäre eine *Sichtachse*: eine vertikale Linie, an der sich Headlines, CTAs und Section-Headings ausrichten; ein horizontales Verhältnis zwischen Card-Höhe und Card-Padding; eine wiederkehrende Modulhöhe, an der man die Seite scrollt.

Ich sehe keine. Stattdessen:

- **Hero ist zentriert** (`text-center py-8 sm:py-12`), **Featured-Game ist zentriert-mit-Asymmetrie** (`flex sm:items-center sm:justify-between`), **Leaderboard ist drei-spaltig zentriert**, **Game-Card-Grid ist 2/3/4-Spalten responsive**, **Challenge-friends ist 1/3-Spalten**, **Game-Landing-Hero ist text-zentriert**, **Game-Over-Verdict ist text-zentriert**. Alles zentriert. Eine Seite, die ausschließlich zentrierte Sektionen stapelt, hat keine Sichtachse — sie hat eine *Säule*. Eine Säule kippt nicht, aber sie führt das Auge auch nicht.

- **Goldener Schnitt:** nirgends sichtbar angewandt. Das ist nicht zwingend nötig — viele gute Layouts kommen ohne aus —, aber an Stellen, wo eine asymmetrische Balance helfen würde (Hero links + Globus rechts, wie Hella vorschlägt), liegt aktuell zentrierte Symmetrie. Asymmetrie ist Mut. Symmetrie ist Default.

**Wo wird die 4-Punkt-Skala verletzt?**

- Aurelie hat die `text-[10px]/[11px]`-Hacks bereits gezählt — sub-12px-Typografie unter dem Token-Boden.
- `mt-1.5`, `mt-2.5`, `gap-1.5`, `gap-2.5` — Halbschritt-Spacings, die Reto bereits verboten hat.
- Header-Höhe `h-14` (56px) ist eine 4-Punkt-Stufe, aber sie ist zu eng für die neun Klick-Targets, die sie tragen will. Wenn man bei `h-14` bleibt, müssen die Targets weg, nicht der Header höher.

**Wo wird sie gewahrt?**

- Token-Skala, Radius-Stufen, Shadow-Stufen — diszipliniert. Aurelie hat es bestätigt: kein wild gewachsenes `p-7` oder `p-11`. Das ist eine Stärke.
- Die Drei-Schichten-Architektur jedes Spiels (Logic / UI / Route) ist eine echte Geometrie — eine *strukturelle*, keine *visuelle*. Reto hat sie den ersten Falz genannt. Sie hält.

**Meine Forderung zur Geometrie:**

Eine sichtbare vertikale Sichtachse für die Homepage. Linke Kante der Hero-Headline = linke Kante der Section-Headings = linke Kante der Game-Card-Reihen. Eine Linie, die das Auge führt. Aktuell springt das Auge: zentriert, dann links, dann zentriert, dann links. Das ist Strudel, nicht Linie.

---

## Drei Forderungen an Hella

Hella hat den Brand-Brief geschrieben, und er ist gut. Sehr gut. *One world. One puzzle a day. Forever.* — das ist eine Headline, die ich auch geschrieben hätte. Sie hat den Gold-Streit entschieden (zugunsten von `#b8860b`, korrekt), sie hat die Verläufe verbannt (notwendig), sie hat das Linksbündig-Asymmetrische verlangt (Mut). Was ich hinzufüge, kommt nicht aus dem Pharma-Atelier, in dem sie sieben Jahre gestanden hat, sondern aus den Druckereien, in denen ich von 1991 bis 2002 Plakate gemacht habe — Plakate, die in einer dunklen Foyer-Vitrine in Halle hingen und in einer Sekunde lesbar sein mussten.

**Forderung 1: Eine sichtbare Sichtachse, nicht nur ein Pigment.**

Du hast einen Goldton entschieden. Das ist Pigment. Aber Pigment trägt keine Komposition. Was Countrivo fehlt, ist eine durchgehende *vertikale Linie* — die linke Kante der Hero-Headline, der Section-Headings, der Card-Reihen. Aktuell springt das Auge zwischen `text-center` und `text-left` und `justify-between`. Eine Plakatreihe in einer Vitrine hat eine Achse — sonst ist es kein Plakatreihe, sondern Wäsche. Ich schlage vor: alles linksbündig, mit Ausnahme der Spiel-Cards in den Grids (die dürfen zentriert bleiben, weil sie ihre eigene Mini-Komposition haben). Das macht aus einer Säule eine Strömung.

**Forderung 2: Ein Streichkalender, nicht nur ein Yes-No-Index.**

Dein Yes/No-Index ist gut, aber er ist defensiv — er sagt, was nicht passieren darf. Ich schlage einen *proaktiven Streichkalender* vor: ein Dokument im Repo, das alle vier Wochen ein Element identifiziert, das gestrichen wird. Nicht ein Bug, nicht ein Feature — ein Element. Jeden Monat eines. In sechs Monaten sind sechs Elemente weg, die im Inventar standen und nicht in der Komposition. Das ist die einzige Disziplin, die ein Produkt langsam aus dem Slop-Modus zieht. Ohne diese Disziplin wird jede neue Funktion ein neues Element hinzufügen, und das Mehr-Werden ist die Default-Richtung jedes Software-Produkts. Karl-Heinz hatte für seine Werkstatt eine eigene Regel: einmal im Quartal ein Werkzeug an den Nagel zurück, das er ein Quartal lang nicht gebraucht hat. Drei Jahre später hatte er nur noch das, was er wirklich brauchte. Es war eine sehr leere, sehr gute Werkstatt.

**Forderung 3: Eine Komposition pro Sektion, nicht eine Sammlung von Möglichkeiten.**

Du hast den Hero komponiert (sehr klar: ein Satz, ein CTA, ein Globus, drei Punkte). Das ist Komposition. Aber die anderen Sektionen — Game-Landing, Game-Over, Game-Card-Grid — sind noch nicht komponiert; sie sind aktuell Sammlungen. Sie zeigen, *was alles möglich ist* in dieser Sektion, nicht *was ist*. Ich fordere, dass du für jede der zehn Hauptsektionen denselben Akt vollziehst, den du mit dem Hero gemacht hast: drei bis vier Elemente, klar zueinander, der Rest wird gestrichen. Das ist nicht meine Designentscheidung — das ist deine. Ich kann nur sagen, was an Bach mich seit fünfzig Jahren hält: jede Note ist notwendig. Wenn auch nur eine eitel ist, hört man es.

---

## Die Bach-Fuge

Wenn Countrivo eine Bach-Fuge wäre — eine vierstimmige, sagen wir die *Fuga* aus dem *Wohltemperierten Klavier* Band I, B-Dur —, dann müssten ihre vier Stimmen die folgenden sein. Stimme eins: das **Datum**. Nicht der Marken-Name, nicht das Logo, sondern die Tatsache, dass heute ein bestimmter Tag ist und morgen ein anderer. Das ist die Soggetto, das Thema, das alle anderen Stimmen beantworten. Stimme zwei: der **CTA**. Eine einzige Geste, ein Klick, ein Versprechen. Sie tritt nach der ersten Stimme ein und antwortet ihr in der Quarte: das Datum sagt "heute", der CTA sagt "spiel". Stimme drei: der **Streak**. Sie kommt später, leiser, sie verlängert das Versprechen über den einzelnen Tag hinaus — sie macht aus *heute* eine Folge. Stimme vier, am leisesten von allen: die **Stille**. Der Weißraum, das Nicht-Element. Sie ist die Stimme, die die anderen drei zusammenhält, weil sie ihnen Platz lässt, sich zu hören. Alles andere — die Stats-Reihe, die Leaderboard-Kacheln, die Pending-Challenges-Karten, die Try-Next-Galerien, die Hintergrund-Emoji-Vignetten, die Mode-Beschreibungen, die Insight-Textboxen — ist nicht Teil der Fuge. Es ist das, was in den ersten drei Skizzen war und beim Reinschreiben gestrichen wurde. Eine Fuge entsteht durch Streichen, nicht durch Hinzufügen.

---

## Schluss

Eine Designerin entscheidet, was nicht da ist. Das ist der einzige Satz, der mir an Bauhaus-Lehrer-Jahren wirklich geblieben ist — die meisten anderen Sätze waren Variationen davon. Ich habe meinen Studierenden in Weimar siebzehn Jahre lang erzählt, dass ein gutes Layout sich am Weglassen erkennt, nicht am Können. Heute, fünfzehn Jahre nach meiner Berufung und sechs Jahre nach der Pensionierung, sitze ich in einer Küche südlich von Erfurt und schaue mir Produkte an, die jemand mit einer Maschine gebaut hat, und ich sehe sofort: hier hat niemand gestrichen. Niemand hat sich entschieden, dass die Stats-Reihe nicht ins Hero gehört. Niemand hat sich entschieden, dass das halb-transparente Hintergrund-Emoji eine Lüge ist. Niemand hat sich entschieden, dass *You know your stuff.* eine Coaching-Floskel ist, die ein Mensch beim zweiten Lesen aussortiert. Das alles wurde belassen, weil es technisch möglich war. Eine Maschine fügt hinzu, was möglich ist. Eine Designerin nimmt weg, was nicht notwendig ist. Das ist der ganze Unterschied. Wenn Countrivo eine Designerin haben will — und Hella ist eine, ich habe das in ihrem Brief gelesen —, dann muss sie jetzt streichen. Nicht in der nächsten Iteration, nicht im Q3-Sprint, nicht beim Refactor. Jetzt. Eine Sektion, ein Element, ein Wort weniger. Und morgen wieder eins. Und übermorgen, wenn das Brett leer ist, sieht man, was wirklich darauf gehört.

Karl-Heinz hat die Beschriftung für meine Plakate gemacht. Er hat manchmal einen Buchstaben falsch geschnitten und das ganze Brett verworfen, weil ein einziger Buchstabe nicht stimmte. Ich habe ihn das nie zwingen müssen. Er wusste es selbst.

— *Frieda Dunmar, südlich von Erfurt, 26. Mai 2026*
