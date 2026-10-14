import "server-only";

import { unstable_cache } from "next/cache";
import { getTodayDateKey } from "@/lib/daily-seed";
import { gameDatabase } from "./anonymous-identity";

export interface ArchivedBoard {
  game_slug: string;
  date_key: string;
  edition: string;
  engine_version: string;
  seed: number;
  public_board: unknown;
  solution: unknown;
}

/** Immutable records ensure tomorrow's deploy cannot rewrite yesterday's answers. */
export async function storeBoardSnapshot(input: { slug: string; dateKey: string; edition: string; seed: number; publicBoard: unknown; solution: unknown }): Promise<void> {
  const { error } = await gameDatabase().from("countrivo_boards").upsert({ game_slug: input.slug, date_key: input.dateKey, edition: input.edition,
    engine_version: "october-relaunch-1", seed: input.seed, public_board: input.publicBoard, solution: input.solution },
    { onConflict: "game_slug,date_key,edition", ignoreDuplicates: true });
  if (error) throw new Error("Could not preserve this daily board");
}

const readArchivedBoard = unstable_cache(async (slug:string,dateKey:string):Promise<ArchivedBoard|null> => {
  const { data } = await gameDatabase().from("countrivo_boards").select("*").eq("game_slug", slug).eq("date_key", dateKey)
    .order("created_at", { ascending: false }).limit(1).abortSignal(AbortSignal.timeout(6000)).maybeSingle<ArchivedBoard>();
  return data;
}, ['closed-daily-board'], {revalidate:60});

export async function getArchivedBoard(slug: string, dateKey: string): Promise<ArchivedBoard | null> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey) || dateKey >= getTodayDateKey()) return null;
  return readArchivedBoard(slug,dateKey);
}

export async function listArchivedBoards(slug?: string): Promise<{ game_slug: string; date_key: string; edition: string }[]> {
  let query = gameDatabase().from("countrivo_boards").select("game_slug,date_key,edition").lt("date_key", getTodayDateKey()).order("date_key", { ascending: false });
  if (slug) query = query.eq("game_slug", slug);
  const { data } = await query.limit(365).returns<{ game_slug: string; date_key: string; edition: string }[]>();
  return data ?? [];
}

export async function archivedState<S>(slug: string, dateKey: string, edition: string): Promise<S | null> {
  if (dateKey >= getTodayDateKey()) return null;
  return frozenBoardState<S>(slug,dateKey,edition);
}

/** Private server sessions may load today's frozen state; public archive readers may not. */
export async function frozenBoardState<S>(slug:string,dateKey:string,edition:string):Promise<S|null> {
  return (await frozenBoardSnapshot<S>(slug,dateKey,edition))?.solution ?? null;
}

class SnapshotMissing extends Error {}

const readPreservedSnapshot = unstable_cache(async function<S>(slug:string,dateKey:string,edition:string):Promise<{seed:number;solution:S}> {
  const {data,error}=await gameDatabase().from('countrivo_boards').select('seed,solution').eq('game_slug',slug).eq('date_key',dateKey).eq('edition',edition)
    // A fresh signal bypasses React's GET deduplication after creating the first snapshot.
    .abortSignal(AbortSignal.timeout(6000))
    .maybeSingle<{seed:number;solution:S}>();
  if(error)throw new Error('Could not read the preserved daily board');
  // Cache only immutable saved boards. A missing row must remain visible after its first insert.
  if(!data)throw new SnapshotMissing();
  return data;
}, ['preserved-daily-snapshot'], {revalidate:false});

export async function frozenBoardSnapshot<S>(slug:string,dateKey:string,edition:string):Promise<{seed:number;solution:S}|null> {
  try {return await readPreservedSnapshot<S>(slug,dateKey,edition);}
  catch(error) {if(error instanceof SnapshotMissing)return null;throw error;}
}
