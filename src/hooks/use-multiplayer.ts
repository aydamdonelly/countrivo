"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = { type: string; [key: string]: unknown };

export function useMultiplayer(roomCode: string | null) {
  const [connected, setConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "game" }, ({ payload }) => {
        setMessages((prev) => [...prev, payload as Message]);
        if (payload.type === "player:joined") setOpponentJoined(true);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          channel.send({
            type: "broadcast",
            event: "game",
            payload: { type: "player:joined" },
          });
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomCode]);

  const send = useCallback((message: Message) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game",
      payload: message,
    });
  }, []);

  const lastMessage = messages[messages.length - 1] ?? null;

  return { connected, opponentJoined, messages, lastMessage, send };
}
