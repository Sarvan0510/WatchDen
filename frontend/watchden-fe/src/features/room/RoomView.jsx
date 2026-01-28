import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api"; // Ensure this matches your export in api.js (api vs apiClient)
import RoomHeader from "./RoomHeader";
import VideoPlayer from "./VideoPlayer";
import ChatPanel from "./ChatPanel";
import ParticipantList from "./ParticipantList"; // NEW Component
import { connectSocket, disconnectSocket } from "../../socket/roomSocket"; // Updated imports
import "./room.css";

// --- 1. JWT Decoder Helper (KEPT AS IS) ---
const getUserFromToken = () => {
  const token = localStorage.getItem("token");
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
    // Return standardized user object
    return { id: payload.userId || payload.sub, username: payload.sub };
  } catch (e) {
    console.error("Invalid Token", e);
    return null;
  }
};

const RoomView = () => {
  const { roomCode } = useParams(); // Changed roomId to roomCode to match routes
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [user, setUser] = useState(getUserFromToken());

  useEffect(() => {
    // 1. Security Check
    if (!user) {
      navigate("/login");
      return;
    }
    if (!roomCode) {
      navigate("/rooms");
      return;
    }

    // 2. Load Chat History
    const loadHistory = async () => {
      try {
        // Ensure this endpoint matches your Chat Controller
        const response = await api.get(`/chat/history/${roomCode}`);
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    loadHistory();

    // 3. Connect to WebSocket
    // We pass 3 callbacks: Message Received, Participant Joined, Participant Left (optional)
    connectSocket(
      roomCode,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
      },
      (participantUpdate) => {
        // Logic to update participant list
        // If backend sends the FULL list every time:
        if (Array.isArray(participantUpdate)) {
          setParticipants(participantUpdate);
        } else {
          // If backend sends single JOIN events, we assume for now it sends full list
          // or we just log it until backend is perfect.
          console.log("Participant update:", participantUpdate);
        }
      }
    );

    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [roomCode, navigate, user]);

  if (!user) return null;

  return (
    <div
      className="room-wrapper"
      style={{ height: "100vh", display: "flex", flexDirection: "column" }}
    >
      {/* Header stays at top */}
      <RoomHeader roomId={roomCode} />

      {/* Main Content Area */}
      <div className="room-container">
        {/* Left Side: Video Player */}
        <div className="main-content">
          <div className="video-section">
            <VideoPlayer roomCode={roomCode} />
          </div>
        </div>

        {/* Right Side: Sidebar */}
        <div className="sidebar">
          {/* Top Half: Participants */}
          <div className="participants-section">
            <ParticipantList participants={participants} />
          </div>

          {/* Bottom Half: Chat */}
          <div className="chat-section">
            <ChatPanel
              messages={messages}
              roomCode={roomCode}
              // ChatPanel now handles message sending internally via socket
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomView;
