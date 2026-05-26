# 03 · Lou Yang · Fun-Forensik

> Felix war sechs. Er stand in der zweiten Reihe, hat den Kartentrick zwei Sekunden lang angeschaut und gesagt "Den hatten wir schon." Leise. Höflich. Vollkommen vernichtend. Seit jenem Sonntag im November 2019 designe ich keine Spiele mehr für die Spalte "Funktionen", ich designe sie gegen Felix. Heute halte ich Countrivo gegen Felix. Mal sehen, was bleibt.

---

## Der Felix-Test

Pro Spiel: Würde Felix in der zweiten Reihe sagen "Den hatten wir schon" oder leuchten seine Augen?

| Spiel | Felix sagt | Warum |
|---|---|---|
| **country-draft** | NEIN | Echtes Strategie-Spiel, jede Runde fühlt sich anders an. Das ist nicht "schon dagewesen", das ist neu erfunden. Flaggschiff verdient. |
| **flag-quiz** | JA | Multiple-Choice-Flagge. Sporcle hat das. Reddit hat das. Tausend Quiz-Apps haben das. Felix hat das in der App seiner Schwester schon gemacht. |
| **higher-or-lower** | JA | Die ganze Welt kennt "Higher or Lower". Es gibt Promi-Versionen, Karten-Versionen, YouTube-Channels mit Millionen Views. Countrivo's Take fügt nichts hinzu. |
| **capital-match** | JA | Brutalste Form von "wir hatten den schon". 4 Optionen, eine Hauptstadt — das ist Schul-Quiz-App von 2012. |
| **population-sort** | VIELLEICHT | Drag-Sortieren ist ungewöhnlich, fühlt sich physisch an. Aber 5-6 Länder reihen ist mechanisch nah an Connections-Sort. Felix-Augen würden müde werden in Runde 3. |
| **country-streak** | JA | Flag-Quiz mit Streak-Death — Mechanik identisch. Stress ersetzt nicht Frische. |
| **border-buddies** | NEIN | "Alle Nachbarn von Brasilien" hat in mir selbst beim Lesen eine Lust ausgelöst. Es ist eine Wissens-Frage mit einem klaren Aha. Das ist der Witz, den Sporcle hat — Countrivo hat ihn auch, sauberer. |
| **continent-sprint** | JA | Sporcle hat genau das seit 2008. Countrivo's Version ist nicht schneller, nicht schöner, nicht witziger. Den hatten wir schon. |
| **stat-guesser** | VIELLEICHT | Number-Guessing ist ein primitiver Reiz, der immer funktioniert. ABER: ohne Anker (wieviel ist viel?) verliert Felix die Lust. Wenn das Spiel anchors zeigt (Vergleichswert!), wird es JA-zu-NEIN. |
| **speed-flags** | JA | Speed-Flags ist Country-Streak mit Timer. Twofer auf "Den hatten wir schon". |
| **odd-one-out** | NEIN | Das ist eine echte Denkleistung. Vier Länder, drei teilen einen Trait. Hier passiert ein Aha-Moment — und Connections hat genau diesen Schmerz/Vergnügen popularisiert. Felix würde fragen "noch eins". |
| **supremacy** | VIELLEICHT | Top-Trumps mit Geographie. Top-Trumps ist 1968. Aber das taktische Card-Pick-Layer könnte tragen — bleibt Multiplayer-abhängig. |
| **borderline** | NEIN | "Find Weg von Mongolei zu Portugal über Nachbarländer" — das ist ein **echter Aha-Moment**. Wie Mini-Schach. Felix würde fünf Stunden spielen. |
| **blitz** | JA | Typen-unter-Zeitdruck. Sporcle macht das seit Geburt. |
| **countryle** | NEIN | Wordle-Struktur auf Statistiken. Der 6-Versuche-Trichter triggert echtes Nachdenken. **Das** ist der Felix-Moment. |

**Score: 7× JA · 3× VIELLEICHT · 5× NEIN.**

Sieben von fünfzehn Spielen würde Felix langweilen. Das ist nicht furchtbar, das ist auch nicht gut. Eine starke Daily-Lineup braucht maximal 4-5 Spiele, alle "NEIN". Der Rest ist Inhalts-Auffüllung und kostet Pflege ohne Spaß-Return.

---

## Der Funke-Moment, der funktioniert

**Der absolute Sieger: Countryle, Versuch 4 von 6.**

Schau dir die Engine an (`src/lib/game-logic/countryle/engine.ts:65-99`): Du tippst Frankreich. Pop ist niedriger als Target, GDP ist niedriger, Lebenserwartung ist niedriger. Drei Pfeile nach oben. Du denkst "größeres Land, reicher pro Kopf, ungesünder pro Person". Du tippst USA. Pop ist niedriger, GDP ist **höher**, life-expectancy ist niedriger. Plötzlich kollabiert dein Lösungsraum. Du **siehst** das Land vor dir, bevor du den Namen weißt.

**Warum dieser Moment funktioniert:**

1. **Constraint-Verkleinerung in Echtzeit.** Jeder Versuch entfernt sichtbar Möglichkeiten. Das ist das Wordle-Geheimnis: nicht "ich rate", sondern "ich folgere".
2. **Die sechs Stats sind orthogonal genug**, dass jeder Versuch echte Information liefert. Pop ↑ + GDP/Capita ↓ + Coastline ↑ ist eine völlig andere Insel als Pop ↓ + GDP/Capita ↑ + Coastline 0.
3. **Es gibt ein "fast"**. Du tippst Argentinien statt Brasilien — alles fast richtig, aber daneben. Das ist der Schmerz, den Connections so süchtig macht. "Ich hatte es!"
4. **Continent-Match-Hint** (`continentMatch: country.continent === state.target.continent`) ist ein subtiles "warm/kalt". Genau die richtige Menge Hilfe.
5. **Sechs Versuche**, nicht zehn. Knappheit erzeugt Gewicht. Drei wäre brutal, zehn wäre weichgespült. Sechs ist das, was Wordle gefunden hat. Stehlen wir.

Country-Draft hat einen zweiten Moment, der fast da ist: das **Reveal** nach Pick 8. Aber er fühlt sich noch zu sehr nach "Score-Bekanntgabe" an, nicht nach Storytelling. Wenn das Reveal-Tempo besser wäre — jede Kategorie einzeln, mit Drumroll-Pause —, wäre es ein zweiter Funke-Moment.

Border-Buddies hat ein leiseres Funken, das ich nicht übersehen will: der Moment, wo du Brasilien anschaust und nacheinander die Nachbarn aus dem Gedächtnis kramst und dabei merkst, dass du fünf wusstest und drei vergessen hast. Das ist ein **Selbst-Erforschungs-Moment**. Geographie-Spiele leben davon, dem Spieler zu zeigen, wie viel er weiß, ohne es zu wissen.

---

## Frustrationspunkte

Pro Spiel ein konkreter Frust-Punkt — die Stelle, wo Felix vom Stuhl rutscht.

| Spiel | Wo Felix verliert |
|---|---|
| **country-draft** | Pick 5-6. Du hast die offensichtlichen Picks gemacht (Russland ist groß, Indien ist bevölkerungsreich) und stehst vor einer Auswahl, wo nichts passt. Die Mid-Game-Strategie fühlt sich an wie "irgendwo zuweisen". Das Endspiel ist scharf, das Mittelspiel ist Brei. |
| **flag-quiz** | Runde 3, wenn der erste klare Wissensschwellen-Moment kommt ("ich weiß diese Flagge wirklich nicht") und keine Lernhilfe folgt. Du klickst falsch, du gehst weiter, du hast nichts gelernt. |
| **higher-or-lower** | Runde 8-10. Stat-Müdigkeit. Du hast acht Mal "ist Brasilien-Bevölkerung höher als..." beantwortet und realisierst, dass das Spiel kein neues Muster bietet. Die Streak-Mechanik versucht Spannung zu erzeugen, aber **die Stats wiederholen sich** (`GOOD_CATEGORIES` hat nur 10 Einträge). |
| **capital-match** | Runde 2. Wenn die erste Hauptstadt kommt, die du nicht weißt, und du auf 4 raten musst. Es gibt keinen Knowledge-Build-Up, kein Eliminierungs-Gameplay, keine Hilfe. Nur "weißt du es / weißt du es nicht". Dead-Ende-Quiz. |
| **population-sort** | Drag-Friction. Die mechanische Belastung auf Touch wird in Sekunde 30 nervig. Plus: ohne Anker ist die mittlere Position (Rang 3 von 5) ein Glücksspiel. |
| **country-streak** | Der Moment, wo dein Streak bei 7 stirbt. Es gibt keinen Trost, kein "fast", kein Lernmoment. Game Over, zurück auf null. Das ist Stress ohne Auflösung. |
| **border-buddies** | Wenn der letzte Nachbar nicht einfällt. Du hast acht von neun, ein letzter fehlt, und das Spiel zwingt dich zur Aufgabe oder zur frustrierten Pause. Kein "Hint nach 30 Sekunden", kein "Buchstabe-1-Hinweis". |
| **continent-sprint** | Minute 4 bei Afrika. Du hast 38 von 54 Ländern und stehst vor 16 Lücken, an die du dich nicht erinnerst. Endgame ist Trial-and-Error gegen den Timer. Ermüdend. |
| **stat-guesser** | Runde 1, immer. Du weißt nicht, ob "die Population von Tansania" eher 10M oder 60M ist und musst aus dem Nichts schätzen. Brauchst einen **Vergleichsanker**: "Population von Tansania — Vergleich: Spanien hat 47M". |
| **speed-flags** | Sekunde 15 von 20. Wenn du gemerkt hast, dass dein Speed-Limit nicht Wissen ist, sondern Tippgeschwindigkeit, schaltet das Hirn ab. |
| **odd-one-out** | Wenn der "Trait" nicht intuitiv ist. Wenn drei der vier "haben Englisch als Amtssprache" und das vierte nicht, ist das schön. Wenn drei "haben mehr als 50M Einwohner" — das ist eine **stille Stat-Frage**, kein Aha. |
| **supremacy** | Online-Wartezeit. Auf Multiplayer warten, jemand connectet, jemand verlässt — das Spiel ist abhängig von der Pipeline, nicht von der Spielfreude. |
| **borderline** | Wenn der Pfad zu lang ist. Russland → Mongolei → China → Vietnam → Laos → Thailand: nach 5 Hops verliert das Spiel das "Mini-Schach"-Gefühl und wird zur Müdigkeits-Übung. |
| **blitz** | Tippfehler. Du weißt "Madagaskar", tippst "Magagaskar", verlierst die Runde. Frust ist nicht im Spielen, sondern in der Tastatur. |
| **countryle** | Versuch 6, wenn du knapp daneben bist. "I had Mexico, the answer was Colombia" — wenn beide Continent-Match haben und alle 6 Stats fast gleich, fühlt sich der Verlust an wie Pech, nicht wie Fehler. **Das musst du in die UI-Sprache packen**: "Du warst 9% daneben". |

**Querschnitt:** Drei dominante Frust-Klassen:
1. **Information-Wüste** (capital-match, stat-guesser): kein Lernen, nur ratend
2. **Endgame-Brei** (country-draft mid, continent-sprint end): zu viele neutrale Picks
3. **Tippfehler-Strafe** (blitz, border-buddies): Spielen ≠ Tippen, aber Spiel zwingt Tippen

---

## Die geheime Schicht

Wordle, Connections, Pinpoint haben **eine Schicht, die Countrivo völlig fehlt**: die *Selbstbild-Implikation*.

Wenn du Wordle in 3 schaffst, fühlst du dich klug. Wenn du in 6, fühlst du dich erleichtert. Wenn du den falschen Anfangs-Buchstaben rätst, weißt du, dass *du* das warst, nicht der Zufall. Das Spiel macht dich verantwortlich für deine Performance. Und am Ende teilt sich dieses Bild als Emoji-Gitter — du zeigst der Welt, *wie* du gedacht hast.

Countrivo gibt dir ein Resultat ("8/10 richtig") und nichts darüber, *wie* dein Denken war. Das ist **eine Schicht zu wenig**.

**Was die geheime Schicht braucht:**

1. **Schwere Tage / leichte Tage als Identität.** Wenn ein Daily "hart" ist, müssen ALLE das wissen. Nicht versteckt. Pinpoint hat es: "Today was a 4.2/5 difficulty for solvers worldwide." Wenn du an einem 4.2-Tag in 3 schaffst, fühlst du dich elite. Wenn du an einem 1.8-Tag in 5 schaffst, fühlst du dich nichts.

2. **Persönliche Hand-Schrift.** Connections lässt dich kategorisieren in einer eigenen Reihenfolge, die *deine* Denkweise zeigt. Manche fangen mit der schwersten an, manche mit der einfachsten. Das Share-Gitter zeigt das. Countrivo hat heute kein "your-way-of-thinking" Artefakt.

3. **Lernkurve mit Vergangenheit.** Wordle gibt dir keine "Statistik der letzten 30 Tage" zentral, aber jeder kennt seinen Streak und seine Distribution. Countrivo's profiles haben Daten — aber dem Spieler wird sein eigenes Können nicht zurückgespiegelt.

4. **Geteilter Schmerz/Sieg.** "Today's puzzle stumped 73% of solvers" ist Pinpoint-magisch. Es macht dich Teil einer **Welt**, die heute dasselbe gedacht hat. Aktuell hat Countrivo Leaderboards — das ist Konkurrenz, nicht Gemeinschaft. Beides ist gut, aber **Gemeinschaft** ist die geheime Schicht.

5. **Die "knappste Niederlage" als positiver Moment.** Connections kennt das Ein-Fehler-Loss. Es schmerzt — und du bist süchtig nach der Revanche. Countryle hat das technisch, nutzt es aber nicht emotional. "You missed by Argentina" mit dem nachgelieferten "the answer was Brazil — you were 1 step away" ist ein Aufwärts-Moment im Abwärts-Moment.

**Die geheime Schicht in einem Satz: Das Spiel sollte dich kennen lernen, während du es spielst.**

---

## Vier neue Spielkonzepte

Frisch erfunden. Fun-First. Jedes durchgekostet auf Felix-Maß.

### Konzept 1: **Latitude**

**Wie es sich anfühlt:**
> Du startest mit einem Punkt auf einer leeren Karte. Keine Grenzen, keine Beschriftungen. Nur das Land als Silhouette. Du musst sagen, *wo* das Land liegt — Latitude und Longitude, mit zwei Schiebereglern. Du klickst Submit, das Spiel zoomt aus deiner Schätzung heraus, eine Linie zieht zur echten Position, und du siehst eine Zahl in Kilometern auftauchen: **2.847 km off**. Du beißt dich in die Lippe. Du tippst Practice. Du machst es nochmal.

**Felix-Test:** NEIN, würde er nicht sagen. Geoguessr-DNA, aber simpler, snackbar, ohne Streetview-Last. Pinpoint-mäßig grafisch belohnend.

**Frust-Punkt:** Wenn die Distanz-Strafe linear ist, fühlen sich kleine Inseln (Tuvalu, Fidschi) unfair an — du verlierst tausende Kilometer, weil das Land mikroskopisch ist. Lösung: **score per latitude/longitude bands**, nicht reine km-Distanz. Oder: Tagespuzzle wählt nur größere Länder.

**Daily-Tagesdauer:** 60-90 Sekunden für 5 Runden. Snackable.

---

### Konzept 2: **Heatcheck**

**Wie es sich anfühlt:**
> Heute kommt ein Stat: "GDP per capita." Es erscheinen vier Länder — Argentina, Spain, Italy, Vietnam. Aber du siehst noch nichts. Über jedem Land ist ein einzelnes ❓. Du tippst auf eins — Spain. Die Karte flippt: **34.000 $**. Du musst jetzt die anderen drei in absteigender Reihenfolge tippen, ohne sie zu sehen. Du tippst Italy, flipt: **38.000 $**. Du dachtest niedriger. Du musst recalibrieren in Echtzeit. Italy war zwischen Spain und dem Top. Argentina oder Vietnam zuerst? Du atmest, klickst Argentina.

**Felix-Test:** NEIN. Das ist *kein* Sortier-Spiel — es ist ein Sortier-Spiel mit Echtzeit-Belohnung. Connections hat das **Ein-Flip-pro-Reihe**-Gefühl. Hier wird jeder Pick zur Reveal-Show.

**Frust-Punkt:** Wenn du nach Pick 1 sofort einen Wert weißt, der weit von deiner Erwartung weg ist (Argentina ist viel niedriger als gedacht), kannst du **drei richtige Picks in Folge** "verloren" haben, ohne neu rechnen zu können. Mechanik braucht: nach falschem Pick zeigt das Spiel den Wert UND ein nachträgliches Hint ("You expected this to be ranked 2, it was 4").

**Daily-Tagesdauer:** 2-3 Minuten. Eine Stat-Reihe pro Tag, 4 Picks. Reichhaltig.

---

### Konzept 3: **Echo**

**Wie es sich anfühlt:**
> Du siehst eine Schlagzeile aus einer Welt-Nachrichten-Quelle: "*Major political shift after 24 years.*" Du siehst keine Namen, nur den Stimmungs-Tenor. Darunter erscheinen vier Karten — vier Länder. Du musst raten, **welches der vier** diese Schlagzeile am ehesten betrifft. Klick. Die richtige Karte leuchtet auf, eine zweite Schlagzeile erscheint: "*Coast nearly entirely sandy.*" Vier neue Optionen. Es geht weiter. 5 Schlagzeilen, 5 Picks. Du fängst an, die Welt anders zu lesen.

**Felix-Test:** NEIN. Das ist nicht "wir hatten den schon" — das ist Pinpoint-DNA: subtile Hinweise, langsames Erkennen. Allerdings: Felix wird hier zum **Komplizen**, nicht zum Schüler. Erwachsene werden das lieben.

**Frust-Punkt:** Schlagzeilen-Generation ist die teure Frage. Vor-generierte Pool (handcurated mit AI-Hilfe + manual review) braucht Pflege. Aber: für 1 Daily/Tag kein Skalierungs-Problem. Frust-Punkt im Gameplay: wenn die Schlagzeile zu vage ist ("a coastal country"), wirkt sie zufällig. Schlagzeilen müssen **falsifizierbar** sein — Felix muss am Ende sagen "ja, das ergibt jetzt Sinn".

**Daily-Tagesdauer:** 3-4 Minuten. Lese-Geschwindigkeit-abhängig. 5 Hinweise.

---

### Konzept 4: **Cluster**

**Wie es sich anfühlt:**
> 16 Länderflaggen auf einem 4×4-Gitter, in Grau-Tönen. Du musst sie in 4 Gruppen zu je 4 sortieren — Connections-Style — aber die Gruppen sind nicht offensichtlich. Es könnte sein: "Länder mit Königshaus", "Inselstaaten", "ehemalige Sowjet-Republiken", "Sahel-Region". Du klickst vier Flaggen, du klickst Submit. Wenn drei richtig sind und eins falsch, leuchtet das falsche auf. Du hast 4 Versuche. Du fängst an zu denken, warum Norwegen und Marokko zusammen passen könnten (beide Königshäuser). Hach.

**Felix-Test:** NEIN. Das ist direkt Connections-DNA — und Connections ist das aktuell beste Tages-Puzzle der Welt. Geographie ist eine Connections-würdige Domäne, weil Länder echte taxonomische Verbindungen haben, die nicht Wortspiele sind. Mira's Retention wird sich darüber freuen.

**Frust-Punkt:** Die Schwierigkeit der "Trick"-Gruppe — bei Connections die lila Gruppe. Ein Land kann zu mehreren Kategorien passen (Mexico ist nordamerikanisch UND ehemalige Kolonie UND spanisch-sprechend). Wenn der Spieler eine "richtige" Logik findet, die das Spiel nicht erwartet hat, fühlt es sich unfair an. **Lösung:** die "lila" Gruppe muss obvious-unobvious sein — "Länder, deren Flagge eine Sonne enthält" zum Beispiel. Visuell überprüfbar, aber nicht-statistisch.

**Daily-Tagesdauer:** 4-6 Minuten. Reicher Daily. Share-Gitter ähnelt Connections. Hohes virales Potenzial.

---

## Was Countrivo NICHT spielen sollte

Drei Spiel-Typen, die strukturell nicht passen — selbst wenn die Daten da wären:

### 1. Pures Knowledge-Quiz (4 Optionen, Frage)
Bezieht sich auf flag-quiz, capital-match, country-streak, speed-flags. **Sporcle macht das, ist Marktführer, hat 10× das Daten-Volumen.** Countrivo kann kein besseres "Welche Hauptstadt hat Tschad" bauen — die Tschad-Antwort ist N'Djamena, egal wer das Spiel macht. Countrivo's Vorteil ist **strukturiertes Denken**, nicht Wissens-Abruf.

Konsequenz für die Roadmap: **Capital-Match streichen oder transformieren**. Wenn behalten, dann mit Twist — "alle Hauptstädte ihres Landes raten, aber in Reihenfolge der Population" oder so. Pures MCQ stirbt.

### 2. Realtime-Multiplayer
SYNTHESIS sagt es bereits — Supremacy/Borderline/Blitz verlieren Versus. **Richtig.** Realtime-Multiplayer für ein Daily-Geography-Spiel ist Stress-Tech-Debt. Niemand wacht morgens auf, geht zu Countrivo, hofft auf einen Gegner. Sie wachen auf, machen das Daily allein, teilen das Ergebnis. Friend-Challenges via Async-Tabelle sind genau die richtige Sozial-Schicht. Die Versus-Modi sind die "höfliche Beteiligung" — Spieler benutzen sie höflich, aber das Spiel funktioniert nicht.

### 3. Pure-Speed-Games ohne Endgame
Speed-Flags, Continent-Sprint, Blitz. **Das sind Speedrun-Genre-Spiele.** Speedrun-Spiele leben von Optimierung über Wochen — du machst dasselbe Spiel 50× und wirst 4 Sekunden schneller. Daily-Games sind das Gegenteil: jeden Tag neuer Puzzle, einmaliger Versuch. Speedrun und Daily kollidieren mechanisch.

Konsequenz: **Speed-Flags und Continent-Sprint nicht in Daily-Rotation aufnehmen** (sind sie auch nicht — gut so). Aber: nicht als "echtes Spiel" behandeln. Sie sind **Practice-Tools**, Aufwärm-Material. Eigene Sektion "Drills" wäre ehrlicher als "Games".

### 4. Trivia mit zufälligen Fakten
"Welches Land hat die meisten Eulen-Arten?" Cute. Aber kein Spiel — es ist Trivial Pursuit. Countrivo's Hebel ist **das Vergleichen von Ländern entlang quantifizierbarer Achsen**. Sobald die Achse "anekdotisches Wissen" ist, verlierst du den Daily-Charakter und gehst in Sporcle-Territorium.

---

## Schluss

Felix, wenn ich ihn heute durch Countrivo geführt hätte — ich glaube, er hätte bei Country-Draft drei Minuten lang nichts gesagt und dann gefragt "darf ich nochmal". Bei Countryle hätte er die ersten zwei Versuche misstrauisch geschaut und beim dritten Versuch *gelacht*, als der Pfeil nach oben zeigte und er begriff, was los war. Bei Border-Buddies hätte er Brasilien gewählt und versucht, sich an Argentina zu erinnern, und sein Vater hätte ihm helfen müssen, und beide hätten gelacht.

Bei Flag-Quiz hätte er nach Runde 3 leise gesagt "den hatten wir schon".

Das ist mein Resultat: Countrivo hat zwei Spiele, die Felix nicht im Stich lassen würden (Country-Draft, Countryle), drei weitere mit Funke-Potenzial (Border-Buddies, Borderline, Odd-One-Out), und einen Berg von höflichem Inhalt, der niemandem schadet, aber auch niemanden bindet.

Die Roadmap-Implikation ist nicht "mehr Spiele bauen". Es ist: **die guten doppelt so gut machen, die mittelmäßigen rigoros überarbeiten oder begraben, und die vier neuen Konzepte oben mit derselben Sorgfalt designen wie Countryle**.

Felix hat mit sechs schon gewusst, was ich erst mit 25 verstanden habe: ein Spiel, das nichts Neues zeigt, ist Zeitverschwendung. Egal wie poliert die Optik ist. Egal wie viele Optionen die UI hat. Wenn ein Kind in 8 Sekunden weiß, dass das Spiel echt ist — dann ist es echt. Wenn nicht, dann nicht. Und Erwachsene sind dieselben Kinder, sie sind nur höflicher.

Countrivo ist auf dem Weg, echt zu werden. Es ist noch nicht ganz da. Aber es kann.

— Lou
