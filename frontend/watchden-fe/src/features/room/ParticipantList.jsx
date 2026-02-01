import React, { useState } from "react";
import "./room.css"; // Ensure it uses the styling
import Avatar from "../../components/Avatar"; // Import

const ParticipantList = ({ participants = [], profileMap = {} }) => {
  // 1. State to toggle visibility (Default: false = Collapsed)
  const [isOpen, setIsOpen] = useState(true); // Default open for better visibility

  return (
    <div className="participant-list-container">
      {/* 2. Clickable Header */}
      <div
        className="participant-toggle-header"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to toggle list"
      >
        <div className="toggle-label">
          <span className="icon-group">👥</span>
          <span className="label-text">Participants</span>
          <span className="badge-count">{participants.length}</span>
        </div>

        <div className="toggle-arrow">{isOpen ? "▲" : "▼"}</div>
      </div>

      {/* 3. The List (Only renders if isOpen is true) */}
      {isOpen && (
        <div className="participant-items-scroll">
          {participants.length === 0 ? (
            <div className="empty-state">No one else is here... yet.</div>
          ) : (
            participants.map((userId, index) => {
              // Ensure userId is a number for lookup
              const id = Number(userId);
              const profile = profileMap[id];
              const displayName =
                profile?.displayName || profile?.username || "Unknown User";

              // Avatar component handles the fallback logic internally
              return (
                <div
                  key={index}
                  className="participant-item"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "8px 0",
                  }}
                >
                  <Avatar
                    src={profile?.avatarUrl}
                    name={displayName}
                    size="sm"
                    className="participant-avatar-sm"
                  />
                  {/* 🟢 Simplified Layout: Avatar + Display Name side-by-side */}
                  <div
                    className="participant-info"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginLeft: "10px",
                    }}
                  >
                    <span
                      className="participant-name"
                      style={{ fontSize: "0.9rem", color: "#e2e8f0" }}
                    >
                      {displayName}
                    </span>
                  </div>
                  <span className="status-dot-online"></span>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
