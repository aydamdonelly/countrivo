# Decisions

- 2026-05-26 · Step 0 (Aorta): `daily_puzzles` Insert-Policy auf `TO authenticated WITH CHECK (true)` umgestellt (vorher PUBLIC). Verifiziert: anon-Insert wirft `42501 row-level security policy`. Supabase-Advisor flagged das `WITH CHECK (true)` als zu permissiv — bewusst angenommen, weil `TO authenticated` das Gate ist und `submitGameRun`-UPSERT mit `ON CONFLICT(game_slug,daily_date)` Seed-Manipulation post-first-write verhindert.
- 2026-05-26 · `validateGameResult` default-Branch von `break` (silent accept) auf `return "unvalidated_game"` (reject). Misleading-Kommentar zu blitz/borderline/supremacy entfernt — grep bestätigt: diese drei Spiele rufen `submitGameRun` gar nicht auf, der Kommentar war ein Relikt.
- 2026-05-26 · `searchUsers` Sanitization: PostgREST-Delimiter (`",()[]{}`) werden gestrippt, SQL-LIKE-Wildcards (`%_\\`) bleiben escaped. Apostrophe nicht angefasst, damit Namen wie "O'Brien" weiter suchbar bleiben.
- 2026-05-26 · `game_results` + `sessions` Tabellen gedroppt — 0 Zeilen, 0 Code-Referenzen, beide RLS PUBLIC (offene Türen).
- 2026-05-26 · Deferred: SECURITY DEFINER RPC `ensure_daily_puzzle(game_slug, date)` als härtere Variante. Heute Abend nicht gebaut — die Authenticated-Policy reicht für die unmittelbare Lücke.
- 2026-05-26 · Deferred: Supabase-Advisor flagged `game_rooms` RLS und `function_search_path_mutable` auf 6 Funktionen. `game_rooms` verschwindet in Schritt 1 (Multiplayer-Removal). Search-Path-Hardening ist Schritt 9+ (Server-Side Re-Compute) Zeitfenster.
- 2026-05-26 · Deferred: `auth_leaked_password_protection` (HaveIBeenPwned-Check) wird in Schritt 2 (Auth-Vereinfachung) addressiert, wenn Email/Password live geht.
