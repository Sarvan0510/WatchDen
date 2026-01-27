import React, { useState, useRef } from "react";
import { userApi } from "../../api/user.api";
import Avatar from "../../components/Avatar";

const AvatarUpload = ({ currentAvatar, username, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      setUploading(true);
      // Calls userApi.uploadAvatar -> Gateway -> User Service
      const updatedProfile = await userApi.uploadAvatar(file);

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
    <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
      <Avatar src={currentAvatar} name={username} size="lg" />

      <div className="controls">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }}
          accept="image/*"
        />
        <button
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Change Photo"}
        </button>
      </div>
    </div>
  );
};

export default AvatarUpload;
