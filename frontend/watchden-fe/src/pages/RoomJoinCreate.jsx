import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/api";

export default function RoomJoinCreate() {
  const [roomName, setRoomName] = useState("");
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const createRoom = async () => {
    try {
      const res = await api.post("/rooms/create", {
        name: roomName,
        isPrivate: false,
      });
      navigate(`/rooms/${res.data.id}`);
    } catch {
      alert("Failed to create room");
    }
  };

  const joinRoom = async () => {
    try {
      await api.post("/rooms/join", { roomId });
      navigate(`/rooms/${roomId}`);
    } catch {
      alert("Failed to join room");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md bg-white p-6 rounded shadow space-y-6">
        {/* Create Room */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Create Room</h2>

          <input
            className="w-full border p-2 mb-3 rounded"
            placeholder="Room Name"
            value={roomName}
            onChange={(e) => setRoomName(e.target.value)}
          />

          <button
            onClick={createRoom}
            className="w-full bg-black text-white py-2 rounded"
          >
            Create
          </button>
        </div>

        <hr />

        {/* Join Room */}
        <div>
          <h2 className="text-lg font-semibold mb-3">Join Room</h2>

          <input
            className="w-full border p-2 mb-3 rounded"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <button onClick={joinRoom} className="w-full border py-2 rounded">
            Join
          </button>
        </div>
      </div>
    </div>
  );
}
