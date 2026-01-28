import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { roomApi } from "../api/room.api";
import Loader from "../components/Loader";

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const data = await roomApi.getPublicRooms();
      setRooms(data);
    } catch (error) {
      console.error("Failed to fetch rooms", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="room-list-page">
      <div
        className="header"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2>Public Rooms</h2>
        <Link to="/rooms/create">
          <button className="btn-primary">+ Create Room</button>
        </Link>
      </div>

      <div
        className="room-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "20px",
          marginTop: "20px",
        }}
      >
        {rooms.length === 0 ? (
          <p>No active rooms found.</p>
        ) : (
          rooms.map((room) => (
            <div
              key={room.id}
              className="room-card"
              style={{
                border: "1px solid #ddd",
                padding: "15px",
                borderRadius: "8px",
              }}
            >
              <h3>{room.name}</h3>
              <p>
                Code: <strong>{room.roomCode}</strong>
              </p>
              <Link to={`/room/${room.roomCode}`}>
                <button style={{ width: "100%", marginTop: "10px" }}>
                  Join Room
                </button>
              </Link>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomList;
