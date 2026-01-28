import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { roomApi } from "../../api/room.api";

const RoomHeader = ({ roomId, user }) => {
  const navigate = useNavigate();

  const handleLeave = async () => {
    try {
      // Optional: Notify backend you are leaving
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        // 🟢 Logic preserved: roomId here is the roomCode string
        await roomApi.leaveRoom(roomId);
      }
    } catch (error) {
      console.error("Error leaving room:", error);
    } finally {
      navigate("/rooms");
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomId);
    // 🟢 Using a simple alert for now as per your logic
    alert("Room Code copied to clipboard!");
  };

  return (
    <div className="room-header" style={styles.header}>
      <div className="room-info" style={styles.infoSection}>
        {/* 🟢 Brand Links to Lobby */}
        <Link to="/rooms" style={{ textDecoration: "none" }}>
          <span style={styles.logo}>
            Watch<span style={{ color: "#6366f1" }}>Den</span>
          </span>
        </Link>

        <div style={styles.divider}></div>

        {/* 🟢 Profile Navigation Link */}
        <Link to="/profile" style={styles.profileLink}>
          👤 {user?.username || "Profile"}
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
