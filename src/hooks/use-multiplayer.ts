"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = { type: string; [key: string]: unknown };

export function useMultiplayer(roomCode: string | null) {
  const [connected, setConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false } },
    });

    channel
      .on("broadcast", { event: "game" }, ({ payload }) => {
        const msg = payload as Message;
        setMessages((prev) => [...prev, msg]);

        if (msg.type === "player:joined") setOpponentJoined(true);
        if (msg.type === "player:ready") setOpponentReady(true);
        if (msg.type === "countdown") {
          const t = msg.t as number;
          setCountdown(t);
          if (t === 0) {
            // Countdown finished — game starts
            setTimeout(() => setCountdown(null), 500);
          }
        }
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
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [roomCode]);

  const send = useCallback((message: Message) => {
    channelRef.current?.send({
      type: "broadcast",
      event: "game",
      payload: message,
    });
  }, []);

  const sendReady = useCallback(() => {
    setMyReady(true);
    send({ type: "player:ready" });
  }, [send]);

  // Start countdown when both ready
  useEffect(() => {
    if (!myReady || !opponentReady) return;
    let t = 3;
    setCountdown(t);
    send({ type: "countdown", t });
    countdownRef.current = setInterval(() => {
      t -= 1;
      setCountdown(t);
      send({ type: "countdown", t });
      if (t <= 0 && countdownRef.current) {
        clearInterval(countdownRef.current);
        countdownRef.current = null;
      }
    }, 1000);
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, [myReady, opponentReady, send]);

  const lastMessage = messages[messages.length - 1] ?? null;

  return {
    connected,
    opponentJoined,
    myReady,
    opponentReady,
    countdown,
    messages,
    lastMessage,
    send,
    sendReady,
  };
}
