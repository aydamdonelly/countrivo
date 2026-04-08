# Code Quality

## TypeScript
- Strict mode is ON. No `any`. No unsafe `as` casts.
- Prefer `interface` for object shapes, `type` for unions/aliases.
- Export shared types from `src/types/` — don't define inline in components.

## React
- No class components. Functions only.
- useReducer for game state (not useState for complex state).
- Custom hooks in `src/hooks/` for reusable behavior.
- No third-party UI libraries. All components are custom.

## Tailwind CSS 4
- Design tokens live in `globals.css` @theme block.
- Use semantic tokens: var(--color-gold), var(--ease-game), etc.
- No hardcoded colors in className strings.

## Imports
- Use `@/*` alias (maps to `src/*`). Never use relative paths like `../../`.
- Group: React -> Next -> third-party -> @/lib -> @/components -> @/types -> local.
