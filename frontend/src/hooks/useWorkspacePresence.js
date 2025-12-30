import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

/**
 * Hook to manage workspace-level presence.
 * This should be used at the WorkspaceLayout level to ensure presence
 * is tracked regardless of which page (channel/DM) the user is viewing.
 *
 * @param {string} token - JWT access token
 * @param {string} workspaceId - Current workspace ID
 */
export function useWorkspacePresence(token, workspaceId) {
  const socketRef = useRef(null);
  const heartbeatTimerRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const [onlineUserIds, setOnlineUserIds] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    if (!token) {
      console.log("useWorkspacePresence: No token provided, skipping connection");
      return;
    }

    console.log("useWorkspacePresence: Connecting to", `${SOCKET_URL}/chat`);

    const socket = io(`${SOCKET_URL}/chat`, {
      auth: { token },
      query: { token },
      transports: ["polling", "websocket"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      forceNew: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Workspace Presence Socket connected, id:", socket.id);
    });

    socket.on("connected", (data) => {
      console.log("Workspace Presence Authenticated:", data.user);
      setIsConnected(true);

      // Start heartbeat
      if (heartbeatTimerRef.current) clearInterval(heartbeatTimerRef.current);
      heartbeatTimerRef.current = setInterval(() => {
        try {
          socket.emit("presence:heartbeat");
        } catch {}
      }, 15000);
    });

    socket.on("disconnect", (reason) => {
      console.log("Workspace Presence Socket disconnected:", reason);
      setIsConnected(false);
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Workspace Presence Connection error:", err.message);
      setIsConnected(false);
    });

    // Workspace presence events
    socket.on("workspace:joined", ({ workspaceId: wsId, onlineUserIds: ids }) => {
      console.log("Workspace Presence: Joined workspace:", wsId, "Online users:", ids);
      setOnlineUserIds(ids || []);

      // Dispatch initial online list
      if (Array.isArray(ids)) {
        ids.forEach((id) => {
          window.dispatchEvent(
            new CustomEvent("presence:user:update", {
              detail: { userId: id, isOnline: true },
            })
          );
        });
      }
    });

    socket.on("presence:user:online", ({ userId }) => {
      setOnlineUserIds((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
      window.dispatchEvent(
        new CustomEvent("presence:user:update", {
          detail: { userId, isOnline: true },
        })
      );
    });

    socket.on("presence:user:offline", ({ userId }) => {
      setOnlineUserIds((prev) => prev.filter((id) => id !== userId));
      window.dispatchEvent(
        new CustomEvent("presence:user:update", {
          detail: { userId, isOnline: false },
        })
      );
    });

    // Cleanup
    return () => {
      try {
        socket.disconnect();
      } catch {}
      socketRef.current = null;
      if (heartbeatTimerRef.current) {
        clearInterval(heartbeatTimerRef.current);
        heartbeatTimerRef.current = null;
      }
    };
  }, [token]);

  // Join workspace when workspaceId changes
  useEffect(() => {
    if (!socketRef.current || !isConnected || !workspaceId) return;

    console.log("useWorkspacePresence: Joining workspace", workspaceId);
    socketRef.current.emit("workspace:join", { workspaceId });

    return () => {
      if (socketRef.current) {
        console.log("useWorkspacePresence: Leaving workspace", workspaceId);
        socketRef.current.emit("workspace:leave", { workspaceId });
      }
    };
  }, [workspaceId, isConnected]);

  // Gracefully disconnect on tab close
  useEffect(() => {
    const handlePageHide = () => {
      try {
        if (socketRef.current) {
          if (workspaceId) {
            socketRef.current.emit("workspace:leave", { workspaceId });
          }
          socketRef.current.disconnect();
        }
      } catch {}
    };

    window.addEventListener("beforeunload", handlePageHide);
    window.addEventListener("pagehide", handlePageHide);
    return () => {
      window.removeEventListener("beforeunload", handlePageHide);
      window.removeEventListener("pagehide", handlePageHide);
    };
  }, [workspaceId]);

  return {
    isConnected,
    onlineUserIds,
  };
}

export default useWorkspacePresence;
