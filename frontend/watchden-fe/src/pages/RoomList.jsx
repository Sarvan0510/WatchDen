import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { roomApi } from "../api/room.api";
import Loader from "../components/Loader";
import RoomHeader from "../features/room/RoomHeader";
import { authUtils } from "../features/auth/auth.utils"; // Import your Utils

const RoomList = () => {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Initialize State DIRECTLY from authUtils
  // This reads from storage instantly before the page even paints.
  const [user, setUser] = useState(() => authUtils.getUser());

  const navigate = useNavigate();

  useEffect(() => {
    // 1. Safety Check (Optional but good)
    const storedUser = authUtils.getUser();
    if (storedUser && !user) {
      setUser(storedUser);
    }

    // 2. Fetch Rooms Logic
    const fetchRooms = async (isPolling = false) => {
      try {
        if (!isPolling) setLoading(true); // Only show spinner on initial load
        const data = await roomApi.getPublicRooms();
        setRooms(data);
      } catch (error) {
        console.error("Failed to fetch rooms", error);
      } finally {
        if (!isPolling) setLoading(false);
      }
    };

    // Initial Fetch
    fetchRooms();

    // 3. Polling Interval (Every 3 seconds)
    const intervalId = setInterval(() => {
      fetchRooms(true); // Silent update
    }, 3000);

    // Cleanup
    return () => clearInterval(intervalId);
  }, []); // Run once on mount (interval persists)

  const handleLogout = () => {
    // Use your hook or utils to logout
    authUtils.clearAuth();
    setUser(null);
    navigate("/login");
  };

  if (loading) return <Loader fullScreen />;

  return (
    <div className="room-list-page" style={styles.page}>
      {/* Header Removed to avoid double navigation and "Leave Room" glitch in Lobby */}

      <div className="content-container" style={styles.container}>
        {/* Actions Bar */}
        <div className="header-actions" style={styles.actionHeader}>
          <div>
            <h2 style={styles.title}>Active Public Rooms</h2>
            <p style={styles.subtitle}>Join a theater and start watching</p>
          </div>
          <Link to="/rooms/create" style={{ textDecoration: "none" }}>
            <button className="btn-primary" style={styles.createBtn}>
              + Create New Room
            </button>
          </Link>
        </div>

        {/* Room Grid */}
        <div className="room-grid" style={styles.grid}>
          {rooms.length === 0 ? (
            <div style={styles.emptyState}>
              <p style={{ margin: 0 }}>
                No active public rooms found. Be the first to start one!
              </p>
            </div>
          ) : (
            rooms.map((room) => (
              <div key={room.id} className="room-card" style={styles.card}>
                <div style={styles.cardHeader}>
                  <h3 style={styles.roomName}>
                    {room.roomName || room.name || "Untitled Room"}
                  </h3>
                  <div style={styles.liveIndicator}>
                    <span style={styles.liveDot}></span> LIVE
                  </div>
                </div>

                <div style={styles.cardBody}>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Room Code</span>
                    <strong style={styles.codeText}>{room.roomCode}</strong>
                  </div>
                  <div style={styles.infoRow}>
                    <span style={styles.label}>Participants</span>
                    <span style={styles.userText}>
                      👥 {room.participantCount || 0} / {room.maxUsers}
                    </span>
                  </div>
                </div>

                <Link
                  to={`/room/${room.roomCode}`}
                  style={{ textDecoration: "none" }}
                >
                  <button style={styles.joinBtn}>Join Room</button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// --- WatchDen Modern UI Styles ---
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    backgroundImage: "radial-gradient(at top left, #1e1b4b 0%, #0f172a 100%)",
    color: "white",
  },
  container: {
    padding: "40px 20px",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  actionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginBottom: "30px",
    borderBottom: "1px solid #1e293b",
    paddingBottom: "20px",
  },
  title: {
    margin: 0,
    fontSize: "1.75rem",
    fontWeight: "700",
    color: "#f8fafc",
  },
  subtitle: {
    margin: "4px 0 0 0",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  createBtn: {
    padding: "12px 24px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "700",
    transition: "all 0.2s ease",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
  grid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
    gap: "24px",
  },
  card: {
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    padding: "24px",
    borderRadius: "12px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.2)",
    transition: "transform 0.2s ease",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: "20px",
  },
  roomName: {
    margin: 0,
    fontSize: "1.1rem",
    color: "#f1f5f9",
    fontWeight: "600",
  },
  liveIndicator: {
    fontSize: "0.65rem",
    fontWeight: "800",
    color: "#22c55e",
    display: "flex",
    alignItems: "center",
    gap: "5px",
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    padding: "4px 8px",
    borderRadius: "10px",
  },
  liveDot: {
    width: "6px",
    height: "6px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    boxShadow: "0 0 8px #22c55e",
  },
  cardBody: {
    marginBottom: "24px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "10px",
    fontSize: "0.9rem",
  },
  label: {
    color: "#64748b",
  },
  codeText: {
    color: "#818cf8",
    fontFamily: "monospace",
  },
  userText: {
    color: "#cbd5e1",
  },
  joinBtn: {
    width: "100%",
    padding: "12px",
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    color: "#818cf8",
    border: "1px solid rgba(99, 102, 241, 0.3)",
    borderRadius: "8px",
    fontSize: "0.95rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  emptyState: {
    gridColumn: "1 / -1",
    textAlign: "center",
    padding: "50px",
    color: "#64748b",
    border: "2px dashed #334155",
    borderRadius: "12px",
    fontStyle: "italic",
  },
};

export default RoomList;
