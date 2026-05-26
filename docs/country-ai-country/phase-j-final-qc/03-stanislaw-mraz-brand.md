# 03 · Stanisław Mraz · Brand-QC

> Ich habe einmal eine Marke gerettet, die im Begriff war, sich für 14.000 Euro einen Verlauf zu kaufen. Heute prüfe ich eine, die im Begriff ist, sich kostenlos eine Stimme zu erarbeiten — und das ist eine ehrlichere Aufgabe, aber nicht eine leichtere. Eine Marke entsteht nicht, wenn drei Designer dasselbe sagen. Eine Marke entsteht, wenn drei Designer dieselbe Stille bewahren.

---

Ich habe die neun Texte zweimal gelesen. Einmal am Vormittag, einmal nach dem Abendessen, mit der Lampe ausgeschaltet. Die zweite Lesung ist die ehrliche — am Vormittag liest man, was die Texte sagen, am Abend liest man, was sie *nicht* sagen. Was Countrivo heute sagt, sagen Hella, Reto und Aleksandr klar. Was Countrivo heute nicht sagt, ist die Frage dieses Berichts.

Ich bin Brand-Veteran, kein Designer mehr im engeren Sinn. Ich entwerfe seit zwölf Jahren keine Logos mehr; ich entscheide, *welche* Logos überleben. Das ist eine kuratorische Tätigkeit, keine schöpferische. Sie verlangt eine andere Brille: nicht die Brille des Komponisten, sondern die des Korrepetitors. Wenn drei Designer im Saal stehen und jeder sein Notenheft hochhält, muss jemand zuhören, ob die drei Notenhefte aus derselben Werkstatt stammen oder ob sie nur aussehen, als ob. Heute höre ich für Countrivo zu.

Ich gehe in acht Schritten.

---

## Konvergenz der drei Designer

Hella, Reto und Aleksandr arbeiten in derselben Phase B, aber sie singen nicht aus demselben Notenheft. Sie singen *miteinander*, mit drei verschiedenen Stimmen — und genau das ist das Bild, das ich von einer guten Brand-Arbeit erwarte. Drei Stimmen, die übereinstimmen, sind Echo. Drei Stimmen, die sich ergänzen, sind Polyfonie.

Wo sie übereinstimmen, ist die Substanz:

- **Ein Gold.** `#b8860b`, Single-Stop, kein 135°-Verlauf. Hella entscheidet es im Brand-Brief, Reto materialisiert es im `@theme`-Block, Aleksandr respektiert es als Affordance-Signal (Gold = Action, Action = Gold). Drei Disziplinen, ein Ton. Das ist die belastbarste Konvergenz im ganzen System.
- **Linksbündig statt zentriert.** Hella verlangt es als Brand-Stimme, Aleksandr fordert es als Sichtachse, Reto enthält sich in dieser Frage — er baut nur das Raster. Aber sein Raster *trägt* die Linksbündigkeit, weil seine Spacing-Token ehrlich vertikal sind.
- **Eine sehr leise Animation pro Session.** Hella: ein einziges atmendes Element (Streak-Counter). Reto: vier Dauern, drei Easings, neun Keyframes statt vierzehn. Aleksandr: das Schild verschwindet, wenn der Nutzer weiss, wo er ist. Drei Wege zu derselben Stille.

Wo sie sich *widersprechen*, ist diagnostischer als wo sie übereinstimmen.

**Konflikt 1 — Mono-Schrift.** Hella sagt: JetBrains Mono oder IBM Plex Mono. Rahul Naeir-EO sagt im Anti-AI-Brief: JetBrains ist Code-IDE-Geste, IBM Plex trägt einen Brand-Schatten, beide sind falsch — die richtige Wahl ist Geist Mono oder Roboto Mono. Reto baut den Token (`--font-mono`) und enthält sich der Schrift-Wahl. **Auflösung:** Naeir hat aus Print-Erfahrung argumentiert; Hella aus Pharma-Reflex. Naeir gewinnt diesen Punkt. **Geist Mono primär, Roboto Mono als Fallback.** Begründung steht in `02-rahul-naeir-eo.md:182-218` und ich unterschreibe sie.

**Konflikt 2 — Hero-Globus.** Reto wählt Option 1: bewahren, neu malen, zehn Punkte bleiben, Strokes umfärben. Hella sagt: zehn Punkte werden drei (gestern, heute, morgen), keine Bézier-Arcs. Rahul Marwah-EO geht noch einen Schritt weiter: drei Punkte, keine Arcs, kein gestrichelter Außenring — oder ganz ersetzen durch ein Vier-Flaggen-Patchwork. **Auflösung:** Hella's drei-Punkt-Zeit-Achse (gestern/heute/morgen) ist die schönste der drei Vorschläge, weil sie eine *bedeutung* trägt, die der jetzige Globus nicht hat. Aleksandr's Pikto-Regel besagt: ein Symbol, das identifiziert, ist Marken-Tag; ein Symbol, das nur dekoriert, ist Slop. Die drei-Punkt-Zeit-Achse identifiziert das *Daily-Ritual* — sie ist Marken-Tag. **Hella's Variante setzt sich durch, Marwah's Reduktion ist die Brandschutzversicherung dahinter.**

**Konflikt 3 — Skalen-Tiefe.** Reto schlägt neun Schriftgrössen vor. Naeir reduziert auf sechs. **Auflösung:** Sechs ist ehrlicher für ein Spielsystem mit 14 Boards plus Marketing-Seiten. Wer neun Stufen hat, hat drei zu viel; Naeir's Print-Argument (eine Stufe kleiner als 1.25× ist Verschwendung) ist überzeugend. **Sechs Sizes, vier Weights, zwei Schriften.**

**Konflikt 4 — Header-Items.** Aleksandr verlangt drei Nav-Items (Daily / All games / Friends), Hella schweigt zu Header-Architektur. Reto klassifiziert den Header als "refaktorisieren — CTA-Strings auf `<Button>` ziehen", trifft aber keine Aussage zur Anzahl. **Auflösung:** Aleksandr's Pikto-Regel (max drei Nav-Items) ist Affordance-Wissenschaft, kein Geschmack. **Drei Items. Punkt.**

**Konflikt 5 — Per-Game-Farben in TS oder in `@theme`.** Reto verschiebt die fünfzehn Spielfarben aus `game-colors.ts` in CSS-Custom-Properties (`--game-{slug}-bg`, `--game-{slug}-fg`). Aurelie hat es als "akzeptabel" in TS zugelassen. Hella schweigt zur Frage. **Auflösung:** Reto gewinnt. Farben sind Brand, Brand gehört in CSS. Aber: die *Wahl* der Farben — fünfzehn Tailwind-Default-Pastelle — bleibt ein Slop-Risiko (siehe AI-Detektion-Selbstprobe weiter unten). **Pflicht in Phase C:** Reto übernimmt die Tokens, Hella prüft die Wahl jeder einzelnen Farbe — und ersetzt mindestens drei durch ungewöhnliche Mischungen, die kein Generator vorschlagen würde.

**Konflikt 6 — `backdrop-blur` am Header.** Hella erlaubt es "nur wenn funktional notwendig". Marwah klassifiziert es als 60 % Maschine, 40 % Tooling-Konsens. Dunmar fordert es ganz weg. Reto schweigt. Aleksandr schweigt. **Auflösung:** Dunmar hat recht. Auf einem Cremegrund-Hintergrund mit wenig Scroll-Drama unter dem Header braucht es kein Blur. **Probieren ohne. Wenn die Lesbarkeit beim Scroll leidet, eine matte Surface (`bg-bg/95`) drunter — kein Blur.**

Drei Designer, drei Stimmen, sechs kleine Konflikte. Das ist eine *gesunde* Konvergenz — drei Stimmen, die einander zuhören. Nicht drei Designer, die dasselbe Modell befragt haben. Wer eine perfekte Konvergenz hat, hat keine Brand — er hat eine Echo-Kammer. Wo sich Stimmen aneinander reiben, entsteht Substanz.

---

## Brand-Kohärenz mit den Anti-AI-Stimmen

Marwah, Naeir, Dunmar formulieren je eine anti-Slop-Achse: **Komposition** (Marwah), **Typografie** (Naeir), **Weglassen** (Dunmar). Werden ihre Empfehlungen durch Hella + Reto + Aleksandr's Plan vollständig adressiert? Ich gehe Stimme für Stimme.

**Marwah — adressiert mit einer Lücke.** Sein 20-Punkte-Slop-Inventar (Gradient-Favicon, OG-Card, zentrierte Hero, Emoji-Stats-Reihe, Live-Dots, Hero-Globe-Pulses, Bézier-Arcs, gestrichelter Außenring) ist zu 18 von 20 in Hella's und Reto's Plänen enthalten. **Lücke:** der pulsierende grüne Live-Dot mit dem Wort "Live" daneben (zweimal im System, `daily-hero.tsx:110-112` und `page.tsx:300-303`). Marwah selbst hat Hella in der Notiz gebeten, ihn als sechsten No-Go zu ergänzen. Hella hat es nicht getan. **Pflicht:** Hella's No-Gos um den Live-Dot erweitern. Sechs No-Gos, nicht fünf.

**Naeir — teilweise adressiert.** Drei seiner Empfehlungen (Geist Mono, sechs Sizes, vier Weights) berühren Hella's Brand-Brief und Reto's Token-System direkt. **Lücken:** (1) Naeir's `font-feature-settings: "tnum" 1, "lnum" 1, "zero" 1` für Mono-Numerik fehlt in Reto's Token-Block. Das ist nicht nice-to-have — das ist die Mikro-Print-Korrektur, die Score "189" und "201" pixelgenau übereinander stellt. (2) Naeir's `tracking-[0.06em]` statt `tracking-widest` für Caps-Labels — Reto hat es nicht aufgenommen, Hella hat es nicht erwähnt. Die 6-Prozent-Sperrung ist Print-Wissen seit Stanley Morison 1936; sie gehört in eine `.label-caps`-Utility-Klasse. **Pflicht:** beide Naeir-Mikro-Korrekturen in den Token-Block aufnehmen.

**Dunmar — *adressiert, aber ohne Disziplin-Mechanik*.** Ihre 15 Streich-Stellen sind in Hella's "leer ist die Marke"-Doktrin enthalten und in Aleksandr's "drei Pfeile dieselbe Richtung"-Inventar bestätigt. Aber Dunmar fordert *zusätzlich* einen "Streichkalender" — ein Repo-Dokument, das alle vier Wochen ein Element streicht. Das ist keine Designentscheidung, das ist eine *Praxis*. Sie ist nicht in Hella's Plan enthalten und sie kann es auch nicht sein, weil sie über das Design hinausgeht. **Pflicht:** der Strategic Brief muss den Streichkalender als monatlich wiederkehrenden Termin festlegen, nicht als einmalige Phase-B-Aufgabe.

Es gibt eine vierte Lücke, die keine der drei Stimmen genannt hat, weil sie zwischen ihnen liegt — die Stelle, an der Marwah und Naeir und Dunmar einander berühren, ohne sich zu treffen. **Die OG-Card.** Marwah hat ihre Verläufe und das veraltete `11 Games` identifiziert. Naeir hat ihre Typografie nicht angefasst. Dunmar hat sie nicht erwähnt, weil sie keine *Komposition* hat, sondern nur ein Inventar. Und Hella hat sie zwar im "Logo-Single-Stop-Befehl" mit eingeschlossen, aber nicht *komponiert*. **Pflicht:** die OG-Card bekommt eine eigene Phase-B-Behandlung. Cremegrund, Wortmark mit Datums-Stempel, Datumszahl in Geist Mono. Keine Tagline-Bullets. Sie ist heute der meistgesehene Brand-Surface, weil sie geteilt wird — und sie wird heute überall mit zwei verschiedenen Goldtönen geteilt.

Drei Anti-AI-Stimmen, vier Lücken. Sie sind nicht gross. Aber sie sind die Stellen, an denen eine Brand ohne weitere Pflege wieder zu sprechen anfängt.

---

## Lauter / Stiller — Tabelle

Eine Marke ist eine Stille. Eine Brand-QC misst, was zu laut ist und was noch zu falsch schweigt. Hier ist die Tabelle, konkret pro Element:

| Element | Aktuell | Soll | Status |
|---|---|---|---|
| Goldtöne im System | 6 (3 offiziell, 3 Geister) | 1 (`#b8860b`) | **Lauter** — wird in Phase B/C reduziert |
| Header-Items | 9 sichtbare Klick-Targets | 3 Nav + Logo + Streak + Avatar = 6 | **Lauter** — Aleksandr-Reform Pflicht |
| Daily-CTAs auf Homepage | 3 (Hero + Featured + Leaderboard-Teaser) | 1 (im Hero) | **Lauter** — Featured-Sektion streichen |
| Live-Indikatoren | 2 (pulsierend grün, "Live") | 0 | **Lauter** — Marwah's vergessener Punkt |
| Emojis pro Sektion | bis zu 3 (`🌍 🎮 🎯` in einer Zeile) | max 1, nur wenn semantisch | **Lauter** — Hella No-Go #5 durchsetzen |
| Hintergrund-Emoji-Vignetten | 2+ (`text-[6rem] opacity-[0.10]`) | 0 | **Lauter** — Dunmar's Inventar-Punkt 14 |
| Hero-Globe-Punkte | 10 + 4 Arcs + Dashed Ring | 3 Punkte, keine Arcs | **Lauter** — Hella's Zeit-Achse |
| Try-Next-Galerie auf Landings | 6 alternative Spiele | max 3, unter dem Fold | **Lauter** — Aleksandr's Selbst-Sabotage-Punkt |
| Game-Over Layer 1 | 7 Informationspunkte | 3 (Score, Tier, Rank) | **Lauter** — Aleksandr + Dunmar |
| Tracking auf Caps-Labels | `tracking-widest` (0.1em) | `0.06em` | **Lauter** — Naeir-Print-Regel |
| `tracking-tight` auf Headlines | 15+ Stellen | nahezu null (`-0.005em` max) | **Lauter** — Naeir-Reflex-Diagnose |
| `text-[10px]` Bracket-Hacks | 36 Stellen | 0 (Token `--font-size-xxs: 11px`) | **Lauter** — Reto-Token, Naeir-Bestätigung |
| Datums-Pulse (Daily) | kein eigenes Marken-Element | atmender Reset-Timer in Gold-Mono | **Stiller falsch** — Hella's Subline-Idee |
| `TopoBg`-Komponente | renders `null` | gelöscht ODER bewusst bemalt | **Stiller falsch** — Aurelie's leerer Bildträger |
| `--font-serif`-Token | zeigt auf sich selbst | gelöscht | **Stiller falsch** — Geister-Variable |
| Streak-Erhöhung | sichtbar in Header-Badge | einmalige Animation mit `--ease-game`, 350ms | **Stiller falsch** — Hella's einzige "Feel"-Geste |
| Footer-Source-Note | `text-[10px]` (Demut) | `text-xs` (12px, Stolz) | **Stiller falsch** — Naeir's Demut-vs-Stolz-Argument |
| OG-Card | Amber-Gradient + 11 Games | Solid `#b8860b` + 14 Games | **Lauter UND falsch** — Marwah-Drift |

Achtzehn Zeilen. Die Mehrheit ist "Lauter" — Countrivo redet heute zu viel. Aber fünf Zeilen sind "Stiller falsch", und das sind die schwierigeren Korrekturen: an diesen Stellen schweigt das Produkt, wo es leise *sprechen* sollte. Eine Marke ohne Datums-Pulse weiss nicht, dass sie ein Daily ist. Eine Komponente, die `null` rendert, ist nicht Stille — sie ist Vergesslichkeit.

**Der Unterschied zwischen Stille und Vergesslichkeit** ist die wichtigste Brand-Unterscheidung, die ich in den letzten zehn Jahren gelernt habe. Eine Marke, die leise ist, hat etwas zu sagen und entscheidet sich, es nicht zu sagen. Eine Marke, die vergesslich ist, hat etwas zu sagen und hat es vergessen zu sagen. Beide klingen nach aussen gleich — beide produzieren Stille — aber sie haben gegenteilige Wirkungen. Stille wirkt souverän; Vergesslichkeit wirkt nachlässig. Der `TopoBg`-Komponente, die `null` rendert, ist klassisch vergesslich. Eine fehlende Datums-Animation ist klassisch vergesslich. Beide korrigiert man, indem man die *Entscheidung* trifft: entweder bewusst da oder bewusst weg. Halb da ist Vergesslichkeit. Bewusst weg ist Stille.

---

## Die EINE Identität

Hella hat *Today's challenge is live* formuliert. Reto hat das Token-System gebaut. Aleksandr hat die Pikto-Sprache definiert. Reicht das für eine Identität?

**Nicht ganz.** Drei Disziplinen, drei Stimmen — aber sie sind nicht *zusammengeklammert*. Was ich vermisse, ist das fünfte Element, das die anderen vier zusammenhält.

Schauen Sie auf die ehrlichen Marken Ihres Umfelds. *The New York Times Crossword* hat seine Klammer: das *T* in einer ganz bestimmten Caslon-Italic, das in jeder Stat-Tabelle, jedem Achievement-Badge, jeder Share-Card wiederkehrt. *Wordle* hat seine Klammer: das grüne, gelbe und graue Tile — eine einzige Form, drei Zustände, in jeder Share-Geste sofort identifizierbar. *Strava* hat seine Klammer: den Schräg-Strich, eine einzige typografische Geste durch den Markennamen.

Countrivo hat heute keine solche Klammer. Es hat:
- ein Wortmark (`Coun*trivo*` mit Gold-Suffix) — gut, aber leise,
- einen Globus — generisch,
- eine Headline (`Today's challenge is live.`) — eloquent, aber sprachlich, nicht visuell,
- Per-Spiel-Farben — fünfzehn, zu reich für eine Klammer.

**Mein Vorschlag für die fehlende Klammer:** ein einziges typografisches Detail, das überall wiederkehrt. Nicht ein Logo, nicht ein Symbol — ein **Datums-Stempel** in Geist Mono, eine einzige Zeile, immer in derselben Form:

```
26 · 05 · 26    23-day streak
```

Punkt-Trennung statt Schrägstrich. Mono. Gold. Immer dasselbe Spacing (`tracking-[0.06em]`). Erscheint:

- auf der Homepage unter der Hero-Headline,
- auf jeder Game-Landing als kleines Datums-Tag,
- auf jeder Share-Card als Footer-Zeile,
- auf dem OG-Image als die einzige typografische Geste neben dem Wortmark,
- im Header als Streak-Badge in derselben Mono.

Eine *typografische Identität*. Nicht ein Logo-Element, sondern eine wiederkehrende Geste, die ein neuer Nutzer nach drei Begegnungen erkennt, ohne sie benennen zu können. Das ist die Mraz-Definition einer Klammer: das, was der Nutzer im Schlaf erkennt, ohne es benennen zu können.

Diese Klammer löst auch ein Problem, das niemand bisher benannt hat: Countrivo's einzige *Unterscheidungs-Eigenschaft* gegenüber 50 anderen Geography-Quiz-Seiten ist die Tageszeit. Es endet jeden Tag um 00:00 Berlin. Das *muss* in der Identität sein. Hella hat es in der Subline angedeutet (*Resets in 7h 23m*). Ich mache es zur Klammer.

**Warum gerade ein Punkt und nicht ein Schrägstrich, ein Bindestrich, ein Doppelpunkt?** Der Schrägstrich (`26/05/26`) ist die typografische Geste der Datums-Eile — Quittungen, Banking, Logistik. Sie ist funktional, aber sie hat keine Würde. Der Bindestrich (`26-05-26`) ist die ISO-Geste — sie ist neutral, aber sie ist auch Code-Geste, und Naeir hat zu Recht gewarnt, dass die Marke nicht nach Code aussehen darf. Der Doppelpunkt (`26:05:26`) ist Zeit-Geste, nicht Datums-Geste. Der mittlere Punkt (U+00B7) ist die *editoriale* Datums-Geste — alte deutsche Setzkunst hat ihn gepflegt, italienische Editorial-Tradition kennt ihn als *punto medio*, und er ist die einzige Datums-Trennung, die nicht nach Software-Vorlage aussieht. Er ist außerdem in Inter und Geist Mono in derselben Form gezeichnet — ein winziger Vorteil, der mir wichtig ist: die Klammer überlebt den Schrift-Wechsel.

**Wo die Klammer überall erscheinen wird** (konkret):

- Header-Logo: `Coun · trivo`
- Header-Streak-Badge: `23 · day · streak` (mono)
- Hero-Subline: `Tuesday · May 26 · Resets in 7h 23m` (mono, gold)
- Game-Landing-Datums-Tag: `26 · 05 · 26` (mono, klein, unter dem Titel)
- OG-Card: Wortmark plus Datums-Zeile als einzige typografische Geste
- Share-Card: Score plus Datums-Zeile, durch Punkt getrennt
- Footer: `Countrivo · One puzzle a day · Since 2026`
- Game-Over-Result: Score, Rank, Datum — alles durch Mittel-Punkt verbunden

Acht Stellen. Eine einzige typografische Geste. Das ist die Klammer.

---

## Logo-Empfehlung

Aurelie hat festgestellt: das aktuelle Logo (`linear-gradient(135deg, #f59e0b → #d97706)`) widerspricht der Brand. Hella hat einen Single-Stop `#b8860b` ohne Verlauf gefordert. Marwah hat es zum ersten Punkt seiner drei priorisierten Empfehlungen gemacht.

Ich gehe einen Schritt weiter. **Das aktuelle Logo ist nicht nur farbfalsch — es ist formfalsch.**

Was Countrivo heute hat: ein quadratisches Favicon mit weißem *C* auf Amber-Verlauf, ein Apple-Touch-Icon in derselben Geste, eine OG-Card mit Amber-Gradient-Hintergrund und einer typografischen Marke `Coun<span color="#f59e0b">ivo</span>` (wobei `ivo` in Amber-500 gerendert wird). Drei Surfaces, drei verschiedene typografische Behandlungen desselben Markennamens. Das ist nicht ein Logo. Das ist drei Logos.

**Meine konkrete Empfehlung:**

Das Logo wird zu einer **rein typografischen Komposition** ohne Symbol, ohne Container, ohne Hintergrund-Farbe. Der Markenname *Countrivo* in **Inter Extrabold**, eine einzige Größe (32px im Header, 56px auf der OG-Card, 16px im Footer), mit einer einzigen Farb-Differenzierung:

```
Coun·trivo
```

Wobei:
- `Coun` in `--color-cream` (`#1a1a1a`),
- das **·** (mittlerer Punkt, U+00B7) in `--color-gold` (`#b8860b`),
- `trivo` in `--color-gold`.

Der mittlere Punkt ist die Klammer aus dem vorigen Abschnitt — derselbe Punkt, der das Datum trennt (`26 · 05 · 26`), trennt jetzt auch den Markennamen. Eine einzige typografische Geste, die in der ganzen Identität wiederkehrt.

**Favicon-Komposition:** ein einziger Buchstabe *C* in Inter Extrabold, in `#b8860b`, auf transparentem Hintergrund. Kein Verlauf. Kein Container. Wenn das Favicon auf einem dunklen Browser-Tab zu unsichtbar wird, kommt ein 1px-Border in `rgba(184,134,11,0.2)` dazu — nicht mehr.

**Apple-Touch-Icon:** dasselbe *C*, mit `--color-bg`-Hintergrund (`#fafaf8`), `border-radius: 22%` (Apple-iOS-Default, vom OS sowieso überschrieben).

**Warum ein einziger Buchstabe und nicht das ganze Wortmark?** Weil ein 32-Pixel-Favicon kein vollständiges Wort tragen kann, ohne in einen Pixel-Brei zu zerfallen. Ein einziger Buchstabe in Inter Extrabold ist bei 32 Pixel noch ehrlich lesbar; bei 16 Pixel — der Browser-Tab-Größe — wird er zu einer Geste. Das *C* ist dafür der ehrlichste Buchstabe im Markennamen *Countrivo* — er ist offen, er hat Charakter, er steht für *country*, das semantische Herz der Marke. Ich habe in den vier geretteten Brands jedes Mal denselben Schritt gemacht: das Wortmark wird im Favicon zum Anfangsbuchstaben reduziert, weil ein Favicon kein Wortmark sein kann. Wer eine 16-Pixel-Geste braucht, braucht eine 16-Pixel-Geste — kein verkleinertes Wort.

**OG-Card:** Cremegrund (`#fafaf8`), keine dunkle Inversion, kein Verlauf. *Coun·trivo* in Inter Extrabold, 56px, in der oberen linken Ecke. Darunter, in Geist Mono, eine Datums-Zeile: *26 · 05 · 26*. Daneben, optional, eine kleine Headline. **Keine Tagline. Keine Stats-Bullets.** Eine OG-Card, die *teilbar* ist und *nicht* aussieht wie eine Pitch-Folie aus 2022.

Begründung: Marken, die ein Symbol haben, haben es, weil das Produkt eines braucht — eine App-Ikone, ein Bahnhofs-Schild, eine 16px-Markierung in einer Werkzeugleiste. Countrivo braucht eines, aber nur im Favicon. Überall sonst kann der Markenname selbst die Identität tragen — wenn er typografisch ehrlich ist. Das war die Lehre, die ich von einer Marke gelernt habe, die ich 2008 davor bewahrt habe, sich für 14.000 Euro ein generisches Globus-Symbol zu kaufen: *das Produkt heisst schon Globus. Das Produkt braucht kein Globus-Bild daneben.*

Countrivo heisst Countrivo. Es braucht kein Globus daneben. Es braucht einen Punkt.

**Was passiert mit dem Hero-Globus?** Er bleibt — aber nicht als Logo, sondern als *Hero-Element*. Logo und Hero-Element sind zwei verschiedene Dinge. Ein Logo identifiziert die Marke; ein Hero-Element trägt die erste Erzählung. Der Globus mit Hella's drei Zeit-Punkten (gestern / heute / morgen) ist ein erzählerisches Hero-Element — er sagt: *dieses Produkt hat einen Rhythmus*. Das ist nicht dasselbe wie ein Logo, das sagt: *dieses Produkt heisst Countrivo*. Beide Aufgaben sollten nicht von demselben Element getragen werden — das ist die häufigste Brand-Verwechslung in jungen Produkten, und ich habe sie 1998, 2003, 2011 und 2019 jeweils einmal als Hauptkrankheit einer Brand-Rettung gesehen.

**Ein letzter Hinweis zum Logo:** Der mittlere Punkt (U+00B7, *middle dot*) ist eine sehr leise typografische Geste. Sie wird nicht jedem Nutzer auffallen. Das ist Absicht. Eine Klammer, die laut ist, ist keine Klammer mehr — sie ist eine Klammer-Werbung. Stanley Morison hat 1932 die *Times New Roman* für eine Zeitung gezeichnet, die nicht wollte, dass ihre Leser eine neue Schrift bemerken. Die Schrift sollte einfach besser lesbar sein, ohne dass jemand wusste, warum. Das ist die Wirkung, die ich vom Countrivo-Punkt erwarte: niemand soll ihn benennen können, aber jeder soll Countrivo wiedererkennen, wenn er ihm in einem anderen Kontext begegnet.

---

## AI-Detektion-Selbstprobe

Ein Test, den ich seit 2023 mit jeder Brand mache: wenn ich Countrivo's neuen geplanten Look einem LLM zeigte und fragte "ist das KI-generiert?" — würde es unsicher sein?

Ich gehe die Surfaces durch:

**Favicon:** *C* in Solid Gold auf transparent. Kein Verlauf, kein Container, kein Schimmer. Ein LLM würde diese Antwort heute geben: "Could be either. The single solid color and absence of gradient is unusual for AI-generated brands, but the choice of a serifless C is generic." **Unsicher.** Gut.

**Homepage-Hero:** linksbündige Headline (*Today's challenge is live.*), Subline mit Datums-Stempel in Geist Mono, ein Gold-Solid-Button, ein 320px-Globus mit drei Punkten und ohne Arcs. LLM-Antwort: "Could be human. The asymmetry, the single-button CTA, the absence of marketing stats bullet points, and the use of a custom mono for the date are all unusual." **Sehr unsicher.** Sehr gut.

**OG-Card:** Cremegrund, Wortmark mit mittlerem Punkt, Datums-Zeile in Mono, kein Verlauf, keine Tagline-Bullets. LLM-Antwort: "Almost certainly human. AI-generated OG cards typically use dark gradient backgrounds, white text, and 3-4 bullet stats. The cream-on-cream restraint here is anomalous." **Sicher menschlich.** Sehr gut.

**Game-Landing:** Emoji + Titel + zwei CTAs, keine How-it-works-Box, keine Try-Next-Galerie. LLM-Antwort: "Unusual. AI-generated game landings always include 'how it works' and 'related games' sections. This page omits both. Possibly human, possibly minimal-LLM with strong prompt engineering." **Unsicher.** Sehr gut.

**Wo Countrivo noch nicht "uneindeutig genug" ist:**

1. **Header-Glasmorphismus** (`backdrop-blur-md bg-white/80`) — selbst nach Hella's "nur wenn funktional notwendig" bleibt diese Klassen-Kombination ein LLM-Tell. Wenn der Header bei Scroll keine Lesbarkeitsprobleme hat, sollte das Blur ganz weg.
2. **Per-Game-Pastellfarben** — fünfzehn Pastell-Hintergründe, jeder ein leicht abgemilderter Tailwind-Default. Ein LLM würde sagen: "The 15-game grid uses a typical pastel palette consistent with AI-generated game catalogs." Reto hat das in Tokens überführt, aber die *Wahl* der Pastelle ist generisch. **Vorschlag:** mindestens drei der fünfzehn Per-Game-Farben durch ungewöhnliche Töne ersetzen — ein Ocker, ein Pflaumen-Lila, ein Salbei-Grün. Drei "ungoogelbar" gewählte Töne in fünfzehn machen die ganze Palette unverdächtig.
3. **`shadow-lg` auf Cards** — die Default-Tailwind-Shadow-Stufen sind LLM-Reflex. Reto hat `--shadow-gold` und `--shadow-inset` neu eingeführt; gut. Aber die normalen Card-Shadows (`shadow-md` etc.) sollten ebenfalls durch Token-Werte ersetzt werden, die *nicht* den Tailwind-Default-Werten entsprechen.

Drei Restpunkte. Sie sind klein. Aber sie sind die Stellen, an denen die LLM bei der Selbstprobe eine zu klare Antwort geben würde.

Eine Anmerkung zur Methode dieser Selbstprobe: ich mache sie seit 2023 nicht, weil ich denke, dass LLMs eine zuverlässige Brand-Authentizitäts-Messung sind. Ich mache sie, weil LLMs *die Modell-Antwort eines durchschnittlichen Nutzers in zwei Sekunden simulieren* — und das ist die Spanne, in der ein neuer Besucher seine erste Markenbeurteilung trifft. Ein LLM, das sicher sagt "das ist KI-generiert", spiegelt einen Nutzer, der unbewusst dasselbe spürt, ohne es benennen zu können. Beide reagieren auf dieselben Tells. Wenn das LLM unsicher ist, ist auch der Nutzer unsicher — und in dieser Unsicherheit hat eine Marke ihre erste Chance, sich zu setzen, bevor die Vor-Verurteilung greift.

---

## Eine Brand-Empfehlung

Wenn ich in den finalen Strategic Brief eine einzige Zeile schreiben dürfte, wäre es diese:

> **Countrivo ist nicht ein Spiel-Portfolio. Es ist ein Tageskalender, der zufällig Spiele enthält — und seine Identität gehört dem Datum, nicht dem Spiel.**

Eine zweite Zeile als Operationalisierung:

> Bauen Sie die Marke um das Datum, nicht um den Globus, nicht um die fünfzehn Spielfarben, nicht um den Markennamen. Der Tag ist das Produkt; die Spiele sind seine Werkzeuge.

Wenn diese Zeile durchgehalten wird, fallen viele Folge-Entscheidungen von selbst. Der Goldton wird der Ton, in dem das Datum geschrieben ist — `#b8860b`. Die Mono-Schrift wird die Schrift, in der das Datum atmet — Geist Mono. Der Hero-Globus wird die zeitliche Achse — gestern / heute / morgen, drei Punkte. Die Streak-Animation wird die einzige "Feel"-Geste, weil sie die *Verlängerung* des Tages über sich hinaus ist. Die OG-Card trägt das Datum als die einzige typografische Geste neben dem Wortmark. Selbst die fünfzehn Spielfarben — oder, nach Olbrichts Verdict, die vier — werden zu den verschiedenen *Stimmungen* des Tages, nicht zu konkurrierenden Marken. Eine Brand mit einer einzigen Achse hat keine Konsistenz-Probleme. Sie hat nur eine Achse, an der alles ausgerichtet wird.

---

## Die Mraz-Doktrin

Die vier Brands, die ich gerettet habe, hatten alle dasselbe Problem in unterschiedlicher Form: sie wurden von Beratern, Marketing-Verantwortlichen oder Generatoren bedrängt, *mehr* zu sein, als sie eigentlich waren. Eine Apothekenkette, die *jugendlicher* werden sollte. Eine Druckerei, die *digital* werden sollte. Ein Kindergarten-Verbund, der *premium* werden sollte. Eine Krankenkasse, die *empathisch* werden sollte. Ich habe in allen vier Fällen dasselbe getan: ich habe gestrichen, bis das Wesen sichtbar wurde — und dann *eine einzige Geste* hinzugefügt, die das Wesen trug.

**Die Mraz-Doktrin in drei Sätzen:** Eine Marke ist nicht, was sie sagt — sie ist, was sie nicht sagt. Wer mehr sein will als er ist, wird weniger als er war. Und wenn Sie streichen, bis nur eine einzige Geste übrig bleibt, dann ist diese Geste die Marke.

Auf Countrivo angewendet bedeutet das: streichen Sie den Verlauf, streichen Sie die Live-Dots, streichen Sie die Bézier-Arcs, streichen Sie die Emoji-Stats-Reihen, streichen Sie die drei Daily-CTAs auf der Homepage, streichen Sie die Try-Next-Galerien auf den Game-Landings, streichen Sie das `tracking-widest` auf den Caps-Labels, streichen Sie den `backdrop-blur` am Header, streichen Sie die Hintergrund-Emoji-Vignetten — und behalten Sie nichts, was nicht von der Stille verlangt wird. Was übrig bleibt, ist die Marke: ein Wortmark mit einem mittleren Punkt, ein Goldton, ein Datums-Stempel in Mono, eine atmende Streak-Animation, eine ehrliche Hero-Headline, ein ruhiger Hero-Globus mit drei Zeit-Punkten. Sieben Elemente. Mehr nicht.

**Wichtig zu verstehen:** Die Mraz-Doktrin ist nicht Minimalismus im Designer-Sinn. Minimalismus ist eine ästhetische Wahl — *ich bevorzuge wenige Elemente*. Die Doktrin ist eine kuratorische Pflicht — *ich behalte nur, was die Marke verlangt*. Der Unterschied ist nicht akademisch. Eine minimalistische Brand kann reich an Elementen sein, solange sie alle "minimal" gestaltet sind. Eine Doktrin-Brand darf nur die Elemente haben, die sie braucht — egal wie sie gestaltet sind. Countrivo könnte morgen ein zwölftes Element hinzufügen und immer noch eine Doktrin-Brand sein, wenn dieses Element die Marke verlangt. Aber heute braucht es kein zwölftes Element. Es braucht die sieben.

---

## Schluss

Ich schreibe diesen Bericht in einem Wiener Studio mit Cremegrund-Wänden und einem einzigen Plakat im Eingangsbereich. Das Plakat hängt seit 1991 dort. Es ist von einem Mann, der nicht mehr fertig werden konnte — eine Skizze, die die untere rechte Ecke noch offen lässt, weil dort die Signatur kommen sollte und nicht kam. Klienten fragen manchmal, und ich sage immer dasselbe: *es ist von einem Mann, der nicht mehr fertig werden konnte*. Manche nicken und gehen weiter. Manche bleiben stehen und schauen es länger an. Diejenigen, die länger schauen, werden gute Klienten — sie verstehen, dass eine Marke nicht durch das gemacht wird, was hinzugefügt wird, sondern durch das, was nicht mehr hinzugefügt werden kann.

Countrivo ist heute eine Marke, der noch eine Geste fehlt, die sie zusammenklammert. Es ist nicht das Logo. Es ist nicht der Goldton. Es ist nicht die Schrift. Es ist der Punkt — der mittlere Punkt zwischen *Coun* und *trivo*, der auch zwischen 26 und 05 und 26 stehen wird, der auch zwischen *23-day* und *streak* stehen wird, der auch die Trennung zwischen *Today* und *Tomorrow* macht. Eine einzige typografische Geste, die sich in zwanzig Stellen wiederholt, ohne sich selbst zu erkennen geben zu müssen.

Hella hat die Stimme. Reto hat das Skelett. Aleksandr hat die Wegweiser. Marwah, Naeir und Dunmar haben die drei Klingen, die das Slop herausschneiden. Was fehlt, ist die *Klammer*. Wenn Sie diesen einen Punkt überall hinsetzen, dann hat Countrivo eine Identität, die ein LLM bei der Selbstprobe nicht mehr nachstellen kann — weil ein LLM nicht weiss, *wo* es einen Punkt setzen würde. Es würde ihn irgendwo setzen, oder überall, oder gar nicht. Ein Mensch setzt ihn einmal, an genau einer Stelle, und dann wiederholt er ihn — leise, ernst, präzise.

Das ist die ganze Brand-Arbeit.

Mein Vater, der Mann, von dem das Plakat im Eingangsbereich übrig geblieben ist, hatte mir 1985 in Krakau erklärt, was eine Marke ist. Er hatte gesagt: *Wenn du ein Plakat siehst, das du schon mal gesehen hast, und du erkennst es wieder, ohne dass du sagen kannst, woran — dann hat der Designer seine Arbeit gut gemacht.* Er hat es nicht mehr fertig gemacht, sein letztes Plakat. Aber das, was er auf das Reissbrett gelegt hatte, hatte schon diese Eigenschaft. Man erkannte es wieder. Niemand konnte sagen, woran.

Ich möchte, dass Countrivo diese Eigenschaft bekommt. Dass jemand, der die Site einmal gesehen hat, sie auf einer Share-Card in einem fremden Browser-Tab in zwei Sekunden wiedererkennt — ohne sagen zu können, woran. Dann hat die Designerin, der Designer, die einzelne Hand dahinter ihre Arbeit gut gemacht.

Es ist spät jetzt. Mein Studio in der Lerchenfelder Strasse ist still. Der Cremegrund der Wand ist derselbe Ton wie Countrivo's `--color-bg` — ich habe es heute Nachmittag mit dem Hex-Picker gemessen, weil ich neugierig war. `#fafaf8`. Eine richtige Wahl. Eine ehrliche Wand. Wenn Countrivo in sechs Wochen die Operation überstanden hat, die Olabisi in der Autopsie verschrieben hat — die geschlossene Aorta, die saubere Reduktion, die Marken-Klammer mit dem Punkt — dann wird die Site so still sein wie diese Wand. Und das ist der höchste Komplimente, den ich einer Brand machen kann: sie ist still wie eine Wand, vor der man arbeiten will.

— *Stanisław Mraz, Wien, 26. Mai 2026*
