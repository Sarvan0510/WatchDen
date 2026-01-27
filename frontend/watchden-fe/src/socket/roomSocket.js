import { ROOM_EVENTS } from "./roomEvents";

let socket = null;

/**
 * Connects to the WebSocket room.
 * @param {string} roomId - The ID of the room to join.
 * @param {string} userId - The real User ID from the JWT token.
 * @param {function} onEvent - Callback to handle incoming messages.
 */
export const connectToRoom = (roomId, userId, onEvent) => {
  if (socket) {
    // Only close if it's open/connecting to avoid errors
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
    socket = null;
  }

  // Ensure this matches your Gateway port (8080)
  const ws = new WebSocket("ws://localhost:8083/ws/chat");
  socket = ws;

  ws.onopen = () => {
    if (ws.readyState === WebSocket.OPEN) {
      console.log(`✅ WS Connected as ${userId}. Joining room: ${roomId}`);
      ws.send(
        JSON.stringify({
          type: "JOIN",
          roomId: roomId,
          senderId: userId, // ✅ Now sending the REAL ID
          content: "",
          timestamp: Date.now(),
        })
      );
    }
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data);
      if (!msg.type) return;

      switch (msg.type) {
        case "CHAT":
          onEvent({ type: ROOM_EVENTS.CHAT_MESSAGE, payload: msg });
          break;
        case "JOIN":
          onEvent({ type: ROOM_EVENTS.USER_JOINED, payload: msg });
          break;
        case "LEAVE":
          onEvent({ type: ROOM_EVENTS.USER_LEFT, payload: msg });
          break;
        case "SYNC": // Ready for Phase 2
          onEvent({ type: ROOM_EVENTS.VIDEO_SYNC, payload: msg });
          break;
        default:
          console.warn("Unknown message type:", msg.type);
      }
    } catch (e) {
      console.error("Parse error:", e);
    }
  };

  ws.onerror = (err) => console.error("❌ WS Error:", err);

  ws.onclose = () => {
    console.log("🔌 WS Disconnected");
    if (socket === ws) socket = null;
  };
};

export const sendMessage = ({ roomId, content, senderId }) => {
  if (socket && socket.readyState === WebSocket.OPEN) {
    const payload = {
      type: "CHAT",
      roomId,
      senderId: senderId, // ✅ Must match the JWT ID
      content,
      timestamp: Date.now(),
    };
    socket.send(JSON.stringify(payload));
  } else {
    console.warn("⚠️ Cannot send: Socket not open");
  }
};

export const disconnectRoom = () => {
  if (socket) {
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
    }
    socket = null;
  }
};
