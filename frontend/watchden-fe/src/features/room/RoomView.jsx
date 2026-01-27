import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiClient as api } from "../../api/api"; // Ensure this points to port 8080
import RoomHeader from "./RoomHeader";
import VideoPlayer from "./VideoPlayer";
import ChatPanel from "./ChatPanel";
import {
  connectToRoom,
  disconnectRoom,
  sendMessage,
} from "../../socket/roomSocket";
import { ROOM_EVENTS } from "../../socket/roomEvents";
import "./room.css";

// --- 1. JWT Decoder Helper ---
// Extracts the "sub" (User ID) from the token so React knows who is logged in.
const getUserFromToken = () => {
  const token = localStorage.getItem("token"); // Or whatever key you save it as
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );

    const payload = JSON.parse(jsonPayload);
    // Adjust 'sub' if your Auth Service uses 'userId' or 'username' in the claim
    return { id: payload.sub, username: payload.username || "User" };
  } catch (e) {
    console.error("Invalid Token", e);
    return null;
  }
};

const RoomView = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);

  // --- 2. Initialize Identity ---
  const [user] = useState(getUserFromToken());

  useEffect(() => {
    // Security Redirect
    if (!user) {
      // If no token, kick them out
      navigate("/login");
      return;
    }
    if (!roomId) {
      navigate("/");
      return;
    }

    // --- 3. Load History via Gateway ---
    const loadHistory = async () => {
      try {
        // Calls GET http://localhost:8080/api/chat/history/{roomId}
        // (Make sure your Gateway route is configured to strip /api if needed)
        const response = await api.get(`/api/chat/history/${roomId}`);
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error("History Error:", err);
      }
    };
    loadHistory();

    // --- 4. Connect WebSocket via Gateway ---
    // We pass 'user.id' so the Join message has the correct sender
    connectToRoom(roomId, user.id, (event) => {
      switch (event.type) {
        case ROOM_EVENTS.CHAT_MESSAGE:
          setMessages((prev) => [...prev, event.payload]);
          break;
        case ROOM_EVENTS.USER_JOINED:
          console.log(`User ${event.payload.senderId} joined`);
          break;
        case ROOM_EVENTS.VIDEO_SYNC:
          // You will use this in Phase 2
          break;
      }
    });

    return () => disconnectRoom();
  }, [roomId, navigate, user]);

  const handleSendMessage = (text) => {
    if (!user) return;
    sendMessage({
      roomId,
      content: text,
      senderId: user.id, // Send the Real ID from the Token
    });
  };

  if (!user) return null; // Don't render if redirecting

  return (
    <div className="room-container">
      <RoomHeader roomId={roomId} />
      <div className="room-content-wrapper">
        <div className="video-section">
          <VideoPlayer roomId={roomId} />
        </div>
        <div className="chat-section">
          <ChatPanel
            messages={messages}
            currentUser={user} // Pass identity to ChatPanel
            onSendMessage={handleSendMessage}
          />
        </div>
      </div>
    </div>
  );
};

export default RoomView;
