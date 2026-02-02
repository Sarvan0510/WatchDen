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

    // Pointing to Gateway (8080) which routes to User Service (via /api/users)
    // So that The backend can map /api/users/uploads/** to the physical file.
    return `http://localhost:8080/api/users${path}`;
  };

  // Reset error state when src changes
  React.useEffect(() => {
    setImgError(false);
  }, [src]);

  if (src && !imgError) {
    const fullUrl = getFullUrl(src);
    // console.log(`Avatar [${name}]: Trying to load:`, fullUrl);
    return (
      <img
        src={fullUrl}
        alt={name}
        className={`avatar avatar-${size}`}
        onError={(e) => {
          // console.error("Avatar failed to load:", fullUrl);
          setImgError(true);
        }}
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
