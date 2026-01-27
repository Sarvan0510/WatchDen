import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../api/room.api";
import { useAuth } from "../features/auth/useAuth";

const RoomJoinCreate = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isPublic, setIsPublic] = useState(true); // Default to Public

  const navigate = useNavigate();
  const { user } = useAuth();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      if (!user) {
        alert("You must be logged in!");
        return;
      }

      // 🔴 MATCHING YOUR JAVA DTO EXACTLY
      const roomRequest = {
        roomName: roomName, // Matches private String roomName
        isPublic: isPublic, // Matches private Boolean isPublic
        maxUsers: 10, // Matches private Integer maxUsers (Defaulting to 10)
      };

      console.log("Sending Request:", roomRequest); // Debug log

      const newRoom = await roomApi.createRoom(roomRequest);
      navigate(`/room/${newRoom.roomCode}`);
    } catch (error) {
      console.error("Create Room Failed", error);
      // Optional: Check if the backend sent a specific validation message
      if (error.response && error.response.data) {
        alert(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        alert("Failed to create room.");
      }
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      await roomApi.joinRoom(roomCode);
      navigate(`/room/${roomCode}`);
    } catch (error) {
      alert("Invalid Room Code or Room Full");
    }
  };

  return (
    <div
      className="join-create-container"
      style={{ maxWidth: "400px", margin: "50px auto" }}
    >
      {/* Tabs */}
      <div className="tabs" style={{ display: "flex", marginBottom: "20px" }}>
        <button
          className={activeTab === "create" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("create")}
        >
          Create Room
        </button>
        <button
          className={activeTab === "join" ? "btn-primary" : "btn-secondary"}
          onClick={() => setActiveTab("join")}
          style={{ marginLeft: "10px" }}
        >
          Join by Code
        </button>
      </div>

      {activeTab === "create" ? (
        <form onSubmit={handleCreate}>
          <h3>Create New Room</h3>

          {/* Room Name Input */}
          <div className="form-group" style={{ marginBottom: "15px" }}>
            <label style={{ display: "block", marginBottom: "5px" }}>
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              required
              minLength={3} // UI Validation matching DTO
              maxLength={25} // UI Validation matching DTO
            />
          </div>

          {/* Public/Private Checkbox */}
          <div
            className="form-group"
            style={{
              marginBottom: "15px",
              display: "flex",
              alignItems: "center",
            }}
          >
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              id="publicCheck"
              style={{ width: "auto", marginRight: "10px" }}
            />
            <label htmlFor="publicCheck" style={{ cursor: "pointer" }}>
              Make Room Public
            </label>
          </div>

          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
          >
            Create & Join
          </button>
        </form>
      ) : (
        <form onSubmit={handleJoin}>
          <h3>Join Existing Room</h3>
          <input
            type="text"
            placeholder="Enter Room Code"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value)}
            required
            style={{ marginBottom: "10px" }}
          />
          <button
            type="submit"
            className="btn-primary"
            style={{ width: "100%" }}
          >
            Join Room
          </button>
        </form>
      )}
    </div>
  );
};

export default RoomJoinCreate;
