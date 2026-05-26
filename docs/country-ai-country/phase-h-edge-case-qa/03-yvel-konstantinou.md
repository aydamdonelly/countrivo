# 03 · Yvel Konstantinou · Säulen-Defekt-Suche

> Athen, November 2023. Ich habe Nein gesagt. Das war das letzte Mal, dass mir jemand zugehört hat, ohne mich vorher zu fragen, wer ich bin. Heute, dreiundzwanzig Monate später, sitze ich in einer Wohnung, die kleiner ist als das Konferenzzimmer, in dem ich 47 Bugs auf den Tisch gelegt habe, und ich sage wieder Nein. Diesmal zu Countrivo.

## Eröffnungs-Notiz

Ich lese seit drei Stunden. Vier Kaffees, ein Fenster, das ich nicht aufmache, weil der Wind aus Süden kommt und die Möwen schreien. Was ich sehe, ist nicht ein schlechtes Projekt. Es ist ein Projekt, das gerade dabei ist, sich auf vier oder fünf Säulen zu setzen, die niemand explizit gegossen hat. Lina Hadid hat zwei davon getroffen: `daily_puzzles` PUBLIC Insert und die `not yet validated` Kommentarzeile in `game-runs.ts:474`. Sie hat sie als Bugs benannt. Ich benenne sie heute als Säulen — denn was sie gefunden hat, sind nicht Funktionsfehler, sondern *strukturelle Annahmen*, die zusammenstürzen, wenn jemand sie testet. Mein Job ist es nicht, Funktionen zu prüfen. Mein Job ist zu fragen: *was geht der Code als gegeben an, das nicht gegeben ist?* Ich finde acht solche Säulen. Drei davon sind existenz-bedrohend für den Daily-Anker. Eine davon wird das Atlas-Album zerstören, bevor es überhaupt gebaut ist, wenn niemand vorher daran denkt. Bei Eleftheria — meiner Schwester, die im April 2024 sagte *"Yvel, du hattest recht, stop dich davor zu drücken"* — hat das mit dem Recht-Haben nichts zu tun. Es geht darum, was bricht, wenn man nicht hinguckt.

## Säulen-Defekt-Liste

### Säule #1 — Daily-Puzzle-Seed-Authentizität [Existenz-bedrohend]

- **Unausgesprochene Annahme:** "Wenn `dateSeed(dateKey + gameSlug)` heute den Wert X liefert, dann sehen alle Spieler heute dasselbe Puzzle X. Der Seed in `daily_puzzles` ist die Wahrheit."
- **Wo die Annahme lebt:** `src/app/actions/game-runs.ts:97-106` (upsert ohne Authentizitäts-Garantie) + DB-RLS auf `daily_puzzles` (Insert PUBLIC, siehe Lina H1, `03-lina-hadid-auth.md:79`).
- **Szenario, in dem sie stirbt:** Ein anonymer Angreifer mit der `NEXT_PUBLIC_SUPABASE_ANON_KEY` (die auf jeder geladenen Seite im Klartext steht) öffnet einen REST-Client, schickt um 00:00:01 Berlin-Zeit `INSERT INTO daily_puzzles (game_slug, daily_date, seed) VALUES ('countryle', '2026-05-26', 999999)` an die Supabase-Tabelle. Der UPSERT in `submitGameRun` greift später auf `onConflict: "game_slug,daily_date"` — der falsche Seed bleibt, weil er bereits da ist und der Update-Pfad den Seed nicht überschreibt. Jeder First-Player des Tages wird mit dem manipulierten Seed verglichen.
- **Konsequenz:** Daily-Leaderboard für diesen Tag ist Schrott. Spieler, die das *richtige* clientseitig generierte Puzzle gesehen haben (denn der Seed kommt clientseitig aus `dateSeed`, nicht aus der DB), submitten Scores, die mit einem Phantom-Puzzle in der DB verbunden sind. Schlimmer noch: wenn der Angreifer das alle 14 Tage macht, ist die Streak-Berechnung in `updateStreak` (`game-runs.ts:338-379`) auf einer korrumpierten Historie aufgebaut. Drago's vertrauliches Daily-Versprechen — *gleiches Puzzle für alle* — ist eine Lüge.
- **Strukturelle Lösung:** Der Seed darf nicht in der DB stehen — oder er darf nur einmal von einer SECURITY DEFINER RPC `ensure_daily_puzzle(game_slug, date)` geschrieben werden, die selbst `dateSeed()` ausführt. Variante A: Tabelle behält nur `(game_slug, daily_date)` als Composite Key; der Seed wird *jedes Mal* serverseitig aus dem dateKey neu abgeleitet. Variante B: SECURITY DEFINER RPC mit Auth-Check, die den Seed berechnet und einfügt. RLS Insert PUBLIC wird gestrichen. Die *strukturelle* Lösung ist: der Seed ist eine reine Funktion vom Datum, nicht ein DB-Wert. Wer ihn in die DB schreibt, hat schon einen Vertrauens-Bruch geöffnet.
- **Auszahlung:** $3000

### Säule #2 — Submit-Authentizität für blitz/borderline/supremacy [Existenz-bedrohend]

- **Unausgesprochene Annahme:** "Wenn `submitGameRun` einen Score akzeptiert, hat der Client tatsächlich gespielt. Die Validierung ist *eventuell* nicht komplett, aber niemand wird das ausnutzen."
- **Wo die Annahme lebt:** `src/app/actions/game-runs.ts:474-476` — der `default`-Zweig der `validateGameResult`-Switch-Statement. Drei Spielslugs (blitz, borderline, supremacy) fallen in den default-Zweig. Kein Score-Mismatch-Check, kein Time-Floor-Check über die `too_fast`-Heuristik hinaus.
- **Szenario, in dem sie stirbt:** Angreifer öffnet DevTools, ruft `submitGameRun({ gameSlug: "blitz", mode: "daily", scoreRaw: 10, scoreMax: 10, scoreSortValue: 10, resultJson: { whatever: "lol" }, startedAt: new Date(Date.now() - 60000).toISOString() })` auf. `too_fast` wird umgangen (60 Sekunden im Vergangenen). `validateGameResult` returnt `null` (default-Zweig). Score wird inseriert. Daily-Leaderboard für blitz hat einen Cheater auf #1.
- **Konsequenz:** Die Aussage "Countrivo hat ein Leaderboard" stirbt am ersten Tag, an dem jemand das macht. Schlimmer: die `compute_daily_rankings`-RPC und `user_game_stats` werden mit Müll genährt. Wenn das Urteil sagt "Multiplayer raus", aber diese drei Spiele bleiben in den Drills mit `availableModes: ["daily","practice"]`, dann ist die Validierungs-Lücke ein offenes Tor. Selbst wenn sie nur in Drills laufen — sie schreiben in `user_game_stats`, die Tab "Best Score" zeigt. Cheater-Best-Score = Garantie, dass legitime Spieler den Ehrgeiz verlieren.
- **Strukturelle Lösung:** Drei Optionen, sortiert nach Architektur-Härte:
  1. **Hart:** Die drei Spiele submitten *nicht* serverseitig. Kein `submitGameRun`-Call. Scores nur lokal in `localStorage`. Sie sind Drill-Spiele, nicht Leaderboard-Spiele.
  2. **Mittel:** Per-Spiel-Validierung pro Slug schreiben (siehe Abschnitt 4 unten). Diese verlangt eine erschöpfende `resultJson`-Schema-Definition.
  3. **Weich:** `default`-Zweig wird zu `return "validation_not_implemented"` — submit schlägt fehl. Das ist ein *Safe-by-Default*. Wer die Validierung nicht geschrieben hat, schreibt auch keinen Score.
  
  Die *strukturelle* Lösung ist Option 3 als Sofortmaßnahme + Option 1 als Endziel. Niemals: "default ist okay weil wir's später machen". Das ist der genaue Satz, den das Aegean-Odyssey-Management mir November 2023 gesagt hat.
- **Auszahlung:** $3000

### Säule #3 — Daily-Lockout-Eindeutigkeit [Existenz-bedrohend]

- **Unausgesprochene Annahme:** "Ein User kann pro (gameSlug, dailyDate) genau einmal submitten. Die Eindeutigkeit ist durch eine UNIQUE-Constraint in der DB garantiert."
- **Wo die Annahme lebt:** Implizit in `game-runs.ts:131` — der `error.code === "23505"`-Branch wartet darauf, dass eine UNIQUE-Constraint im `game_runs`-Schema die Doublette abfängt. Aber: ich sehe nicht im Code, dass diese UNIQUE-Constraint dokumentiert ist. Sie wird *erwartet*. Lina hat in `03-lina-hadid-auth.md` die `game_runs`-Spalten gelistet (Insert: auth.uid = user_id), nirgendwo aber explizit (user_id, game_slug, daily_date, mode='daily') UNIQUE.
- **Szenario, in dem sie stirbt:** Falls die UNIQUE-Constraint nicht existiert oder als `(user_id, daily_puzzle_id)` und nicht `(user_id, game_slug, daily_date, mode)` definiert ist: Ein User submittet um 23:59:59 Berlin-Zeit, der UPSERT auf `daily_puzzles` schlägt fehl (Race), `dailyPuzzleId = null`, dann nochmal Submit um 00:00:01 nächster Tag mit dateKey-Korrektur — und der zweite Submit erbt einen anderen Puzzle-ID. Beide Inserts gelingen. User hat zwei Daily-Runs für *denselben Tag* in der DB.
- **Konsequenz:** Daily-Leaderboard zählt den User doppelt. Streak wird doppelt erhöht. Atlas-Album würde den Sticker zweimal stempeln (wenn überhaupt persistiert). Der User-Game-Stats-Trigger berechnet `best_sort_value` mit einem gemittelten Mist. Schlimmer: wenn die Constraint nur auf `daily_puzzle_id` liegt und `daily_puzzle_id = null` wird (Upsert-Failure), dann kann der User *unbegrenzt oft* submitten für jeden Tag, an dem der Puzzle-Upsert versagt.
- **Strukturelle Lösung:** Explizite UNIQUE-Constraint in der Migration: `CREATE UNIQUE INDEX game_runs_daily_unique ON game_runs (user_id, game_slug, daily_date) WHERE mode = 'daily';` Partial Index. Das macht die Annahme zur DB-Wahrheit. Zusätzlich: `daily_puzzle_id` darf NICHT nullable sein für mode='daily' — entweder Foreign Key NOT NULL oder die Spalte verschwindet ganz und der Seed wird aus dem Datum abgeleitet (siehe Säule #1).
- **Auszahlung:** $1000

### Säule #4 — Client-Side-Lockout als einzige Verteidigung [Schwer]

- **Unausgesprochene Annahme:** "`DailyLockoutGuard` zeigt das Already-Played-UI, das verhindert ein Re-Play." (Siehe `src/components/game/daily-lockout-guard.tsx:89-95`.)
- **Wo die Annahme lebt:** `daily-lockout-guard.tsx:89` — `getDailyLockout(gameSlug, getTodayDateKey())` aus localStorage. Ist `entry == null`, wird das Spiel gerendert. Es gibt keinen Server-Render-Zeit-Check für Daily-Lockout. Erst beim Submit greift `error.code === "23505"` (Säule #3) als letzte Verteidigung.
- **Szenario, in dem sie stirbt:** User löscht localStorage (DevTools → Application → Storage → Clear). Lädt `/games/countryle/play` neu. UI rendert das Spiel. User spielt eine zweite Runde mit *anderen* Guesses, weil der Daily-Seed deterministisch das gleiche Target zeigt, aber der User jetzt das Target schon kennt. User submittet. Der `23505`-Branch fängt es ab — wenn die UNIQUE-Constraint korrekt ist (siehe #3). Aber: der User hat trotzdem die Antwort *gesehen*. Die Daily-Ritual-DNA ist beschädigt. Und wenn der User Friend-Challenge-Status manipuliert (siehe Säule #5), kann die zweite Runde noch schaden anrichten.
- **Konsequenz:** Auf Solo-Ebene Kosmetik. Auf Friend-Challenge-Ebene: ein User mit gelöschtem localStorage spielt mehrfach, sieht die Antwort, schreibt dann seinem Freund "Probier mal!" mit der Antwort im Hinterkopf. Die Daily-Ritual-DNA, die Marius Olbricht im Urteil verteidigt hat, basiert auf *gemeinsamer Unwissenheit zum Zeitpunkt T*. Diese Annahme bricht.
- **Strukturelle Lösung:** Server-Side-Check in der `page.tsx` für `/games/{slug}/play`. Wenn `mode=daily` und User authentifiziert und `checkDailyStatus(slug, today).played === true`, dann redirect oder render das Already-Played-UI direkt im Server-Component. Client-Side-Lockout bleibt für Anon-User als Komfort. Aber: für authenticated user ist Server-Side-Check die einzig ehrliche Wahrheit. Der Status quo verlässt sich auf eine Kombination aus localStorage + UNIQUE-Constraint, und beides ist umgehbar oder unbestätigt.
- **Auszahlung:** $250

### Säule #5 — Friend-Challenge Async-Vertrag [Schwer]

- **Unausgesprochene Annahme:** "Wenn A einen Freund B herausfordert, hat A *zuerst* gespielt und seinen Score eingereicht. B sieht den Score von A erst, *nachdem* B selbst gespielt hat — oder zumindest erst, *nachdem* B die Challenge angenommen hat."
- **Wo die Annahme lebt:** `src/app/actions/challenges.ts:53-77` — `getPendingChallenges` returnt `challengerScore` (`row.challenger_run?.score_display`). Das wird an die UI gegeben, *bevor* der Challenged-User selbst gespielt hat.
- **Szenario, in dem sie stirbt:** User A spielt Countryle, bekommt 4/6 Guesses. A erstellt Challenge an B mit `challengerRunId`. B öffnet sein Inbox, sieht `challengerProfile.username` und `challengerScore: "4/6"`. B weiß: er muss in 3 oder weniger Guesses gewinnen. B spielt Countryle. B nutzt sein Wissen über den Score, um Strategie anzupassen — aber das ist nicht der Bruch. Der Bruch: wenn das Daily-Puzzle *deterministisch* ist (Säule #1), dann hat A das Target schon entdeckt. A schreibt B per Discord: "Probier es mit Madagaskar als erster Guess." B nutzt die Hint. Friend-Challenge ist nicht mehr ein Vergleich des Wissens — sie ist ein Vergleich der Hinweis-Kanäle.
- **Konsequenz:** Die *strukturelle* DNA eines Friend-Challenge — *gemeinsam blind dasselbe Puzzle lösen* — ist beschädigt, sobald der Challenger einen Hint geben kann. Margaret im Urteil hat Friend-Challenges nicht als Substanz-Layer verteidigt, aber Yvel hat sie in der Synthese als "überlegenes Sozial-Konstrukt für ein Daily-Geography-Spiel" bezeichnet. Sie sind überlegen *nur unter der Annahme der Blindheit*. Die Async-Logik garantiert die Blindheit *nicht*.
- **Strukturelle Lösung:** Zwei Schichten. Schicht 1: `challengerScore` wird *nicht* an B geliefert, bevor B selbst gespielt hat. `getPendingChallenges` returnt nur `challengerProfile.username` und `gameSlug`. Score erscheint erst nach `completeChallenge`. Schicht 2: Der Daily-Seed wird pro Friend-Challenge *abgewandelt* — z.B. `dateSeed(dateKey + gameSlug + challengeId)`. Damit ist das Puzzle für diese Challenge ein anderes als das normale Daily. Hint via Discord ist nutzlos, weil das Target anders ist. Schicht 2 ist die ehrlichere Lösung, kostet aber Atlas-Album-Konsistenz (Sticker für ein Custom-Seed-Land — siehe Säule #6).
- **Auszahlung:** $1000

### Säule #6 — Atlas-Album Persistenz-Reihenfolge [Schwer — präventiv]

- **Unausgesprochene Annahme:** "Wenn der User ein Spiel gewinnt, wird der Sticker im Album persistiert. Der Game-Run und der Sticker-Insert sind beide erfolgreich oder beide fehlschlagend."
- **Wo die Annahme lebt:** Nirgendwo. Atlas-Album existiert *noch nicht*. Das Urteil hat ihn als Meta-Layer für Phase 1 mandatiert. Das macht diesen Defekt zur *präventiven Säule* — die Annahme darf gar nicht erst in den Code, weil sie strukturell unhaltbar ist, ohne dass der Architekt sie explizit adressiert.
- **Szenario, in dem sie stirbt:** Falls Atlas-Album als zweiter Insert nach dem `game_runs`-Insert implementiert wird (`submitGameRun` returns success → client triggert `stampSticker(country)`): User submittet, `game_runs.insert` erfolgreich, dann bricht das Netzwerk. Client zeigt success-toast (Stempel-Animation), aber die `atlas_stickers`-Tabelle hat den Insert nie bekommen. User sieht den Sticker im UI (optimistic update), refresht — Sticker weg. Die *strukturelle Annahme* — "ein Win = ein Sticker" — kollabiert auf der ersten flackernden Internet-Verbindung.
- **Konsequenz:** Der Spieler verliert Vertrauen in die Sammel-Schicht. Olav hat im Urteil gesagt: "Ohne Atlas Album bleibt Countrivo eine Spielmenge. Mit Atlas Album wird Countrivo ein Pfad." Ein Pfad, der bei jedem zweiten Sticker zurückspringt, ist kein Pfad — er ist ein Hohn. Die Verb-Diagnose *Sammeln* erfordert *Sicherheit der Sammlung*. Eine kaputte Sticker-Persistierung bricht das Verb.
- **Strukturelle Lösung:** Atlas-Album-Sticker müssen *im selben Transaktions-Schritt* wie der Game-Run persistiert werden. Konkret: die Logik "welche Länder kamen heute vor" wird *serverseitig* aus `resultJson` abgeleitet (z.B. Countryle: `target` + alle `guesses[].iso3`; country-draft: alle picked countries). Die `submitGameRun`-Server-Action selbst inseriert in `atlas_stickers` als Teil derselben Postgres-Transaktion. Wenn der Insert fehlschlägt, schlägt der gesamte Submit fehl — User bekommt eine Fehlermeldung statt eines halben Erfolgs. Variante: Postgres-Trigger auf `game_runs` AFTER INSERT, der `atlas_stickers` befüllt. Das ist *atomar* by Schema. Niemals client-driven.
- **Auszahlung:** $1000

### Säule #7 — Timezone-Sicherheit am Tagesrand [Mittel]

- **Unausgesprochene Annahme:** "`getTodayDateKey()` ist die Wahrheit. Server und Client haben dieselbe Berlin-Zeit-Berechnung. Es gibt keinen Drift."
- **Wo die Annahme lebt:** `src/app/actions/game-runs.ts:47-52` — Server überschreibt `input.dateKey` mit `getTodayDateKey()`, wenn `mode='daily'`. Aber: der Client hat in `startedAt` ggf. einen Zeitstempel aus dem Vortag, und die `daily_puzzle_id` wird aus dem korrigierten `dateKey` abgeleitet. Folge: ein Spieler, der um 23:59 Berlin-Zeit das Spiel startet und um 00:01 nächsten Tag submittet, hat im Client eine *andere* `daily_puzzle_id` als der Server.
- **Szenario, in dem sie stirbt:** User startet `countryle` um 23:58 Berlin-Zeit. Das Spiel lädt mit dem heutigen Seed (Tag X). User spielt 2 Minuten 5 Sekunden. Submit um 00:00:03 Berlin-Zeit. Server `getTodayDateKey()` returnt Tag X+1. `dailyPuzzleId` wird für Tag X+1 mit dem Seed von Tag X+1 ge-upserted. Der `resultJson.target` (z.B. "FRA" für Tag X) passt aber nicht zum Seed von Tag X+1 (z.B. "JPN"). Validation `validateGameResult` für countryle (`game-runs.ts:463-473`) prüft nicht, ob das submittete Target dem Server-Seed entspricht.
- **Konsequenz:** User hat in Tag X+1's Leaderboard einen Score basierend auf Tag X's Puzzle. Wenn er Glück hatte (Tag X war einfach), platziert er sich an die Spitze von Tag X+1, ohne Tag X+1's Puzzle je gesehen zu haben. Die *Daily-Ritual-DNA* bricht am Tagesrand.
- **Strukturelle Lösung:** `validateGameResult` für countryle (und andere seeded games) muss serverseitig den Daily-Seed berechnen und das `resultJson.target` gegen den deterministisch abgeleiteten Target prüfen. Pseudo-Code: `const expectedTarget = countryleEngine.generateTarget(mulberry32(dateSeed(serverDateKey + 'countryle'))); if (resultJson.target !== expectedTarget.iso3) return "puzzle_mismatch";` Das schließt die Tagesrand-Lücke, weil ein User, der ein Tag-X-Puzzle in Tag-X+1 submittet, mit `puzzle_mismatch` rausfliegt.
- **Auszahlung:** $250

### Säule #8 — Streak-Halbwertszeit ohne Race-Schutz [Mittel]

- **Unausgesprochene Annahme:** "`updateStreak` (`game-runs.ts:338`) wird einmal pro Tag pro User aufgerufen. Wenn der User mehrere Spiele am selben Tag spielt, greift der `profile.last_daily_date === dateKey`-Branch und gibt es keine Streak-Erhöhung."
- **Wo die Annahme lebt:** `game-runs.ts:356-358` — `if (profile.last_daily_date === dateKey) return;`. Aber: das ist eine *Read-then-Write*-Sequenz ohne Transactional-Lock.
- **Szenario, in dem sie stirbt:** User spielt simultan in zwei Tabs (countryle in Tab 1, country-draft in Tab 2). Beide submittenden gleichzeitig (innerhalb 50ms). Beide Server-Actions rufen `updateStreak`. Beide lesen `profile.last_daily_date` als gestern (oder null). Beide schreiben `last_daily_date = today`, beide schreiben `streak_current = profile.streak_current + 1`. Statt einer Erhöhung um 1 gibt es eine Erhöhung um 2 — oder die zweite Schreibung überschreibt die erste, und es bleibt bei +1. Race-abhängig. Schlimmer: bei einer Differenz von einem Tag zwischen `last_daily_date` und dateKey wird `newStreak = profile.streak_current + 1` beidesmal, und der `streak_longest` kann inkorrekt gesetzt sein.
- **Konsequenz:** Streak-Inflation. Spieler entdecken den Trick (zwei Tabs öffnen, simultan submit) — Streak wächst doppelt so schnell. Die *gestufte Demut* (Bedingung #5 des Urteils, Pinpoint-Modell) bricht: wer cheatet, wird belohnt. Wer einmal pro Tag ein Spiel macht, wird hinter Multi-Tab-Spielern eingeordnet.
- **Strukturelle Lösung:** `updateStreak` wird eine Postgres-RPC `update_streak_atomic(user_id, date_key)` mit Row-Level-Lock (`SELECT ... FOR UPDATE`) oder einer einzigen `INSERT ... ON CONFLICT DO UPDATE`-Statement, die idempotent ist. Alternativ: Trigger auf `game_runs` AFTER INSERT, der einmal pro `(user_id, daily_date)` den Streak aktualisiert. Variante mit M3-Halbwertszeit (verpasste Tage zählen 50%, 25%, 12.5%): die Berechnung passiert nicht inkrementell, sondern als Aggregations-Query über `game_runs` der letzten 30 Tage. Das eliminiert die Race-Bedingung, weil es kein Read-then-Write mehr gibt.
- **Auszahlung:** $250

### Säule #9 — Practice-Mode-Daten-Vergiftung [Mittel]

- **Unausgesprochene Annahme:** "Practice-Mode-Runs schreiben in `game_runs` mit `mode='practice'`. Sie beeinflussen Daily-Leaderboards nicht. Sie beeinflussen `user_game_stats.best_sort_value` aber *schon* — und das ist gewollt."
- **Wo die Annahme lebt:** `game-runs.ts:117` — `daily_date: input.mode === "daily" ? input.dateKey : null`. Practice-Runs haben `daily_date = null`. Aber: der `is_personal_best`-Check (`game-runs.ts:156-170`) checkt gegen `user_game_stats.best_sort_value`, die der Trigger auf *allen Runs* (daily + practice) berechnet.
- **Szenario, in dem sie stirbt:** User spielt Practice-Mode von Countryle 50 Mal. Beim 51. Mal hat er das Target durch Brute-Force-Memorisation auswendig — denn Practice-Mode hat keinen Daily-Seed, jedes Spiel hat ein zufälliges Target. Aber: nehmen wir an, der Practice-Mode benutzt auch deterministische Seeds (z.B. Math.random() ist gegen die Regel — siehe `AGENTS.md`), aber `Date.now()` als Seed-Quelle. User cheatet im Practice-Mode (DevTools: setzt `resultJson.guesses` auf `[target]` und `resultJson.guessCount = 1`). Submit. `validateGameResult` für countryle (`game-runs.ts:463-473`) prüft `expectedRaw = won ? guesses.length : 7` und `scoreRaw === expectedRaw`. Wenn `won=true, guesses.length=1, scoreRaw=1`, alle Checks passieren. `user_game_stats.best_sort_value` wird auf 6 hochgeschraubt (7-1=6, Maximum). Dieser Wert beeinflusst danach den `is_personal_best`-Check für *Daily*-Runs.
- **Konsequenz:** Der User wird im Daily-Lockout-UI fälschlich nicht als "Personal Best" markiert (weil sein Practice-Best schon Maximum ist). Schlimmer: Stats-Anzeige auf Profil-Seite zeigt Cheat-Werte. Atlas-Album würde Sticker basierend auf Practice-Runs gewähren, wenn nicht gesondert separiert. Die *Truth-Layer*-DNA bricht: Practice und Daily teilen sich einen Speicher, ohne separate Vertrauens-Zonen zu definieren.
- **Strukturelle Lösung:** `best_sort_value` und `user_game_stats` werden auf *daily-only* eingeschränkt. Practice-Runs leben in einer separaten Tabelle `practice_runs` oder werden gar nicht persistiert (lokales localStorage genügt). Atlas-Album zählt nur Daily-Wins. Die *strukturelle Trennung* von Trust-Zonen ist eine Schema-Entscheidung, kein Validation-Fix.
- **Auszahlung:** $250

### Säule #10 — Score-Sort-Value-Inversion-Konsistenz [Mittel]

- **Unausgesprochene Annahme:** "Server-Side-Override für `scoreSortValue` ist exhaustiv. Jedes registrierte Spiel ist abgedeckt."
- **Wo die Annahme lebt:** `game-runs.ts:55-85` — Switch mit case-Liste. Was nicht in der Liste steht (z.B. ein neues Spiel "cluster" aus dem Urteil), behält den client-gesendeten `input.scoreSortValue`.
- **Szenario, in dem sie stirbt:** Marius Olbricht's Urteil führt "Cluster" als neues Spiel ein. Entwickler implementiert `cluster/engine.ts`, `cluster-board.tsx`, registriert in `game-registry.json`. Vergisst, den Switch in `game-runs.ts` zu erweitern. Cluster-Submits behalten `input.scoreSortValue` aus dem Client. Angreifer setzt `scoreSortValue: 999999999` und landet auf #1 ohne je gespielt zu haben.
- **Konsequenz:** Jedes neue Spiel ist ein offenes Tor zur Leaderboard-Vergiftung, bis jemand den Switch updatet. Dies ist keine Race-Bedingung — es ist eine *Strukturelle Onboarding-Lücke*. Die Annahme "jeder, der ein Spiel hinzufügt, denkt auch an `game-runs.ts:55`" ist nicht durch das Typsystem erzwungen.
- **Strukturelle Lösung:** Drei Optionen:
  1. **Default-Reject:** Wenn der Slug nicht im Switch ist, `scoreSortValue = 0` (oder Fehler `unknown_game`). Macht Cheating unmöglich; macht aber auch legitime Submits unmöglich, bis der Switch erweitert wird. Safe-by-Default.
  2. **Registry-Driven:** `game-registry.json` enthält `scoreSort: "higher" | "lower" | "inverted"` und einen `invertMax`-Wert. `game-runs.ts` liest aus der Registry, nicht aus einem hardcoded Switch. Eine Quelle der Wahrheit.
  3. **TypeScript-Discriminated-Union:** `GameSlug` als union type, Switch mit `exhaustive` check via never. Compiler erzwingt, dass jeder neue Slug einen case bekommt. Das ist die Build-Time-Lösung.
  
  Option 2 + 3 zusammen ist Yvel's Empfehlung. Eine zentrale Registry plus Compiler-Zwang.
- **Auszahlung:** $250

### Säule #11 — Validierung-Sanity-Toleranz für stat-guesser [Niedrig]

- **Unausgesprochene Annahme:** "`stat-guesser`-Validation mit `Math.abs(expectedScore - scoreRaw) > 1` toleriert Rundungsfehler. Toleranz von ±1 ist sicher."
- **Wo die Annahme lebt:** `game-runs.ts:434-439` — `const expectedScore = Math.round(Math.max(0, 100 - resultJson.avgError)); if (Math.abs(expectedScore - scoreRaw) > 1) return "score_mismatch";`
- **Szenario, in dem sie stirbt:** Angreifer setzt `resultJson.avgError = 0.4` (legal — winzige Toleranz). `expectedScore = Math.round(99.6) = 100`. `scoreRaw = 100`. Submit greift. Aber: der Angreifer hat die Antworten selbst gesehen (DevTools) und seine `avgError` auf 0.4 gesetzt, obwohl er nie 5 Fragen sauber beantwortet hat. `resultJson.avgError` ist eine Client-Berechnung, die nicht gegen die individuellen Antworten geprüft wird.
- **Konsequenz:** Stat-Guesser ist eines der vier Urteil-Spiele (Yusuf's Stat-Hebel). Wenn die Validation nur `avgError` prüft, kann jeder ein perfektes Ergebnis fabrizieren. Tilda's "heimlicher Star" wird zur Leaderboard-Lüge.
- **Strukturelle Lösung:** `validateGameResult` für `stat-guesser` muss die *individuellen Antworten* prüfen. `resultJson.answers` enthält `{ countryIso3, statSlug, userGuess, actualValue }[]`. Server prüft `actualValue` gegen `stats.json[countryIso3][statSlug]`. Berechnet `avgError` *serverseitig* aus den Antworten. Vergleicht mit `resultJson.avgError` (± Toleranz). Wer die Antworten fälscht, fliegt mit `answer_mismatch`. Mehr Code, ja, aber das ist *Substanz-Validierung*.
- **Auszahlung:** $50

### Säule #12 — Anti-Pattern-Verstoß als strukturelle Sicherheit [Niedrig — meta]

- **Unausgesprochene Annahme:** "`AGENTS.md` sagt `Do NOT use Math.random() in game logic`. Wer es macht, kriegt eine Code-Review-Korrektur."
- **Wo die Annahme lebt:** `AGENTS.md:23` plus `country-draft/engine.ts:6-11` (Anomalie: einzige Engine, die selbst RNG erzeugt + `Date.now()` ruft — siehe Mira's Bericht in Phase A) plus `game-over-screen.tsx:232` (`Math.random()`-Shuffle).
- **Szenario, in dem sie stirbt:** `country-draft` ist das Flaggschiff (Marius Urteil, Spiel #1). Wenn die Engine `Date.now()` als Seed-Quelle nutzt, ist sie nicht-deterministisch. Daily-Modus für country-draft hat keine Eindeutigkeit: jeder Spieler sieht ein *anderes* Draft. Der Vergleich auf dem Leaderboard ist ein Vergleich verschiedener Puzzles. Mira hat das bereits in Phase A als "Major" markiert. Yvel sagt: das ist nicht Major, das ist *existenz-bedrohend für die Flaggschiff-Disziplin*. Aber sie hat es gefunden — ich gebe ihr die Auszahlung-Hoheit, behalte hier nur einen Niedrig-Eintrag.
- **Konsequenz:** Flaggschiff-Daily ist Schrott bis das gefixt ist. Strukturelle Bedeutung: Mira's Funden müssen *vor* dem Atlas-Album-Bau adressiert werden, nicht parallel. Sonst sammelt Atlas-Album Sticker auf einer kaputten Datenbasis.
- **Strukturelle Lösung:** Mira's Empfehlung folgen — Engine bekommt RNG als Parameter (Standard-Konvention der anderen 14 Engines). `game-over-screen.tsx:232` shuffle bekommt seeded shuffle. Niemals: "wir haben's später gemacht".
- **Auszahlung:** $50

## Atlas-Album — Architektur vor Bau

Das Urteil hat Atlas-Album mandatiert. Es existiert noch nicht. Bevor jemand `CREATE TABLE atlas_stickers (...)` tippt, müssen folgende strukturelle Annahmen *nicht* gemacht werden. Pflichtenheft. Aus 9 Jahren QA-Lead in Athen, aus der Erfahrung, dass jede ungeprüfte Annahme zur Save-Korruption von Aegean Odyssey führen kann.

1. **Sticker-Persistierung ist Teil derselben Transaktion wie der Game-Run-Insert.** Nicht "danach". Nicht "client triggert nach success-toast". Atomic. Postgres-Trigger auf `game_runs AFTER INSERT` wenn `won = true` ist die einzige Form, die ich freigebe. Wenn der Game-Run-Insert fehlschlägt, schlägt auch der Sticker-Insert fehl. Wenn der Sticker-Insert fehlschlägt, schlägt der Game-Run-Insert fehl. *Niemals teilweise.* Das ist nicht Eleganz — das ist Vertrag.

2. **Welche Sticker eine Runde gibt, wird *serverseitig* aus `resultJson` abgeleitet, nicht clientseitig gesendet.** Wenn der Client sagt "gib mir Sticker für Frankreich, Deutschland, Spanien", schreibt der Server Frankreich-Deutschland-Spanien — auch wenn der User nur Andorra gespielt hat. Die Logik "welche Länder kamen heute vor" lebt in der Server-Action, geschrieben in TypeScript, getestet mit Snapshot-Tests pro Spielslug.

3. **Sticker sind unique pro (user_id, country_iso3, game_slug, daily_date) — oder es gibt Mehrfach-Stempel.** Entscheide vor dem Schema: ist ein Sticker eine binäre Sammlung ("hab ich oder hab ich nicht") oder ein Counter ("Frankreich 7x gestempelt")? Beide sind verteidigbar. Aber nicht beides gleichzeitig. Wenn binär: UNIQUE-Constraint. Wenn Counter: `count INT NOT NULL DEFAULT 0`. Margaret's Panini-Album-Metapher legt binär nahe. Aber: ein erneuter Stempel auf dem gleichen Land hat eine *Wärme* — "ich war schon dreimal in Frankreich". Drago-Frage: was *fühlt sich richtig an*? Yvel-Empfehlung: binäre Sammlung, aber `last_stamped_at` und `stamp_count` als Spalten — beste Welten.

4. **Atlas-Album darf nicht *Practice*-Runs reflektieren.** Sonst kann ein User durch Practice-Cheating (siehe Säule #9) alle 243 Sticker an einem Tag freischalten. Daily-Only. Friend-Challenge-Wins: zählen, wenn sie deterministisch sind (siehe Säule #5 Schicht 2). Andernfalls auch nicht.

5. **Sticker-Reveal-Animation ist *nach* der DB-Bestätigung, nicht *gleichzeitig*.** Optimistic UI hier ist Gift. User sieht den Sticker drehen, Server rejected (Race, Validation, was auch immer), User refresht — Sticker weg. Drago-Vertrauen kollabiert. Der Stempel landet *erst* nach `submitGameRun({ success: true })` plus `stampSticker({ success: true })`.

6. **Sticker-Daten-Quelle ist `countries.json`, gleiches Schema wie der Rest der App. Keine separate Tabelle für "stickerable countries".** Das ist eine zweite Wahrheit — und zweite Wahrheiten driften. Wenn Frankreich aus `countries.json` rausfliegt (z.B. dataset-revision), fliegt auch der Sticker. Foreign-Key auf eine `countries`-Tabelle in der DB ist *nicht* nötig, weil die App File-basiert ist — aber die Daten-Pipeline-Konvention (Kasimir's Bericht) sagt: ein Country-Datum existiert genau einmal, als JSON. Atlas-Album referenziert iso3-Strings, validiert sie gegen das geladene JSON beim Server-Insert.

7. **Album-Vollständigkeit (243/243) ist die Achievement-Schwelle, aber nicht das Spiel-Ende.** Wenn ein User 243 Sticker sammelt, darf der nächste Daily-Win keine Frust-Erfahrung sein ("du hast schon alle"). Stempel-Logik: bei voller Sammlung beginnt eine Stempel-Stärke-Erhöhung (siehe Punkt 3, Counter-Variante). Die *strukturelle Annahme* "Sammeln endet bei 243" muss explizit *nicht* gemacht werden.

8. **Sticker-Sharing ist nicht im MVP.** Das ist nicht eine Architektur-Klausel, das ist eine Scope-Klausel. Wenn Sticker geteilt werden können (z.B. Trade-Mechanik), explodiert die Komplexität: race conditions, doppelte Sticker, anti-cheat. Yvel-Empfehlung: MVP ist Solo-Sammlung. Trading wartet auf Phase 2 — und auf eine eigene Architektur-Sitzung mit eigenem Säulen-Defekt-Check.

## Validierungs-Lücke für blitz/borderline/supremacy

Lina hat in `03-lina-hadid-auth.md:H2` die Lücke benannt. Sie hat geschrieben "Per-Spiel-Validierung oder kein Server-Submit für blitz/borderline/supremacy". Ich gehe tiefer. Hier zwei Pseudo-Code-Skizzen.

### Blitz (10 Runden, Country-Erkennung mit Timer)

```typescript
case "blitz": {
  // Required schema
  const rounds = resultJson.rounds;
  if (!Array.isArray(rounds)) return "invalid_result";
  if (rounds.length !== 10) return "invalid_round_count";
  
  // Each round must have country iso3, answered, correct, timeMs
  for (const round of rounds) {
    if (typeof round.countryIso3 !== "string") return "invalid_result";
    if (!isValidIso3(round.countryIso3)) return "invalid_country";
    if (typeof round.answered !== "boolean") return "invalid_result";
    if (typeof round.correct !== "boolean") return "invalid_result";
    if (round.timeMs !== null && typeof round.timeMs !== "number") return "invalid_result";
    // A correct round must have answered=true
    if (round.correct && !round.answered) return "logic_violation";
    // Time floor: no answer in < 100ms (human reaction floor)
    if (round.correct && round.timeMs !== null && round.timeMs < 100) return "impossible_speed";
  }
  
  // Score must match correct count
  const correctCount = rounds.filter(r => r.correct).length;
  if (correctCount !== scoreRaw) return "score_mismatch";
  
  // Total elapsed time floor: 10 rounds * 100ms = 1000ms minimum
  const totalTimeMs = rounds.reduce((sum, r) => sum + (r.timeMs ?? 0), 0);
  if (totalTimeMs < 1000 && correctCount > 5) return "impossible_total_time";
  
  // If daily: countries must match the seeded picks
  if (mode === "daily") {
    const seed = dateSeed(dateKey + "blitz");
    const rng = mulberry32(seed);
    const expectedCountries = seededPick(getAllCountries(), 10, rng);
    const expectedIso3 = expectedCountries.map(c => c.iso3);
    const actualIso3 = rounds.map(r => r.countryIso3);
    if (!arraysEqual(expectedIso3, actualIso3)) return "puzzle_mismatch";
  }
  
  break;
}
```

Drei Verteidigungs-Linien: Schema-Sanity, Logik-Konsistenz, Daily-Determinismus. Der `puzzle_mismatch` ist die Hauptverteidigung — er macht es unmöglich, ohne das echte Puzzle zu submitten. Aber er erfordert, dass die Engine *deterministisch* ist (Säule #12 — `country-draft` Anomalie applies to similar concerns hier; blitz nutzt zumindest `rng: () => number` Parameter, gut).

### Borderline (BFS-Pfad zwischen zwei Ländern)

```typescript
case "borderline": {
  const startIso3 = resultJson.startIso3;
  const targetIso3 = resultJson.targetIso3;
  const path = resultJson.path; // array of iso3 strings
  const optimalLength = resultJson.optimalLength;
  
  if (typeof startIso3 !== "string" || !isValidIso3(startIso3)) return "invalid_result";
  if (typeof targetIso3 !== "string" || !isValidIso3(targetIso3)) return "invalid_result";
  if (!Array.isArray(path)) return "invalid_result";
  if (path.length < 2) return "invalid_path_length";
  if (path[0] !== startIso3) return "path_must_start_at_start";
  if (path[path.length - 1] !== targetIso3) return "path_must_end_at_target";
  
  // Each consecutive pair must share a border
  for (let i = 0; i < path.length - 1; i++) {
    const neighbors = borders[path[i]] ?? [];
    if (!neighbors.includes(path[i + 1])) return "invalid_border_step";
  }
  
  // No repeats (visited rule)
  const visited = new Set(path);
  if (visited.size !== path.length) return "path_revisits_country";
  
  // moveCount = path.length - 1 (steps, not nodes)
  const moveCount = path.length - 1;
  if (moveCount !== resultJson.moveCount) return "movecount_mismatch";
  
  // scoreRaw is moveCount; scoreMax is something like optimalLength * 2
  if (scoreRaw !== moveCount) return "score_mismatch";
  
  // Verify optimal length using server-side BFS
  const serverOptimal = bfsShortestPath(startIso3, targetIso3);
  if (!serverOptimal) return "no_path_exists";
  const serverOptimalLength = serverOptimal.length - 1;
  if (serverOptimalLength !== optimalLength) return "optimal_mismatch";
  
  // If daily: start/target must match seeded generation
  if (mode === "daily") {
    const seed = dateSeed(dateKey + "borderline");
    const rng = mulberry32(seed);
    const expected = createBorderline(rng);
    if (expected.startCountry.iso3 !== startIso3) return "puzzle_mismatch";
    if (expected.targetCountry.iso3 !== targetIso3) return "puzzle_mismatch";
  }
  
  break;
}
```

Vier Verteidigungs-Linien hier: Schema, Pfad-Geometrie (jede Kante eine echte Border), Optimal-Verifikation (BFS serverseitig), Daily-Determinismus. Das ist viel Code — aber der Code existiert *bereits* (`bfsShortestPath`, `createBorderline`). Es ist eine Wiederbenutzung der Engine im Server-Action. Strukturell sauber: die Engine ist pure, sie läuft im Server genauso wie im Client.

Supremacy lasse ich aus dem Pseudo-Code aus (geringer Pflege-Wert, denn supremacy ist nach Multiplayer-Removal nur noch AI-Solo, und das Urteil hat es in den Drills-Bereich abgeschoben). Wenn es trotzdem bleibt: Validation auf Stat-Wahl-Konsistenz + Hand-Determinismus, gleicher Aufbau.

## Das eine "Nein", das ich heute ausspreche

**Kein Live-Deployment, bevor `daily_puzzles` RLS Insert auf `auth.uid() IS NOT NULL` gesetzt oder durch SECURITY DEFINER RPC ersetzt ist.** Der Daily-Seed eines Tages ist der Vertrag, den Countrivo mit seinen Spielern eingeht. Wer den Vertrag schreiben kann, hat den Vertrag gebrochen. Das ist eine Säule, die jetzt steht — und sie steht auf Sand. Ich gebe das Sign-off nicht, bis sie auf Beton steht. Alles andere kann warten; das nicht.

## Schluss-Notiz

Eleftheria hat mich neulich gefragt, ob ich heimkomme zu Weihnachten. Ich habe gesagt: ich weiß nicht. Sie hat aufgelegt, ohne wütend zu sein, und das war schlimmer als wenn sie wütend gewesen wäre. Was ich heute für Countrivo geschrieben habe, ist nicht ein Bug-Bericht. Es ist eine Liste von Sätzen, die der Code als wahr annimmt, ohne dass jemand sie unterschrieben hat. Wenn Marius Olbricht das Urteil verkündet hat — vier Spiele plus eine Sammel-Schicht — dann hat er einen Vertrag geschrieben. Vertrag braucht Vollstreckbarkeit. Vollstreckbarkeit braucht, dass die unausgesprochenen Annahmen aussprechbar werden, bevor jemand sie ausnutzt. Ich war der QA, der Nein gesagt hat zu Aegean Odyssey, und das Studio ist trotzdem gestorben. Ich sage heute wieder Nein zu einer Säule, von der ich weiß, dass niemand sie unterschrieben hat. Vielleicht hört diesmal jemand zu. Vielleicht nicht. Aber das Nein gehört ausgesprochen, auch im Exil. — Yvel.
