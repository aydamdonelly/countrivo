# 03 · Aleksandr Vodník · Signage & Affordance

> Ein Schild muss in einer Sekunde verstanden werden. Sonst ist es kein Schild — sonst ist es Dekoration. Und Dekoration kostet Leben.

Ich habe mir die Homepage angeschaut, den Header, das Game-Landing, die Spielliste, ein paar Boards, das Game-Over-Screen. Was ich sehe ist nicht furchtbar. Es ist solide gebaut. Aber es ist gebaut wie ein gut gemeintes Bahnhofs-Schild aus den 90ern, das sieben Informationen gleichzeitig auf einer Tafel zeigt — und genau deshalb keine davon. Ich gehe Stück für Stück durch.

---

## Navigation

Ich öffne `header.tsx` und zähle. Im Header stehen, je nach Login-Status, gleichzeitig:

1. Logo `Countrivo`
2. Nav-Link **Play** (führt auf `/games`)
3. Nav-Link **Rankings**
4. Nav-Link **Friends** (mit Badge)
5. Nav-Link **Profile** (wenn eingeloggt)
6. **StreakBadge**
7. **Daily-Progress-Pill** `X/12`
8. Avatar mit Dropdown
9. ODER: **Sign in** + **Daily challenge** CTA

Das sind bis zu **neun gleichzeitig sichtbare Targets** in einer 56 Pixel hohen Leiste. Auf Mobile ist das `overflow-hidden`-Container der Nav-Items keine Lösung, sondern ein Eingeständnis: ihr wisst, dass es nicht passt, also schneidet ihr ab. Václav hätte gesagt: "Wenn dein Schild abgeschnitten werden muss, war es nie ein Schild — es war eine Bibliothek."

Schauen wir hin, was tatsächlich navigiert wird:

| Item | Was es ist | Was der Nutzer denkt |
|---|---|---|
| **Play** → `/games` | Liste aller Spiele | "Aber ich will doch das Daily…" |
| **Rankings** → `/categories` | Länder-Rankings nach Statistik | "Was ist das?" |
| **Friends** | Friend-Management | "Habe ich noch keine" |
| **Profile** | Eigene Stats | Erst relevant, wenn man eingeloggt UND aktiv ist |
| **StreakBadge** | Streak-Anzeige | Sinnvoll, aber konkurriert |
| **Daily X/12** | Fortschrittsanzeige | Sinnvoll, aber konkurriert |
| **Daily challenge CTA** | Direkt-Link zum Flagship-Daily | **Das ist die einzige Action, die zählt.** |

Drei dieser Items kämpfen um dasselbe Pixel-Territorium: Streak, Daily-Progress, Daily-CTA. Alle drei wollen sagen: "Spiel jetzt." Sie sagen es dreimal.

Und das Label **"Play"** für die `/games`-Liste ist eine Lüge. Wer auf "Play" klickt, will spielen. Stattdessen bekommt er eine Galerie und muss nochmal entscheiden. Das ist ein Schild, das "Ausgang" sagt und in einen weiteren Korridor führt.

### Mein Header in drei Items

```
[Countrivo]          [Daily]  [All games]  [Friends]          [Avatar / Sign in]
```

Drei Nav-Items. Nicht mehr.

1. **Daily** — direkt auf `/games/country-draft/play?mode=daily`. Das ist die Produkt-Versprechung. Ein einziger Klick. Wenn schon gespielt, wechselt es zu **Today's result** und führt auf die Leaderboard-Seite des heutigen Daily.
2. **All games** — die Galerie. Hier "Play" zu nennen ist Etikettenschwindel.
3. **Friends** — bleibt, mit Badge bei Anfragen.

**Was rausfliegt:**
- **Rankings** → in die Spielliste integrieren oder in den Avatar-Dropdown. Niemand kommt im Header-Reflex und denkt "ich will jetzt Länderrankings anschauen." Es ist eine Tiefe-Funktion, kein Top-Level-Aktion.
- **Profile** als Header-Item → ist schon im Avatar-Dropdown. Doppelung.
- **Daily X/12 Pill** → gehört NICHT in den Header. Gehört auf die Homepage als prominente Visualisierung. Im Header ist es ein nervöses Tic.
- **StreakBadge** → bleibt im Header, aber subtiler. Identitäts-Anker, nicht Action-Anker.

Das ergibt: Logo links, 3 Items mittig, Streak + Avatar rechts. Aufgeräumt. **Maximal sechs Klick-Targets.** Václavs Regel: nie mehr als sieben.

---

## Homepage-Hierarchie

Ich öffne `page.tsx`. Was ich sehe:

1. **DailyHero** (Komponente, nicht eingesehen, aber wahrscheinlich groß)
2. **Pending Challenges** (conditional)
3. **Today's featured game** Sektion — nochmal der Flagship mit großem CTA
4. **Today's leaderboard** Sektion (3 Stat-Kacheln)
5. **More daily games** Grid (alle anderen 14)
6. **Challenge friends live** mit Join-Code-Input

Das ist sechsfach gestapelt, und drei dieser Sektionen sagen dasselbe: **"Spiel das Daily."** Der DailyHero. Der "Today's featured game"-Block. Der "Today's leaderboard"-Block (impliziert: spiel mit, sei drauf).

Ein Bahnsteig mit drei identischen Pfeilen, die alle "Gleis 4" sagen, ist nicht klar. Er ist verwirrend, weil der Nutzer denkt: "Drei Pfeile? Es muss doch einen Unterschied geben…"

### Die EINE Sache

Was soll der Nutzer in einer Sekunde verstehen, wenn er auf `countrivo.com` landet?

> **"Hier ist heute ein Geography-Puzzle. Es wartet. Klick."**

Mehr nicht. Nicht "14 Spiele." Nicht "kostenlos." Nicht "kein Account nötig." Das alles ist Marketing-Reflex und Zweit-Information. **Im ersten Sekunden-Bild zählt: Daily. Heute. Jetzt.**

### Hierarchie, die ich will

**Above the fold (zweite Hälfte des Bildschirms beim Scrollen noch sichtbar):**

```
┌────────────────────────────────────────────────────┐
│  Today's Country Draft.                            │
│  May 26, 2026 · 1,247 players today · #142 to beat │
│                                                    │
│  [    PLAY  →    ]                                 │
│                                                    │
│  (Streak: 5 days)                                  │
└────────────────────────────────────────────────────┘
```

Eine einzige Karte. Datum. Heutige Spielerzahl (sozialer Beweis). Ein massiver CTA. Streak als kleine Identitätsspur darunter. Alles andere ist NICHT above the fold.

**Direkt darunter, sichtbar bei minimalem Scroll:**

Pending Challenges (falls vorhanden, ansonsten ganz weg). Das ist Identitäts-Trigger: "Jemand wartet auf dich."

**Erst beim weiteren Scroll:**

- Leaderboard heute (3 Kacheln)
- Tageszahlen-Statistik
- Andere Daily-Games als Galerie
- Friend-Challenge-Sektion mit Join-Code

### Was ich streiche

- **"Today's featured game"-Sektion** als zweite Wiederholung des DailyHero → weg. Das ist exakt dasselbe wie der Hero, nur mit anderer Header-Klasse.
- **"Challenge friends live"-Sektion** im aktuellen Form (3 Multiplayer-Spiele) → fragwürdig, weil Multiplayer eh gerade demontiert wird. Die `Join-Code-Input`-Funktion gehört NICHT auf die Homepage. Sie ist eine Power-User-Funktion. In den Footer. Oder in den Avatar-Dropdown unter "Join a game."

Das Ergebnis: drei vertikale Layer statt sechs. Erste Layer = "spiel jetzt." Zweite Layer = "deine Welt." Dritte Layer = "mehr entdecken." Das ist die natürliche Lese-Reihenfolge eines Nutzers.

---

## Spiel-Liste (15 Items)

15 Spiele auf `/games`. Hick's Law: bei sieben oder mehr Optionen kippt die Entscheidungsfähigkeit. Bei 15 ist sie tot. Der Nutzer scannt, scrollt, vergisst, klickt zufällig.

Aber die Lösung ist NICHT, die Liste zu zerstückeln in zehn Untergruppen. Das macht es schlimmer. Václav hat mal ein Schild auf der Hlavní nádraží gesehen, das 12 Bahnsteig-Hinweise in 4 Spalten anordnete: "Aleksandr, der Nutzer denkt nicht: 'Spalte B Zeile 3.' Er denkt: 'Wo ist mein Zug.'"

Die Lösung ist **Hierarchisierung mit klarem visuellen Anker**.

### Vorschlag

**Zone 1 — Heute (1 Item)**

Der Flagship-Daily, riesig, mit "wurde noch nicht gespielt"-Status oder "dein Score."

```
┌──────────────────────────────────────────┐
│  TODAY  ·  Country Draft                 │
│  3-5 min · hard · 1,247 played today     │
│  [ Play today →  ]                       │
└──────────────────────────────────────────┘
```

**Zone 2 — Schnell (4 Items)**

Alles unter 3 Minuten. `flag-quiz`, `capital-match`, `speed-flags`, `blitz`. Klares Versprechen: "kurz."

```
SHORT GAMES · under 3 min

🏁 Flag Quiz       🏛️ Capital Match
⚡ Blitz           🕐 Speed Flags
```

**Zone 3 — Strategie (4 Items)**

`country-draft` (auch hier verlinkt), `higher-or-lower`, `population-sort`, `stat-guesser`. Länger, anspruchsvoller.

**Zone 4 — Wissen-Spezialist (4 Items)**

`border-buddies`, `continent-sprint`, `odd-one-out`, `country-streak`.

**Zone 5 — Sozial / Wettkampf (verbleibende, bald wieder sortieren)**

`supremacy`, `borderline`, `countryle`, und was sich nach dem Multiplayer-Cleanup als sozial qualifiziert.

### Warum drei Buckets statt sechs

Drei Buckets ist Václav-Pikto-Regel: man kann sich an drei Dinge erinnern, an sechs nicht. **"Schnell — Strategie — Spezialist"** ist eine emotionale Achse, kein Kategorie-Wirrwarr. Der Nutzer kommt mit einer Intention ("Ich hab 2 Minuten") und findet sofort den Bucket.

### Was die aktuelle Seite richtig macht

Der Featured-Block oben ist gut. Die Game-Cards mit Farbe und Emoji sind klar genug. Die Meta-Chips (`difficulty`, `estimatedTime`) sind richtig — aber an drei Stellen auf einer Karte zu klein (`text-xs opacity-60` ist gnadenlos).

### Was sofort weg muss

- **Die SEO-Texte ganz unten** ("About Countrivo Games") — gehören in den Footer oder ausgelagert. Sie sind für Google, nicht für Menschen. Mensch sieht: Wall of Text unter den Karten → "ist das ein Blog?"
- **Die zwei FAQ JSON-LD Blocks** sind okay für Schema.org, aber prüft, ob die unsichtbar bleiben.

---

## Spiel-Landing

`game-landing.tsx`. Ich lese das Layout.

**Was funktioniert:**

- Emoji groß, Titel groß, Beschreibung kurz. Erste 0.5 Sekunden klar.
- Zwei CTAs (Daily / Practice) nebeneinander. Das ist gute Affordance: zwei Modi, sichtbar, gleich groß.
- Meta-Chips unter dem Titel: Schwierigkeit, Zeit, Kategorie. Drei Datenpunkte, akzeptabel.

**Was den Spieler ablenkt:**

1. **"How it works" Block.** Drei Regeln in einem grauen Kasten, 200 Pixel weiter unten. Das ist die zweithäufigste Ablenkung. Der Spieler hat schon entschieden zu spielen — er klickt jetzt auf Play. Niemand liest "How it works." Es ist Müll. Wenn der Spieler die Regeln nicht versteht, lernt er sie in der ersten Runde. In drei Sekunden. Nicht in einem How-it-works-Kasten.
2. **"Try next" Galerie.** Sechs alternative Spiele. Was sagt das dem Spieler? "Vielleicht ist dieses Spiel doch nicht das richtige." Das ist Selbst-Sabotage des Landing-Pages. Der Spieler wurde geführt zu dieser Seite, weil er DIESES Spiel spielen wollte. Wir sollten ihn nicht innerhalb von 800 Pixel zu sechs anderen Spielen umlenken.
3. **"View today's leaderboard"-Link** direkt unter den CTAs. Funktional okay, aber konkurriert visuell.

**Mein game-landing.tsx:**

```
[Emoji + Titel + Beschreibung]                   (zentral, oben)

[Meta-Chips: 3-5 min · hard · strategy]          (klein, unter Titel)

   ┌──────────────────┐  ┌──────────────────┐
   │   Daily          │  │   Practice       │   (zwei CTAs, gleich groß)
   │   Play today's   │  │   Unlimited      │
   └──────────────────┘  └──────────────────┘

[View today's leaderboard →]                     (klein, sekundär)

— — — — — — — — — — — — — — — — — — —          (Scroll-Linie)

(unter dem Fold)
[How it works — wenn überhaupt, scrollbar]
[Try next — 3 Items max, nicht 6]
```

**Brutale Streichung:** das How-it-works in die "About"-Section am Ende des Page-Scrolls oder ganz weg. Die "Try next" Galerie auf maximal 3 Items, und nur unten. Der Spieler darf nicht in einem 30-Pixel-Klickradius zwischen "spielen" und "zurück zur Galerie" stehen.

### Was bleibt vs. was geht

| Element | Bleibt? | Wieso |
|---|---|---|
| Emoji groß | ✓ | Erste 0.3s Erkennung |
| Titel + Beschreibung | ✓ | Identitäts-Anker |
| Daily / Practice CTAs | ✓ | Kern-Entscheidung |
| Meta-Chips | ✓ aber kleiner | Sekundär-Info |
| "Today's leaderboard" Link | ✓ subtil | Power-User-Brücke |
| How it works | nur unter dem Fold | Selten gebraucht |
| Mode-Beschreibungen | weg | Redundant zu CTA-Labels |
| Try next Galerie | reduziert auf 3 | Sabotiert sonst Conversion |

---

## In-Game-Klarheit

Das wichtigste Schild des ganzen Produkts. Während eines Spiels.

Václav: "Wenn das Schild im Bahnhof gut ist, denkst du nie über das Schild nach. Du gehst." Ein gutes In-Game-Pikto verschwindet, sobald du weißt, wo du bist.

Ich lese `game-session-top-bar.tsx`. Die Bar enthält:

1. **Modus-Badge** (Daily / Practice)
2. **Progress-Bar** (Gold-Füllung)
3. **Score** (Label + Wert)
4. **Extra-Info** (z.B. "Q3")
5. **Progress-Fraktion** (z.B. "3/10")

Das ist FÜNF Datenpunkte in einer Leiste. Punkt 4 und 5 doppeln sich teilweise. Der Modus-Badge ist nach der zweiten Sekunde im Spiel irrelevant.

### Was der Spieler in einer Sekunde sehen muss

Ich nehme das Flag-Quiz als Beispiel. Spieler ist mitten in Q5. Was muss er sehen?

| Priorität | Information | Größe | Position |
|---|---|---|---|
| 1 | **Die Frage / das Spielobjekt** (Flagge) | Riesig, zentral | Mitte oben |
| 2 | **Die Antworten / Klick-Targets** | Groß, klar | Mitte unten |
| 3 | **Aktueller Score** | Mittel, monospace | Oben rechts |
| 4 | **Fortschritt** (5/10) | Mittel | Oben rechts neben Score ODER Progress-Bar |
| 5 | Timer (wenn vorhanden) | Mittel | Oben links |
| 6 | Skip / Hint (wenn vorhanden) | Klein, sekundär | Eckbereich |

Modus-Badge nach Q1 ist überflüssig. Das Wort "Correct" als Score-Label ist Dekoration. Ein Zahl-Bruch `5/10` reicht. Der Spieler weiß was es ist.

### Konkrete Visual Hierarchy für die Top-Bar

```
[5/10] ────────────────────█████░░░░░░──── [Score: 4]
   ↑          ↑                                 ↑
fraction   progress bar                       value
```

**Drei Elemente. Nicht fünf.** Der Modus-Badge ist Kontext, der einmal beim Start gezeigt wird, dann ausblendet. Die Extra-Info "Q3" ist redundant mit "3/10."

### Submit-Button vs. Skip-Button

Wenn ein Spiel sowohl Submit als auch Skip hat (z.B. `border-buddies`), gilt:

- **Submit / primärer Action-Button**: Gold-Background, mindestens 48px hoch, mittig oder rechts unten.
- **Skip / sekundärer Action-Button**: Transparent oder grau-outline, gleich hoch, links daneben. **NIE in derselben Farbe wie Submit.** Skip muss nach "passive Wahl" aussehen.

Ratio: Submit-Größe = 1.0, Skip-Größe = 0.85 visuell. Skip ist da, aber nicht einladend.

### Während eines Spiels weg

- Header mit Friends-Badge, Streak-Badge, Daily-Progress-Pill → **alles ausblenden**. Im Spiel ist nur das Spiel relevant. Das ist die Pikto-Regel "Im Notfall siehst du nur den Pfeil, nicht das Werbeplakat daneben."
- Falls technisch unmöglich, dann dimmen auf 30% Opacity während des aktiven Spiels.

---

## Game-Over-Hierarchie

Ich lese `game-over-screen.tsx`. Es sind vier Layer, sauber strukturiert, das ist gut. Aber die Hierarchie auf Layer 1 — der Verdict — ist verwirrt.

Was auf Layer 1 alles steht:

1. **Score** (riesig, gold, mono)
2. **Tier-Label** ("Solid")
3. **Rank #142 / 1247**
4. **"You beat 1105 players"**
5. **"Better than 89%"**
6. **Tier-Message** ("You know your stuff.")
7. **Personal-Best-Banner** (conditional)

Das sind **sieben Informationspunkte** in einer einzigen Kachel. Der Score (Punkt 1) ist visuell dominant — gut. Aber Punkt 3, 4 und 5 sagen dasselbe in drei Sprachen:

- "#142 / 1247"
- "You beat 1105 players"
- "Better than 89%"

Drei Pfeile, dieselbe Richtung. Václav: "Wir wiederholen nichts. Wer wiederholt, vertraut dem Schild nicht."

### Pikto-Hierarchie für Game-Over

**Layer 1 — der Schock-Moment (3 Information):**

1. **Score** — riesig, gold. Das ist das EINE was er mitnimmt.
2. **Tier-Label** — eine kleine Wertung. "Solid." "Elite." "Perfect."
3. **Rank** — `#142` allein, NICHT `#142 / 1247`. Der zweite Teil ist Power-User-Info.

Personal-Best als Banner darüber wenn relevant. Sonst weg.

**Layer 2 — der Kontext (Optional, klein):**

- Beat-Count und Percentile sind redundant. Wählt EINS. Ich plädiere für **Percentile**, weil es eine Skalen-Aussage ist ("besser als 89%"), während Beat-Count irreführend wirkt bei kleinen Spielerzahlen ("You beat 0 players" am Morgen).
- "Better than 89%" — klein, unter dem Rank, eine Zeile.

**Layer 3 — Identity-Stats:**

Die `StatPill`-Reihe ist gut. Avg, vs avg, Attempts, Your best. Vier Pillen ist okay — sie sind alle gleichberechtigt und nicht "wichtig genug" um zu konkurrieren. Aber: vier Pillen NEBEN einer "Insight"-Text-Box drunter ist 5 Things wieder. Schlagt vor: **3 Pillen, kein Insight-Text**, oder **2 Pillen + Insight-Text**. Beides okay. Nicht beides voll.

**Layer 4 — Actions:**

```
[Save my score]  [Play again]  [Share]  [Challenge friend]
```

Vier Buttons in einer Reihe. Das ist zuviel. Hierarchie:

1. **Play again** (primär, gold)
2. **Share result** (sekundär)
3. **Challenge friend** (sekundär, conditional)
4. **Save my score** (conditional, nur für unangemeldete User)

Auf Mobile ist `grid-cols-2` okay — 2x2. Aber: **Save my score** und **Play again** dürfen NIE gleichzeitig sichtbar sein. Wer nicht eingeloggt ist, sieht "Save." Wer eingeloggt ist, sieht "Play again." Sonst ist es Kognition-Last.

**Layer 5 — Discovery ("Try another game"):**

Vier Vorschläge. Das ist die richtige Stelle dafür — am Ende, NACH der Schock-Phase und NACH den Actions. Hier ist es Sinn-stiftend ("ich bin fertig, was nächstes?"). Auf der Landing-Page wäre es Sabotage. Hier ist es Service.

### Hierarchie zusammengefasst

```
SCORE                    ← Layer 1 dominant (60% Aufmerksamkeit)
Tier                     ← Layer 1 (10%)
#142                     ← Layer 1 (5%)
Better than 89%          ← Layer 1 (5%)
─────────────────
(Stats: Avg / vs avg)    ← Layer 2 (10%)
─────────────────
[Play again]             ← Layer 3 (5%)
[Share] [Challenge]      ← Layer 3 (3%)
─────────────────
(Try another)            ← Layer 4 (2%)
```

Das ist eine echte Pyramide. Das was es jetzt ist, ist eine Flach-Pizza mit gleichgroßen Belags-Stücken.

---

## Pikto vs. Emoji

Aurelie hat festgestellt: Emojis statt Icons an vielen Stellen. Funktioniert das? Antwort: **teilweise.**

Wo Emojis funktionieren:

- **Game-Cards** (`🎯 Country Draft`, `🏁 Flag Quiz`, `🏛️ Capital Match`): Hier ist das Emoji ein **Identitäts-Tag**. Der Spieler lernt das Symbol mit dem Spiel zu assoziieren. Das ist genau das Prinzip von Václavs Bahnsteig-Pikto: ein klares, wiedererkennbares Symbol. Hier gilt: **lasst die Emojis.** Das ist die Marken-Sprache.
- **Stat-Kacheln auf Homepage** (`🥇 Top score`, `👥 Players today`, `🎯 Avg score`): Akzeptabel. Emojis als Dekoration, kein Funktional-Pikto.
- **Game-Over-Screen Header** (Trophäen-Symbolik): Ja.

Wo Emojis NICHT funktionieren:

- **Score-Anzeige im Top-Bar** während des Spiels: Emojis sind zu emotional für In-Game-Funktional-UI. Gold-Zahl ist klarer.
- **System-Funktionen**: Settings, Profile, Friends, Logout. Hier braucht es **funktionale Icons** — die sind im Code schon als `IconArrowRight`, `IconBars`, `IconFlag` etc. definiert. Gut. Lassen.
- **Statuszeichen** wie "Personal Best" — der "🥇" wäre einladend, aber das aktuelle Banner mit Text "New personal best!" funktioniert besser, weil es kategorisch ist.

### Václav-Pikto-Empfehlung

Es gibt drei Stellen, wo ein einfacher schwarz-auf-grün oder gold-auf-cream Pikto besser wäre als Emoji:

1. **Settings/Zahnrad** (wenn es kommt). Emoji ist zu spielerisch. Gear-Pikto.
2. **Friends-Person** im Header-Badge. Emoji 👥 ist okay, aber ein Person-Pikto wäre klarer auf Mobile-Größe.
3. **Submit / Confirm-Button** in Spielen: Pfeil-Pikto (`→`). Nicht Emoji `✅`. Der Pfeil sagt "weiter." Das Häkchen sagt "fertig." Im Spiel will der Spieler weiter, nicht fertig.

### Regel

> **Wenn das Symbol identifiziert, nimm Emoji. Wenn das Symbol leitet, nimm Pikto.**

Das ist Václavs Erbe.

---

## Schluss

Was muss in einer Sekunde verständlich sein? Wenn ich morgen früh um 7:15 auf countrivo.com lande, mit Kaffee in der Hand, halb wach, eine Minute vor der U-Bahn-Tür schließt:

> **"Heute. Country Draft. Klick."**

Das ist es. Mehr Information ist Lärm. Drei Pfeile in dieselbe Richtung sind kein klares Schild — sie sind drei nervöse Hände, die in dieselbe Richtung deuten und Vertrauen verspielen.

Ich habe in den 90er Jahren in Prag gelernt, dass jedes Schild ein Kompromiss zwischen dem ist, was man zeigen WILL, und dem, was der Mensch in der Sekunde, in der er es liest, BRAUCHT. Countrivo zeigt heute zu viel. Auf jeder einzelnen Seite. Header zeigt sechs Sachen, wo drei reichen. Homepage zeigt drei Daily-CTAs, wo einer reicht. Game-Landing zeigt sechs Alternativen, wo der Spieler eine Sache wollte. Game-Over-Screen sagt dreimal "du warst gut" in drei Sprachen.

Wenn ihr eine einzige Sache aus diesem Bericht mitnehmt, dann das: **Ein Schild, das in einer Sekunde verstanden wird, hat MAX drei Elemente.** Nicht drei Sektionen. Drei Elemente. Logo + 1 Pfeil + 1 Wort. Das ist genug.

Václav hatte recht: ein einzelner Pfeil rettet Leben. Drei Pfeile retten gar nichts — sie verwirren, kosten Zeit, und in dem Moment, in dem du in Rauch und Schreien stehst, ist das tödlich. Im Web ist es nicht tödlich, sondern nur ein Bounce. Aber ein Bounce ist die Web-Version eines Schildes, das versagt hat.

Macht es weniger. Macht es eindeutig. Lasst das Schild verschwinden, sobald der Nutzer weiß, wo er ist.

— Aleksandr Vodník, Berlin, 26. Mai 2026
