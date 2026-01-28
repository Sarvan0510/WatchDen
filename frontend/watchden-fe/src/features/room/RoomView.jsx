import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { userApi } from "../../api/user.api";
import { roomApi } from "../../api/room.api";
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

  // Sync User State (Listen for Profile Updates)
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log("RoomView: User updated, refreshing state...");
      setUser(authUtils.getUser());
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

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

  const [hostLeft, setHostLeft] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isHost, setIsHost] = useState(false);

  useEffect(() => {
    let timer;
    if (hostLeft && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (hostLeft && countdown === 0) {
      navigate("/rooms");
    }
    return () => clearInterval(timer);
  }, [hostLeft, countdown, navigate]);

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

    const checkHostStatus = async (retryCount = 0) => {
      try {
        const details = await roomApi.getRoomDetails(roomCode);
        if (user && details.hostUserId == user.id) {
          console.log("User is Host");
          setIsHost(true);
        } else {
          console.log(
            "Note: User is NOT host. HostID:",
            details.hostUserId,
            "UserID:",
            user.id
          );
        }
      } catch (error) {
        // Retry Loop for 404/500 (Race Condition Handling)
        if (
          retryCount < 2 &&
          error.response &&
          (error.response.status === 404 || error.response.status === 500)
        ) {
          console.warn(
            `Room fetch failed (Attempt ${retryCount + 1}). Retrying in 1s...`
          );
          setTimeout(() => checkHostStatus(retryCount + 1), 1000);
          return;
        }

        if (
          error.response &&
          (error.response.status === 404 || error.response.status === 500)
        ) {
          console.warn(
            "Room details fetch failed (Room might be closed/deleted)."
          );
          // Auto-redirect if room is dead
          alert("This room no longer exists.");
          navigate("/rooms");
        } else {
          console.error("Failed to fetch room details:", error);
        }
      }
    };
    checkHostStatus();

    if (!isConnected.current) {
      isConnected.current = true;
      connectSocket(
        roomCode,
        (newMessage) => {
          if (newMessage.type === "HOST_LEFT") {
            setHostLeft(true);
          } else {
            setMessages((prev) => [...prev, newMessage]);
          }
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
      <RoomHeader
        roomId={roomCode}
        user={user}
        onLogout={handleLogout}
        isHost={isHost}
      />
      <div className="room-container">
        {/* Host Left Overlay */}
        {hostLeft && (
          <div style={styles.overlay}>
            <div style={styles.overlayContent}>
              <h2>Room Closed</h2>
              <p>The host has left the room.</p>
              <div style={styles.countdown}>{countdown}</div>
              <p>Redirecting to lobby...</p>
              <button
                onClick={() => navigate("/rooms")}
                style={styles.overlayBtn}
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="video-section">
            <VideoPlayer roomCode={roomCode} />
          </div>
        </div>
        <div className="sidebar">
          <div className="sidebar">
            <div className="participants-section">
              {/* Pass profileMap to resolve names in the list */}
              <ParticipantList
                participants={participants}
                profileMap={profileMap}
              />
            </div>
            <div className="chat-section">
              {/* Pass profileMap to resolve names in chat bubbles */}
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
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)", //  Slightly more transparent
    backdropFilter: "blur(10px)", //  Blur Effect
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
  },
  overlayContent: {
    animation: "fadeIn 0.5s ease",
  },
  countdown: {
    fontSize: "5rem",
    fontWeight: "800",
    color: "#ef4444",
    margin: "20px 0",
  },
  overlayBtn: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#334155",
    color: "white",
    border: "1px solid #475569",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default RoomView;
