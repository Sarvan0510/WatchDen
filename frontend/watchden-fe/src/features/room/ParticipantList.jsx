import React from "react";
import Avatar from "../../components/Avatar";

const ParticipantList = ({ participants }) => {
  return (
    <div className="participant-list">
      <h3>Participants ({participants.length})</h3>
      <ul>
        {participants.length === 0 ? (
          <li style={{ color: "#ccc", fontStyle: "italic" }}>
            Waiting for others...
          </li>
        ) : (
          participants.map((user, idx) => (
            <li
              key={idx}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "8px",
              }}
            >
              <Avatar name={user.username} src={user.avatarUrl} size="sm" />
              <span>{user.username}</span>
            </li>
          ))
        )}
      </ul>
    </div>
  );
};

export default ParticipantList;
