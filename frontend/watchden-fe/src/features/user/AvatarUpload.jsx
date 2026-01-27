import React, { useState, useRef } from "react";
import { userApi } from "../../api/user.api";
import Avatar from "../../components/Avatar"; // Reusing the component above

const AvatarUpload = ({ currentAvatar, username, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 1. Simple Validation
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }
    // Limit to 2MB
    if (file.size > 2 * 1024 * 1024) {
      alert("File size must be less than 2MB");
      return;
    }

    try {
      setUploading(true);

      // 2. Call API
      // Note: We assume your api.js handles the X-User-Id header logic
      // or you pass it explicitly here depending on your auth setup.
      const updatedProfile = await userApi.uploadAvatar(file);

      // 3. Notify Parent
      if (onUploadSuccess) {
        onUploadSuccess(updatedProfile.avatarUrl);
      }
    } catch (error) {
      console.error("Upload failed", error);
      alert("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div
      className="avatar-upload-container"
      style={{ display: "flex", alignItems: "center", gap: "1rem" }}
    >
      {/* The Visual Display */}
      <Avatar src={currentAvatar} name={username} size="lg" />

      {/* The Controls */}
      <div className="controls">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }} // Hide the ugly default input
          accept="image/*"
        />

        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
          className="btn-upload" // Add your own styling class
        >
          {uploading ? "Uploading..." : "Change Photo"}
        </button>
      </div>
    </div>
  );
};

export default AvatarUpload;
