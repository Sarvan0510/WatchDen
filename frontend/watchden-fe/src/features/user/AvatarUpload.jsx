import React, { useState, useRef } from "react";
import { CameraIcon } from "@phosphor-icons/react";
import { userApi } from "../../api/user.api";
import Avatar from "../../components/Avatar";

const AvatarUpload = ({ currentAvatar, username, onUploadSuccess }) => {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Handle file selection and upload process
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      setUploading(true);
      const updatedProfile = await userApi.uploadAvatar(file);

      if (onUploadSuccess) {
        onUploadSuccess(updatedProfile.avatarUrl);
      }
    } catch (error) {
      // console.error("Upload failed", error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.uploadContainer}>
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
          style={
            uploading
              ? { ...styles.btn, opacity: 0.7, cursor: "wait" }
              : styles.btn
          }
          onClick={() => fileInputRef.current.click()}
          disabled={uploading}
        >
          <CameraIcon size={20} weight="bold" />
          <span>{uploading ? "Uploading..." : "Change Photo"}</span>
        </button>
      </div>
    </div>
  );
};

const styles = {
  uploadContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "1.5rem",
  },
  btn: {
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "0.95rem",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
};

export default AvatarUpload;
