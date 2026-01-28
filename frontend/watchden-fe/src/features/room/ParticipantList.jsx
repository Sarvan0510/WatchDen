import React, { useState } from "react";
import "./room.css"; // Ensure it uses the styling

const ParticipantList = ({ participants = [] }) => {
  // 1. State to toggle visibility (Default: false = Collapsed)
  const [isOpen, setIsOpen] = useState(false);

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
            participants.map((user, index) => (
              <div key={index} className="participant-item">
                <span className="status-dot"></span>
                <span className="participant-name">
                  {/* Handle both string names or object names */}
                  {typeof user === "string" ? user : user.username || "Unknown"}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default ParticipantList;
