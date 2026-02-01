import React, { useState } from "react";
import { FloppyDiskIcon, WarningIcon, XIcon } from "@phosphor-icons/react";
import { userApi } from "../../api/user.api";

const EditProfileForm = ({ currentProfile, onUpdateSuccess, onCancel }) => {
  const [displayName, setDisplayName] = useState(
    currentProfile?.displayName || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const updatedUser = await userApi.updateProfile({
        displayName,
      });
      onUpdateSuccess(updatedUser);
    } catch (err) {
      // console.error("Failed to update profile", err);
      const backendMessage =
        err.response?.data?.message ||
        "Something went wrong. Please try again.";
      setError(backendMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      {/* Error Banner */}
      {error && (
        <div style={styles.errorBanner}>
          <WarningIcon size={18} weight="bold" style={{ marginRight: "8px" }} />
          {error}
        </div>
      )}

      <div className="form-group" style={styles.group}>
        <label style={styles.label}>Display Name</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Enter display name"
          maxLength={50}
          style={styles.input}
          required
        />
        <p style={styles.hint}>
          This is how your name will appear in chat rooms.
        </p>
      </div>

      <div className="button-group" style={styles.btnGroup}>
        <button
          type="submit"
          disabled={loading}
          style={loading ? { ...styles.saveBtn, opacity: 0.7 } : styles.saveBtn}
        >
          <FloppyDiskIcon size={18} weight="bold" />
          {loading ? "Saving..." : "Save Changes"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          style={styles.cancelBtn}
          disabled={loading}
        >
          <XIcon size={18} weight="bold" />
          Cancel
        </button>
      </div>
    </form>
  );
};

const styles = {
  form: {
    width: "100%",
    animation: "fadeIn 0.3s ease",
  },
  group: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#94a3b8",
    fontSize: "0.8rem",
    fontWeight: "600",
    marginBottom: "8px",
    textTransform: "uppercase",
    letterSpacing: "0.05em",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  hint: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "8px",
  },
  btnGroup: {
    display: "flex",
    gap: "12px",
    marginTop: "24px",
  },
  saveBtn: {
    flex: 2,
    padding: "12px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  cancelBtn: {
    flex: 1,
    padding: "12px",
    backgroundColor: "transparent",
    color: "#94a3b8",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background 0.2s",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
  },
  errorBanner: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "10px 14px",
    borderRadius: "8px",
    marginBottom: "16px",
    fontSize: "0.85rem",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    animation: "shake 0.2s ease-in-out",
    display: "flex",
    alignItems: "center",
  },
};

export default EditProfileForm;
