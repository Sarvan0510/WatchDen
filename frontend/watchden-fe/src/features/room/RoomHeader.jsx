import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { SignOut, Check, Copy } from "@phosphor-icons/react";
import { notifyHostLeft } from "../../socket/roomSocket";
import { roomApi } from "../../api/room.api";
import { authUtils } from "../auth/auth.utils";
import Avatar from "../../components/Avatar";

const RoomHeader = ({
  roomId,
  user: initialUser,
  isHost,
  disableProfileLink,
}) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser || authUtils.getUser());
  const [copied, setCopied] = useState(false);

  // Sync with Prop if Parent Updates
  useEffect(() => {
    if (initialUser) {
      setUser(initialUser);
    }
  }, [initialUser]);

  // Listen for user updates
  useEffect(() => {
    const handleUserUpdate = () => {
      // console.log("RoomHeader: User updated event received");
      setUser(authUtils.getUser());
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLeave = async () => {
    try {
      if (roomId === "Lobby") {
        navigate("/login");
        return;
      }

      // Host Leave Logic
      if (isHost) {
        const confirmLeave = window.confirm(
          "You are hosting a stream. Leaving will stop playback. Are you sure?"
        );
        if (!confirmLeave) return;

        // console.log("Host Leaving: Sending notification...");
        notifyHostLeft(roomId);

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }

      await roomApi.leaveRoom(roomId);
      navigate("/rooms");
    } catch (error) {
      // console.error("Error leaving room:", error);
      navigate("/rooms");
    }
  };

  // Copy Function with Icon Feedback
  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    // Reset icon back to copy after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="room-header" style={styles.header}>
      <div className="room-info" style={styles.infoSection}>
        <span style={styles.logo}>
          Watch<span style={{ color: "#6366f1" }}>Den</span>
        </span>

        {!disableProfileLink && <div style={styles.divider}></div>}

        {!disableProfileLink && (
          <Link to="/profile" style={styles.profileLink}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Avatar src={user?.avatarUrl} name={user?.username} size="sm" />
              <span style={{ color: "white", textDecoration: "none" }}>
                {user?.displayName || user?.username || "Profile"}
              </span>
            </div>
          </Link>
        )}

        {roomId !== "Lobby" && roomId !== "Dashboard" && (
          <>
            <div style={styles.divider}></div>
            <div style={styles.codeContainer}>
              <span style={styles.codeLabel}>ROOM</span>
              <code style={styles.codeValue}>{roomId}</code>
              {/* Copy Button Icon */}
              <button
                onClick={copyCode}
                style={styles.iconBtn}
                title="Copy Room Code"
              >
                {copied ? (
                  <Check size={18} color="#4ade80" weight="bold" />
                ) : (
                  <Copy size={18} color="#94a3b8" />
                )}
              </button>
            </div>
          </>
        )}
      </div>

      <button
        className="btn-danger"
        onClick={handleLeave}
        style={styles.leaveBtn}
      >
        {/* Exit Icon */}
        <SignOut size={20} weight="bold" />
        <span>{roomId === "Lobby" ? "Logout" : "Leave Room"}</span>
      </button>
    </div>
  );
};

const styles = {
  header: {
    height: "64px",
    backgroundColor: "#1e293b",
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
  profileLink: {
    textDecoration: "none",
  },
  codeContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    backgroundColor: "#0f172a",
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
    color: "#818cf8",
    fontSize: "0.95rem",
    fontWeight: "600",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    borderRadius: "4px",
    transition: "background-color 0.2s",
  },
  leaveBtn: {
    backgroundColor: "#ef4444",
    color: "white",
    border: "none",
    padding: "8px 18px",
    borderRadius: "8px",
    fontSize: "0.9rem",
    fontWeight: "700",
    cursor: "pointer",
    transition: "background-color 0.2s",
    boxShadow: "0 4px 6px -1px rgba(239, 68, 68, 0.2)",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default RoomHeader;
