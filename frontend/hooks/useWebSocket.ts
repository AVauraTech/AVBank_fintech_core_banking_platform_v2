"use client";
import { useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

export function useWebSocket(userId: string | undefined) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!userId || typeof window === "undefined") return;
    const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000";
    const ws = new WebSocket(`${WS_URL}/ws/${userId}`);

    ws.onopen = () => {
      console.log("WebSocket connected to AVBank");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "transaction") {
          toast(data.message, { icon: data.icon || "💰" });
        } else if (data.type === "fraud_alert") {
          toast.error(`🚨 Security Alert: ${data.message}`, { duration: 8000 });
        } else if (data.type === "loan_update") {
          toast(data.message, { icon: "📋" });
        }
      } catch (e) {
        console.error("WebSocket message parse error", e);
      }
    };

    ws.onclose = () => {
      reconnectTimeoutRef.current = setTimeout(connect, 5000);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [userId]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return wsRef;
}
