import React from "react";
import Avatar from "../../components/Avatar";

const ProfileCard = ({ user, onEdit }) => {
  if (!user) return null;

  return (
    <div
      className="profile-card"
      style={{
        backgroundColor: "white",
        padding: "2rem",
        borderRadius: "8px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        textAlign: "center",
        maxWidth: "400px",
        margin: "0 auto",
      }}
    >
      <div
        style={{
          marginBottom: "1rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {/* We use the large size for the profile page */}
        <Avatar src={user.avatarUrl} name={user.username} size="lg" />
      </div>

      <h2 style={{ margin: "0.5rem 0" }}>
        {user.displayName || user.username}
      </h2>
      <p style={{ color: "#666", marginBottom: "1.5rem" }}>@{user.username}</p>

      {onEdit && (
        <button
          onClick={onEdit}
          style={{
            padding: "8px 16px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Edit Profile
        </button>
      )}
    </div>
  );
};

export default ProfileCard;
