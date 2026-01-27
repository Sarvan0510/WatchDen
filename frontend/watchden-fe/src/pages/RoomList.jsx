import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/api";

export default function RoomList() {
  const [rooms, setRooms] = useState([]);

  useEffect(() => {
    api
      .get("/rooms/public")
      .then((res) => setRooms(res.data))
      .catch(() => alert("Failed to load rooms"));
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded shadow p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Public Rooms</h2>

          <Link
            to="/rooms/join"
            className="bg-black text-white px-4 py-2 rounded text-sm"
          >
            Create / Join
          </Link>
        </div>

        {/* Room List */}
        {rooms.length === 0 ? (
          <p className="text-gray-500 text-sm">No public rooms available</p>
        ) : (
          <ul className="space-y-3">
            {rooms.map((room) => (
              <li
                key={room.id}
                className="border rounded p-3 flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{room.name}</p>
                  <p className="text-xs text-gray-500">Room ID: {room.id}</p>
                </div>

                <Link to={`/rooms/${room.id}`} className="text-sm underline">
                  Join
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
