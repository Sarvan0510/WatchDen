import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { roomApi } from "../api/room.api";
import { useAuth } from "../features/auth/useAuth";
import RoomHeader from "../features/room/RoomHeader";

const RoomJoinCreate = () => {
  const [activeTab, setActiveTab] = useState("create");
  const [roomName, setRoomName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const { user, logout } = useAuth(); // 🟢 Ensure logout is destructured from hook

  const handleCreate = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      if (!user) {
        setErrorMessage("You must be logged in!");
        return;
      }

      const roomRequest = {
        roomName: roomName,
        isPublic: isPublic,
        maxUsers: 10,
      };

      console.log("Sending Request:", roomRequest);

      const newRoom = await roomApi.createRoom(roomRequest);
      navigate(`/room/${newRoom.roomCode}`);
    } catch (error) {
      console.error("Create Room Failed", error);
      if (error.response && error.response.data) {
        setErrorMessage(`Error: ${JSON.stringify(error.response.data)}`);
      } else {
        setErrorMessage("Failed to create room.");
      }
    }
  };

  // 🔴 FIXED HANDLE JOIN FUNCTION
  const handleJoin = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    try {
      // Try to join the room API
      await roomApi.joinRoom(roomCode);
      // If successful, go to room
      navigate(`/room/${roomCode}`);
    } catch (error) {
      // 🟢 FIX: Check if the error is "409 Conflict" (Already Joined)
      // or if the error message mentions "already joined"
      const status = error.response?.status;
      const message = error.response?.data?.message || "";

      // Only navigate if explicitly "Already Joined"
      if (message.toLowerCase().includes("already joined")) {
        console.log("User already in room, navigating anyway...");
        navigate(`/room/${roomCode}`);
      } else {
        // Real error (Room Full, Room Not Found, etc.)
        console.error(error);
        setErrorMessage(message || "Invalid Room Code or Room Full");
      }
    }
  };

  return (
    <div style={styles.page}>
      {/* <RoomHeader
        roomId="Dashboard"
        user={user}
        onLogout={() => {
          logout(); // Call the auth hook's logout
          navigate("/login");
        }}
      /> */}

      <div className="join-create-container" style={styles.container}>
        {/* Tabs */}
        <div className="tabs" style={styles.tabContainer}>
          <button
            style={
              activeTab === "create" ? styles.activeTab : styles.inactiveTab
            }
            onClick={() => {
              setActiveTab("create");
              setErrorMessage("");
            }}
          >
            Create Room
          </button>
          <button
            style={activeTab === "join" ? styles.activeTab : styles.inactiveTab}
            onClick={() => {
              setActiveTab("join");
              setErrorMessage("");
            }}
          >
            Join by Code
          </button>
        </div>

        <div style={styles.card}>
          {errorMessage && (
            <div style={styles.error}>
              <span style={{ marginRight: "8px" }}>⚠️</span> {errorMessage}
            </div>
          )}

          {activeTab === "create" ? (
            <form onSubmit={handleCreate}>
              <h3 style={styles.cardTitle}>Create New Room</h3>

              <div className="form-group" style={styles.group}>
                <label style={styles.label}>Room Name</label>
                <input
                  type="text"
                  placeholder="e.g. Movie Night 🍿"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  required
                  minLength={3}
                  maxLength={25}
                  style={styles.input}
                />
              </div>

              <div className="form-group" style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  id="publicCheck"
                  style={styles.checkbox}
                />
                <label htmlFor="publicCheck" style={styles.checkboxLabel}>
                  Make Room Public (Visible in Lobby)
                </label>
              </div>

              <button type="submit" style={styles.submitBtn}>
                Create & Join
              </button>
            </form>
          ) : (
            <form onSubmit={handleJoin}>
              <h3 style={styles.cardTitle}>Join Existing Room</h3>
              <div className="form-group" style={styles.group}>
                <label style={styles.label}>Room Code</label>
                <input
                  type="text"
                  placeholder="Enter 8-digit Code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  required
                  style={styles.input}
                />
              </div>
              <button type="submit" style={styles.submitBtn}>
                Join Room
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// --- Styles matching the Landing/Login Aesthetic ---
const styles = {
  page: {
    minHeight: "100vh",
    backgroundColor: "#0f172a",
    backgroundImage: "radial-gradient(at top right, #1e1b4b 0%, #0f172a 100%)",
    color: "white",
  },
  container: {
    maxWidth: "450px",
    margin: "0 auto",
    padding: "60px 20px",
  },
  tabContainer: {
    display: "flex",
    backgroundColor: "#1e293b",
    padding: "6px",
    borderRadius: "12px",
    marginBottom: "24px",
    border: "1px solid #334155",
  },
  activeTab: {
    flex: 1,
    padding: "10px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  inactiveTab: {
    flex: 1,
    padding: "10px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.2s",
  },
  card: {
    backgroundColor: "#1e293b",
    padding: "32px",
    borderRadius: "16px",
    border: "1px solid #334155",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.3)",
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: "24px",
    fontSize: "1.4rem",
    fontWeight: "700",
    color: "#f1f5f9",
  },
  group: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    marginBottom: "8px",
    fontSize: "0.85rem",
    color: "#e2e8f0",
    fontWeight: "500",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    marginBottom: "24px",
    padding: "12px",
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    borderRadius: "8px",
  },
  checkbox: {
    width: "18px",
    height: "18px",
    marginRight: "12px",
    cursor: "pointer",
    accentColor: "#6366f1",
  },
  checkboxLabel: {
    cursor: "pointer",
    fontSize: "0.9rem",
    color: "#cbd5e1",
  },
  submitBtn: {
    width: "100%",
    padding: "14px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "700",
    cursor: "pointer",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    transition: "background-color 0.2s",
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.85rem",
    border: "1px solid rgba(239, 68, 68, 0.2)",
  },
};

export default RoomJoinCreate;
