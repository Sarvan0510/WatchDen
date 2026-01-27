import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../api/room.api";

const RoomJoinCreate = () => {
  const [activeTab, setActiveTab] = useState("create"); // 'create' or 'join'
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      // Calls POST /api/rooms
      const newRoom = await roomApi.createRoom({ name: roomName });
      navigate(`/room/${newRoom.roomCode}`); // Redirect to the new room
    } catch (error) {
      alert("Failed to create room");
    }
  };

  const handleJoin = async (e) => {
    e.preventDefault();
    try {
      // Calls POST /api/rooms/join/{code}
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
      <div className="tabs" style={{ display: "flex", marginBottom: "20px" }}>
        <button
          onClick={() => setActiveTab("create")}
          disabled={activeTab === "create"}
        >
          Create Room
        </button>
        <button
          onClick={() => setActiveTab("join")}
          disabled={activeTab === "join"}
        >
          Join by Code
        </button>
      </div>

      {activeTab === "create" ? (
        <form onSubmit={handleCreate}>
          <h3>Create New Room</h3>
          <input
            type="text"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
            required
          />
          <button type="submit" style={{ marginTop: "10px" }}>
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
          />
          <button type="submit" style={{ marginTop: "10px" }}>
            Join Room
          </button>
        </form>
      )}
    </div>
  );
};

export default RoomJoinCreate;
