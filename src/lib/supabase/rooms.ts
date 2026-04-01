import { createClient } from "./client";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1
  let code = "";
  for (let i = 0; i < 4; i++)
    code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function createRoom(gameType: string) {
  const supabase = createClient();
  const code = generateCode();
  const seed = Math.floor(Math.random() * 2147483647);

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
  const { data, error } = await supabase
    .from("game_rooms")
    .select()
    .eq("code", code.toUpperCase())
    .eq("status", "waiting")
    .single();

  if (error || !data) throw new Error("Room not found");

  await supabase
    .from("game_rooms")
    .update({ player_count: 2, status: "playing" })
    .eq("id", data.id);

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
