import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { notifyHostLeft } from "../../socket/roomSocket";
import { roomApi } from "../../api/room.api";
import { authUtils } from "../auth/auth.utils";
import Avatar from "../../components/Avatar"; // Import Avatar

const RoomHeader = ({ roomId, user: initialUser, isHost }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || authUtils.getUser());

  // Effect: Sync with Prop if Parent Updates
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Effect: Listen for user updates (e.g. avatar change)
  useEffect(() => {
    const handleUserUpdate = () => {
      console.log("RoomHeader: User updated event received");
      setUser(authUtils.getUser());
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLeave = async () => {
    try {
      if (roomId === "Lobby") {
        // Logout Logic handled by parent or just redirect
        navigate("/login");
        return;
      }

      // Host Leave Logic
      if (isHost) {
        const confirmLeave = window.confirm(
          "You are hosting a stream. Leaving will stop playback. Are you sure?"
        );
        if (!confirmLeave) return;

        // 1. Notify everyone
        console.log("📢 Host Leaving: Sending notification...");
        notifyHostLeft(roomId);

        // 2. Delay to ensure message propagates before room deletion
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Only navigate if leave was successful or initiated
      await roomApi.leaveRoom(roomId);
      navigate("/rooms");

    } catch (error) {
      console.error("Error leaving room:", error);

      // Still navigate if error is non - critical 
      navigate("/rooms");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    // Using a simple alert for now as per your logic
    alert("Room Code copied to clipboard!");
  };

  return (
    <div className="room-header" style={styles.header}>
      <div className="room-info" style={styles.infoSection}>
        {/* Brand Links to Lobby */}
        <Link to="/rooms" style={{ textDecoration: "none" }}>
          <span style={styles.logo}>
            Watch<span style={{ color: "#6366f1" }}>Den</span>
          </span>
        </Link>

        <div style={styles.divider}></div>

        {/* Profile Navigation Link with Avatar */}
        <Link to="/profile" style={styles.profileLink}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Avatar src={user?.avatarUrl} name={user?.username} size="sm" />
            <span>{user?.displayName || user?.username || "Profile"}</span>
          </div>
        </Link>

        {roomId !== "Lobby" && roomId !== "Dashboard" && (
          <>
            <div style={styles.divider}></div>
            <div style={styles.codeContainer}>
              <span style={styles.codeLabel}>ROOM</span>
              <code style={styles.codeValue}>{roomId}</code>
            </div>
          </>
        )}
      </div>

      <button
        className="btn-danger"
        onClick={handleLeave}
        style={styles.leaveBtn}
      >
        {roomId === "Lobby" ? "Logout" : "Leave Room"}
      </button>
    </div>
  );
};

// --- WatchDen Navigation Styles ---
const styles = {
  header: {
    height: "64px",
    backgroundColor: "#1e293b", // Slate 800
    borderBottom: "1px solid #334155",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 24px",
    color: "white",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    zIndex: 10,
  },
  infoSection: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  logo: {
    fontWeight: "800",
    fontSize: "1.25rem",
    letterSpacing: "-0.5px",
  },
  divider: {
    width: "1px",
    height: "24px",
    backgroundColor: "#334155",
  },
  codeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#0f172a", // Navy background for the code area
    padding: "6px 12px",
    borderRadius: "8px",
    border: "1px solid #334155",
  },
  codeLabel: {
    fontSize: "0.65rem",
    fontWeight: "700",
    color: "#64748b",
    letterSpacing: "0.5px",
  },
  codeValue: {
    fontFamily: "'JetBrains Mono', monospace",
    color: "#818cf8", // Indigo 400
    fontSize: "0.95rem",
    fontWeight: "600",
  },
  copyBtn: {
    fontSize: "0.7rem",
    padding: "2px 8px",
    backgroundColor: "#334155",
    border: "none",
    borderRadius: "4px",
    color: "#cbd5e1",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s",
  },
  leaveBtn: {
    backgroundColor: "#ef4444", // Red 500
    color: "white",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
  },
};

export default RoomHeader;
