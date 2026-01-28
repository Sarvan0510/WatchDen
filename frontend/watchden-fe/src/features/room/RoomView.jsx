import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { userApi } from "../../api/user.api";
import RoomHeader from "./RoomHeader";
import VideoPlayer from "./VideoPlayer";
import ChatPanel from "./ChatPanel";
import ParticipantList from "./ParticipantList";
import { connectSocket, disconnectSocket } from "../../socket/roomSocket";
import { authUtils } from "../auth/auth.utils";
import "./room.css";

const RoomView = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [user, setUser] = useState(() => authUtils.getUser());
  const isConnected = useRef(false);

  const handleLogout = () => {
    authUtils.clearAuth();
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const syncProfiles = async () => {
      if (participants.length === 0) return;

      try {
        // Convert participants to numbers if they come as strings from Redis
        const userIds = participants.map((id) => Number(id));
        const profiles = await userApi.getUsersBatch(userIds);

        const newMap = {};
        profiles.forEach((p) => {
          newMap[p.userId] = p;
        });

        // Merge with existing map to prevent flickering
        setProfileMap((prev) => ({ ...prev, ...newMap }));
      } catch (err) {
        console.error("Failed to sync participant profiles:", err);
      }
    };

    syncProfiles();
  }, [participants]);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${roomCode}`);
        if (Array.isArray(response.data)) {
          setMessages(response.data);
        }
      } catch (err) {
        console.error("Failed to load history:", err);
      }
    };
    loadHistory();

    if (!isConnected.current) {
      isConnected.current = true;
      connectSocket(
        roomCode,
        (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
        },
        (participantUpdate) => {
          if (Array.isArray(participantUpdate)) {
            setParticipants(participantUpdate);
          }
        }
      );
    }

    return () => {
      isConnected.current = false;
      disconnectSocket();
    };
  }, [roomCode, navigate]);

  if (!user) return null;

  return (
    <div className="room-wrapper" style={styles.wrapper}>
      <RoomHeader roomId={roomCode} user={user} onLogout={handleLogout} />
      <div className="room-container">
        <div className="main-content">
          <div className="video-section">
            <VideoPlayer roomCode={roomCode} />
          </div>
        </div>
        <div className="sidebar">
          <div className="sidebar">
            <div className="participants-section">
              {/* 🟢 Pass profileMap to resolve names in the list */}
              <ParticipantList
                participants={participants}
                profileMap={profileMap}
              />
            </div>
            <div className="chat-section">
              {/* 🟢 Pass profileMap to resolve names in chat bubbles */}
              <ChatPanel
                messages={messages}
                roomCode={roomCode}
                profileMap={profileMap}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a", // Match landing background
  },
};

export default RoomView;
