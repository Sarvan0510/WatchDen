import React, { useState } from "react";
import "./Avatar.css";

const Avatar = ({ src, name, size = "md" }) => {
  const [imgError, setImgError] = useState(false);

  // Helper: Get initials
  const getInitials = (fullName) => {
    if (!fullName) return "?";
    const parts = fullName.split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  };

  // Helper: Construct full URL
  const getFullUrl = (path) => {
    if (!path) return "";
    if (path.startsWith("http")) return path;

    // CRITICAL: Pointing directly to User Service (8084) for static files
    // because Gateway might not be configured to serve the "uploads" folder yet.
    return `http://localhost:8084${path}`;
  };

  if (src && !imgError) {
    return (
      <img
        src={getFullUrl(src)}
        alt={name}
        className={`avatar avatar-${size}`}
        onError={() => setImgError(true)}
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
