import React from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../../api/room.api";
import "./room.css"; // Reuses the room styles

const RoomHeader = ({ roomId }) => {
  const navigate = useNavigate();

  const handleLeave = async () => {
    try {
      // Optional: Notify backend you are leaving
      // This is good practice but not strictly required if Socket handles disconnects
      const user = JSON.parse(localStorage.getItem("user"));
      if (user && user.id) {
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
    alert("Room Code copied to clipboard!");
  };

  return (
    <div
      className="room-header"
      style={{
        height: "60px",
        backgroundColor: "#252525",
        borderBottom: "1px solid #333",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 20px",
        color: "white",
      }}
    >
      <div className="room-info">
        <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>WatchDen</span>
        <span style={{ margin: "0 10px", color: "#666" }}>|</span>
        <span>
          Code:{" "}
          <code
            style={{
              background: "#333",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {roomId}
          </code>
        </span>
        <button
          onClick={copyCode}
          style={{
            marginLeft: "10px",
            fontSize: "0.8rem",
            padding: "2px 8px",
            background: "transparent",
            border: "1px solid #666",
            color: "#aaa",
            cursor: "pointer",
          }}
        >
          Copy
        </button>
      </div>

      <button
        className="btn-danger"
        onClick={handleLeave}
        style={{
          backgroundColor: "#ef4444",
          color: "white",
          border: "none",
          padding: "8px 16px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Leave Room
      </button>
    </div>
  );
};

export default RoomHeader;
