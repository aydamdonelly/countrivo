"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

type Message = { type: string; [key: string]: unknown };

export function useMultiplayer(roomCode: string | null, isHost = false) {
  const [connected, setConnected] = useState(false);
  const [opponentJoined, setOpponentJoined] = useState(false);
  const [opponentDisconnected, setOpponentDisconnected] = useState(false);
  const [myReady, setMyReady] = useState(false);
  const [opponentReady, setOpponentReady] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const disconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!roomCode) return;

    const supabase = createClient();
    const channel = supabase.channel(`room:${roomCode}`, {
      config: { broadcast: { self: false }, presence: { key: roomCode } },
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
            setTimeout(() => setCountdown(null), 500);
          }
        }
      })
      .on("presence", { event: "leave" }, () => {
        // Opponent left — start disconnect timeout
        if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
        disconnectTimerRef.current = setTimeout(() => {
          setOpponentDisconnected(true);
        }, 15000); // 15s grace period for reconnection
      })
      .on("presence", { event: "join" }, () => {
        // Opponent reconnected — cancel disconnect timeout
        if (disconnectTimerRef.current) {
          clearTimeout(disconnectTimerRef.current);
          disconnectTimerRef.current = null;
        }
        setOpponentDisconnected(false);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          setConnected(true);
          await channel.track({ joined: true });
          channel.send({
            type: "broadcast",
            event: "game",
            payload: { type: "player:joined" },
          });
        }
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          setConnected(false);
          // Attempt resubscribe after 2s
          setTimeout(() => {
            channel.subscribe();
          }, 2000);
        }
      });

    channelRef.current = channel;
    return () => {
      supabase.removeChannel(channel);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (disconnectTimerRef.current) clearTimeout(disconnectTimerRef.current);
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

  // Only the host runs the countdown to avoid dual-broadcast race condition
  useEffect(() => {
    if (!myReady || !opponentReady || !isHost) return;
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
  }, [myReady, opponentReady, isHost, send]);

  const lastMessage = messages[messages.length - 1] ?? null;

  return {
    connected,
    opponentJoined,
    opponentDisconnected,
    myReady,
    opponentReady,
    countdown,
    messages,
    lastMessage,
    send,
    sendReady,
  };
}
