Scaffold a new Countrivo game: $ARGUMENTS

Create these files following existing game patterns:

1. **Engine** — `src/lib/game-logic/$ARGUMENTS/engine.ts`
   - Export types for game state and config
   - Export create function taking `(rng: () => number)` parameter
   - Export state transition functions (pure, no side effects)
   - Export result computation function
   - Reference: `src/lib/game-logic/flag-quiz/engine.ts` (simple), `src/lib/game-logic/country-draft/` (complex)

2. **Board** — `src/components/games/$ARGUMENTS/$ARGUMENTS-board.tsx`
   - "use client" at top
   - useReducer for state management
   - Import and call engine functions in reducer
   - Use GameOverScreen, GameSessionTopBar from shared components
   - Submit via submitGameRun server action on completion
   - Reference: `src/components/games/flag-quiz/flag-quiz-board.tsx`

3. **Landing page** — `src/app/games/$ARGUMENTS/page.tsx`
   - Server component with metadata export
   - Render GameLanding + PlayedTodayBanner
   - Reference: `src/app/games/flag-quiz/page.tsx`

4. **Play page** — `src/app/games/$ARGUMENTS/play/page.tsx`
   - Server component, check daily status
   - Render the board component
   - Reference: `src/app/games/flag-quiz/play/page.tsx`

5. **Registry** — Add entry to `src/data/game-registry.json`
   - Follow GameMeta schema from `src/types/game.ts`

6. **Color** — Add entry to `src/lib/game-colors.ts`

After scaffolding, run `npx tsc --noEmit` to verify types compile.
