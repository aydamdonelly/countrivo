Review recent changes against Countrivo quality standards.

Run `git diff HEAD~1` (or the appropriate range) and evaluate against:

- [ ] TypeScript strict: no `any`, no unsafe `as` casts
- [ ] Server/client boundary: "use client" only where needed, no server imports in client code
- [ ] Game logic purity: no React imports in engine.ts, RNG passed as parameter
- [ ] Data integrity: JSON files not edited by hand
- [ ] Design tokens: using theme variables from globals.css, not hardcoded colors
- [ ] Supabase: correct client (server.ts vs client.ts) for the context
- [ ] Build passes: `npm run build`
- [ ] No new dependencies added without reason
- [ ] No unnecessary "use client" directives on server components

Report findings with file paths and line numbers.
