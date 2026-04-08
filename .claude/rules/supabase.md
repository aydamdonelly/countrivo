# Supabase Patterns

## Client Selection
- Server components / server actions -> `import { createClient } from "@/lib/supabase/server"` (cookies-based)
- Client components -> `import { createClient } from "@/lib/supabase/client"` (browser-based)
- NEVER import server client in "use client" files

## Server Actions
- Always check auth: `const { data: { user } } = await supabase.auth.getUser()`
- Return typed results: `{ success: boolean; data?: T; error?: string }`
- Location: `src/app/actions/`
- Always add "use server" directive at top of file

## Multiplayer
- Realtime rooms via `src/lib/supabase/rooms.ts` (client-side only)
- Table: game_rooms (code, game_type, seed, status, player_count)
- Room codes: 4 chars, no ambiguous chars (I/O/0/1 excluded)
- Use Supabase Realtime channels for broadcast + presence
