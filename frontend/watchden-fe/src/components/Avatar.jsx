import React, { useState } from "react";
import "./Avatar.css"; // We will add a few lines of CSS below

const Avatar = ({ src, name, size = "md" }) => {
  const [imgError, setImgError] = useState(false);

  // Helper: Get initials from name (e.g., "John Doe" -> "JD")
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Base URL for backend images (Ensure this matches your Gateway/Backend port)
  // If src is already a full URL (like http://...), this won't break it.
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;
    return `http://localhost:8084${path}`; // Pointing to User Service directly for now
  };

  // If image exists and hasn't failed, show Image. Otherwise, show Initials.
  if (src && !imgError) {
    return (
      <img
        src={getFullUrl(src)}
        alt={name}
        className={`avatar avatar-${size}`}
        onError={() => setImgError(true)} // Fallback if 404
      />
    );
  }

  return (
    <div className={`avatar avatar-placeholder avatar-${size}`}>
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
