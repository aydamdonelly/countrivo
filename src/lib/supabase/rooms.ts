import { createClient } from "./client";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  const array = new Uint8Array(4);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

export async function createRoom(gameType: string) {
  const supabase = createClient();
  const code = generateCode();
  const seedArray = new Uint32Array(1);
  crypto.getRandomValues(seedArray);
  const seed = seedArray[0] % 2147483647;

  const { data, error } = await supabase
    .from("game_rooms")
    .insert({
      code,
      game_type: gameType,
      seed,
      status: "waiting",
      player_count: 1,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function joinRoom(code: string) {
  const supabase = createClient();

  // Atomic: update only if still waiting with 1 player
  const { data, error } = await supabase
    .from("game_rooms")
    .update({ player_count: 2, status: "playing" })
    .eq("code", code.toUpperCase())
    .eq("status", "waiting")
    .eq("player_count", 1)
    .select()
    .single();

  if (error || !data) throw new Error("Room not found or already full");
  return data;
}

export async function getRoomByCode(code: string) {
  const supabase = createClient();
  const { data } = await supabase
    .from("game_rooms")
    .select()
    .eq("code", code.toUpperCase())
    .single();
  return data;
}
