import { useState } from "react";
import { useNavigate } from "react-router-dom";

const RoomJoinCreate = () => {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    if (!roomId.trim()) return;
    navigate(`/room/${roomId}`);
  };

  const handleCreate = () => {
    // In a real app, call Room Service to get a new ID
    const newId = "room-" + Math.floor(Math.random() * 10000);
    navigate(`/room/${newId}`);
  };

  return (
    <div
      className="join-container"
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        background: "#1a1a1a",
        color: "white",
        gap: "20px",
      }}
    >
      <h2>Join or Create a Room</h2>

      <div style={{ display: "flex", gap: "10px" }}>
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          style={{ padding: "10px", borderRadius: "4px", border: "none" }}
        />
        <button
          onClick={handleJoin}
          style={{
            padding: "10px 20px",
            background: "#28a745",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Join
        </button>
      </div>

      <span>OR</span>

      <button
        onClick={handleCreate}
        style={{
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Create New Room
      </button>
    </div>
  );
};

export default RoomJoinCreate;
