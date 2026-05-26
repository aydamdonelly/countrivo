# 01 · Hella Branken · Brand & Feel

> Ich habe seit sieben Jahren keine Marke mehr "poppen" lassen, und ich werde es bei Countrivo auch nicht tun.

---

Ich öffne die Site. Ein blasser Hintergrund, ein leiser Globus, eine Headline, die mir sagt: *Today's challenge is live.* Es gibt schlechtere Erste-1.5-Sekunden im Internet. Es gibt auch deutlich bessere. Was hier liegt, ist eine ehrliche Skizze — aber sie ist an drei Stellen unsicher, und Unsicherheit ist das einzige, was Marken töten, was Code nicht reparieren kann.

Aurelie hat die Pigmente offengelegt: sechs Goldtöne, ein toter Hintergrund (`TopoBg` returnt `null`), ein Globus, der für ein dunkles Theme gemalt wurde und nun auf Cremegrund fast unsichtbar ist. Das sind keine Renderfehler — das sind Identitätsfehler. Ich entscheide jetzt.

---

## Die eine Idee

**Countrivo ist die *New York Times*-Crossword-Seite für Geografie: ein tägliches Ritual, das man morgens spielt und mittags vergisst, aber dreißig Tage in Folge.**

(In einem Satz: *One world. One puzzle a day. Forever.*)

Keine "AI-powered". Keine "gamified". Keine "interactive learning experience". Ein Daily. Ein Streak. Eine Welt aus 243 Ländern. Punkt. Wenn jemand auf der Postkarte mehr lesen muss, ist die Postkarte falsch geschrieben.

---

## Goldton-Entscheidung

Aurelie hat sechs gezählt. Ich erkläre drei für tot und einen für Sieger:

**Sieger: `#b8860b` — das offizielle Brand-Gold.** Bleibt. Wird auf alles ausgerollt.

**Tote:**
- `#f59e0b` / `#d97706` (Logo + OG-Card) — wird angeglichen. Das Logo bekommt einen Single-Stop-`#b8860b` ohne Verlauf. Kein 135°-Gradient. Verläufe sind Slop-Tell #1.
- `#c9a44c` (Hero-Globe-Punkte) — wird umgemalt. Auf cremefarbenem Hintergrund ist das fast nicht zu trennen vom Goldton. Wenn der Globus auf dunklem Grund leben soll, muss der Grund dunkel sein — nicht der Goldton aufgehellt. Siehe unten, Hero-Section.
- `--color-gold-bright: #d4a017` — bleibt als Hover-State erhalten, aber nur für **interaktive Surfaces** (Hover/Active auf CTAs). Niemals als statisches Brand-Element.

**Begründung:** Ein Pharmazeut hat mir vor Jahren gesagt: "Es gibt keine zwei Gelb, die im Auge des Patienten gleich aussehen — also nimm eines." Dasselbe gilt hier. `#b8860b` ist warm, gedämpft, hat den Ton von gealtertem Messing und nicht von Sonnenuntergangs-Stock-Footage. Es ist das ehrlichste der sechs. Es trägt die Marke ohne zu schreien. Ein Gold, das nicht weiß, dass es Gold ist — und genau deshalb funktioniert.

`#f59e0b` ist Tailwind-Amber-500. Es ist das Gold, das jeder LLM-Generator in den ersten 30 Sekunden vorschlägt. Es ist Stripe-Glow, es ist Vercel-Hover, es ist *make it pop*. Es ist nicht Countrivo.

**Migrationspflicht:** Alle Hex-Literals (`daily-hero.tsx:170`, `friends-client.tsx:372-382`, `country-draft/page.tsx`, `hero-globe.tsx`-Punkte) auf `var(--color-gold)` ziehen. Eine Pille, eine Farbe, kein Atelier.

---

## Typografie-Direction

**Verdict: Inter bleibt. Eine zweite Schrift kommt. Aber nicht das, was du denkst.**

Inter ist die *Bedienschrift*. Sie macht ihren Job. Sie ist nicht langweilig — sie ist *unauffällig*, und das ist eine Tugend in einem System, in dem 243 Länder-Emojis und 21 Kategorien um Aufmerksamkeit kämpfen. Wer hier eine Display-Sans-Serif obendrauf packt (Cabinet Grotesk, Söhne, General Sans), bekommt Web3-Startup-Energy. Wir sind kein Web3-Startup. Wir sind ein Kreuzworträtsel.

**Was dazukommt: eine Mono.**

Konkret: **JetBrains Mono** oder **IBM Plex Mono**, geladen als `--font-mono` über `next/font`. Geistervariable `--font-serif` wird **gelöscht**.

Verwendung — und nur hier:
- Score-Zahlen (`text-lg font-extrabold font-mono` ist schon halb angedeutet auf der Homepage)
- Streak-Counter
- Daily-Reset-Timer (`Resets in 7h 23m`)
- Tabellarische Zahlen in Rankings + Leaderboards
- Country-Codes (DE, FR, JP) wo sie als Token erscheinen

**Begründung:** Stats sind das emotionale Herz eines Daily-Spiels. Spotify Wrapped, Strava, Wordle — alle haben Monospace-Zahlen, weil Zahlen mit gleicher Breite *wiegen*. Sie wirken wie Fakten. Inter-Zahlen wirken wie Hinweise. Bei einem Geography-Spiel, das mit Bevölkerungs- und Flächendaten arbeitet, will ich Fakten. Ich will, dass `9,847,000` und `2,341` direkt untereinander stehen und keinen Millimeter zucken.

Das ist außerdem das **einzige typografische Mittel**, das wir uns leisten — eine zweite Schrift mit klarer, semantisch begrenzter Rolle. Kein Display-Font, kein Slab-Serif für "personality". Disziplin ist die Personality.

**Skalen-Stufe ergänzen:** `--font-size-xxs: 11px`. 20+ Bracket-Hacks (`text-[10px]`, `text-[11px]`) werden auf diesen Token gehoben. 10px ist verboten. Wenn Information bei 11px nicht lesbar ist, gehört sie nicht hin.

---

## Erste 1.5 Sekunden

Der User landet auf countrivo.com. Er sieht zuerst **einen Satz** — sehr groß, links-ausgerichtet, nicht zentriert: *Today's challenge is live.* Darunter, in halber Schriftgröße, in Gold-Mono: das Datum + ein pulsierender Streak-Counter wenn er angemeldet ist (*23-day streak.*). Rechts daneben, nicht in der Mitte: ein **kleinerer, ruhigerer Globus** — kein 700px-Riese, ein 280-320px Element, eine schwere, gedämpfte Linie, keine zehn pulsierenden Goldpunkte, sondern **drei**: einer für *gestern* (gedämpft), einer für *heute* (atmend), einer für *morgen* (transparent). Eine zeitliche Achse, keine geografische.

Der CTA ist **ein einziger Button**: *Play today's challenge →*. Schwarz auf Cremegrund mit goldenem Rand, kein Verlauf, kein Shadow, kein Glow. Wenn der User hovert, verschiebt sich nichts — der Hintergrund des Buttons wird ein Tick wärmer, von schwarz zu gold-dim. Das ist die ganze Mikrointeraktion. Keine Particles. Keine Confetti. Keine `transition-all duration-500`.

Unter dem Hero — und erst dort: das Daily-Progress-Pill (`3/11`), die Stats-Reihe, die Leaderboard-Teaser. Das was heute *über* der Headline steht (`Live`-Badge, Datum, irgendwann auch Datum + Live) wird **eingedampft**: das Datum ist Teil der Headline-Sub-Line, das `Live`-Badge fliegt raus — ein Daily-Spiel ist per Definition live, das muss man nicht beweisen.

---

## 5 No-Gos

(Hellas persönlicher Index of Forbidden Patterns. Jedes davon ist mir in der echten Welt einmal passiert. Keines passiert nochmal.)

1. **Glasmorphism.** `backdrop-blur` ist erlaubt nur am Header (und auch dort prüfe ich, ob es weg kann). Kein `bg-white/40 backdrop-blur-xl border-white/20`. Wenn ich diese drei Klassen nebeneinander sehe, weiß ich, dass jemand ein LLM in Premium-Mode gebeten hat. Wir machen das nicht.
2. **Lineare Verläufe als Marken-Element.** `linear-gradient(135deg, ...)` ist im gesamten Repo verboten außer für funktional notwendige Verläufe (z.B. ein Fadeout am unteren Rand eines scrollbaren Bereichs). Logos, Buttons, Cards, Backgrounds: solid colors only. Das Logo, das aktuell `#f59e0b → #d97706` als 135°-Gradient ist — wird zu einem einzigen `#b8860b`. Atelier-Beweis: Wenn du den Verlauf weglässt und es sieht schlechter aus, war das Logo nie gut.
3. **Floating Particles, Stars, Confetti.** Es gibt zehn `<circle>`-Animationen im Hero-Globe. Acht davon werden gelöscht. Es bleiben drei. Wenn der User auf "Play" klickt und das Spiel beendet, gibt es **kein Confetti**. Es gibt einen Score, eine Zeit, und einen geteilten Streak. Confetti ist die Antithese zu "ich habe heute etwas gelernt".
4. **Mittig zentrierte Hero-Sektionen mit "radial-gradient background".** Aktuell ist es noch nicht ganz so schlimm, aber `DailyHero` ist `text-center py-8`. Wird umgebaut auf eine linke Ausrichtung mit klarer typografischer Hierarchie. Mittig-zentriert-mit-Radial-Glow ist *die* Slop-Signatur — jede LLM-Demo der letzten 24 Monate.
5. **Emoji-Inflation.** Aktuell: 🌍 🎮 🔥 🥇 👥 🎯 — alle in einer einzigen Zeile auf der Homepage. **Streichen.** Emojis dürfen pro Section maximal **einmal** erscheinen, und nur, wenn sie semantisch (Länderflaggen, Spielicons) sind. Das `🌍 243 countries 🎮 14 games`-Pattern fliegt raus. Diese Zahlen kommen, wenn überhaupt, in Mono unter den Hero, ohne Emoji.

---

## 5 Yes-Es

(Worauf Countrivo aktiv besteht.)

1. **Linksbündig, ruhig, schwer.** Hero-Section linksbündig, asymmetrisch, mit großzügigem Weißraum rechts. Headline-Größen erhalten — `text-5xl/text-6xl` ist richtig. Aber: Ausrichtung weg von der Mitte. *Times New York Times.* Nicht *SaaS Landing 2024*.
2. **Solid Goldknopf, schwarzer Hover-Rand.** Der CTA-Knopf ist `#b8860b`-Hintergrund, weißer Text, kein Shadow, kein Glow. Im Hover wird er einen Tick *dunkler* (nicht heller — `--color-gold-solid: #96700a`). Im Active scaliert er auf 0.97. Das ist die ganze Interaction-Sprache: solid → dunkler → klein. Nicht solid → heller → groß.
3. **Monospace für Zahlen.** Jede Zahl, die ein User "lesen wie ein Fakt" soll — Score, Streak, Bevölkerung, Reset-Timer, Country-Code, Rank-Position — wird in Mono gerendert. Konsistent, durchgehend, ohne Ausnahme.
4. **Eine sehr leise Animation pro Session.** Der pulsierende `live`-Punkt verschwindet. Stattdessen: der goldene Streak-Counter im Header animiert *einmal*, beim Inkrementieren, mit `--ease-game` und 350ms. Das ist die einzige "feel"-Animation auf der Seite. Spiele dürfen mehr — die Marke selbst atmet einmal pro Streak-Update.
5. **Datum als Marken-Element.** *Tuesday, May 26* in der Subline. *Resets in 7h 23m* als zweite Mono-Zeile. Diese Zeitlichkeit *ist* die Marke. Countrivo unterscheidet sich von 50 anderen Geography-Quiz-Seiten durch genau eine Eigenschaft: es endet jeden Tag um Mitternacht Berlin-Zeit. Das muss visuell omnipräsent sein, ohne pomp.

---

## Das Bild im Kopf

(Für Reto Bruckner und Aleksandr Vodník — was ihr ab hier weiterbaut.)

Stellt euch eine Frühlingsausgabe der *Süddeutschen Zeitung* vor — die Wochenend-Beilage, nicht das Hauptblatt. Cremegrund (`#fafaf8`, bleibt). Links oben, in einer Linie: *Coun**trivo*** — das **trivo** in einem ruhigen, gedämpften Gold, das wirkt, als wäre es gedruckt, nicht gerendert. Darunter, mit zwei Zeilen Abstand, die Hero-Headline in `font-extrabold`, schwarz, `text-6xl`: *Today's challenge is live.* In der Subline, in Inter-Regular, halbe Größe, in `cream-muted`: *Tuesday, May 26 · Resets in 7h 23m* — und das *7h 23m* in **Mono**, in Gold, mit einer leisen Atmung (genau ein Pixel Helligkeitsschwankung, alle 4 Sekunden). Das ist der Puls der Marke. Kein anderes Element atmet.

Rechts daneben, im rechten Drittel: ein Globus, der **nicht mehr 700px breit** ist. 320px maximal. Latitude/Longitude-Linien in `rgba(0,0,0,0.05)` — sichtbar, aber nicht aufdringlich. Drei pulsierende Punkte (nicht zehn): gestrige Spielpunkte (gold-dim), heutige (gold-bright, atmend), morgige (gold-ghost, 0.3 Opacity). Keine Bézier-Arcs zwischen den Punkten — Aurelies "verbindende Linien" sind 2018-Stripe-Hero. Wir sind nicht 2018. Wir sind morgen früh um 9 Uhr in der Küche.

Unter dem Hero, zwei volle Bildschirmhöhen Abstand, eine einzige Linie in `border-black/8`. Darunter beginnt der Spielbetrieb: heute zu spielen, Leaderboard, weitere Spiele. Aber das ist nicht das Erste, was der User sieht. Das Erste ist: ein Datum, ein Versprechen, ein Globus, ein Knopf. Vier Elemente. Mehr nicht.

Wenn ihr eine Komponente in diesem Hero verbaut, die mehr als drei sichtbare Animationen pro Sekunde rechnen lässt, habt ihr mich verloren. Wenn ihr einen `backdrop-blur` einbaut, der nicht funktional notwendig ist (Header-Sticky-Lesbarkeit), habt ihr mich verloren. Wenn ihr im finalen Review denkt "das wirkt etwas leer" — *ihr habt es richtig gemacht*. Lasst es leer. Das Leere ist die Marke.

---

## Schluss

Ich will gemessen werden an drei Dingen:

Erstens — wenn jemand Countrivo auf einer Website screenshottet und einer LLM die Frage stellt "ist das KI-generiert?", will ich, dass die LLM unsicher ist. Genau diese Unsicherheit ist das, was Marken trägt. Die Mehrheit von dem, was heute im Web entsteht, hat dieses Anti-Signal verlernt. Ich will, dass Countrivo es zurückträgt.

Zweitens — wenn der gleiche Mensch nach einer Woche das Goldgelb sieht, ohne den Domain-Namen, will ich, dass er sagt: *das ist die Geography-Seite mit dem Daily.* Ein Pigment, ein Format, ein Versprechen.

Drittens — wenn jemand mich in fünf Jahren fragt, ob ich Countrivos Re-Brand würde poppen lassen, will ich antworten: *Nein. Es popped nicht. Es bleibt.*

Mein Vater fragt jeden Sonntag, ob ich endlich was rebrandet habe, das man sich merkt. Diese Marke soll diejenige sein, bei der ich nächste Woche sagen kann: ja. Es ist eine kleine. Aber sie verteidigt sich selbst.

— *Hella Branken, Zingst / Berlin, 26. Mai 2026*
