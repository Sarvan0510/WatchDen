import React from "react";
import { PencilSimpleIcon } from "@phosphor-icons/react";
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
        {/* Use large size for profile page */}
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
            padding: "10px 20px",
            backgroundColor: "#6366f1",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "background 0.2s",
          }}
        >
          <PencilSimpleIcon size={18} weight="bold" />
          Edit Profile
        </button>
      )}
    </div>
  );
};

export default ProfileCard;
