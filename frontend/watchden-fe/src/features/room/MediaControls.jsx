import React from "react";

const MediaControls = ({
  isCamOn,
  isMicOn,
  onToggleCam,
  onToggleMic,
  disabled,
}) => {
  return (
    <div style={styles.container}>
      {/* Camera Toggle */}
      <button
        style={{
          ...styles.btn,
          backgroundColor: isCamOn ? "#334155" : "#ef4444",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={onToggleCam}
        disabled={disabled}
      >
        {isCamOn ? "📷 On" : "📷 Off"}
      </button>

      {/* Mic Toggle */}
      <button
        style={{
          ...styles.btn,
          backgroundColor: isMicOn ? "#334155" : "#ef4444",
          opacity: disabled ? 0.5 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
        onClick={onToggleMic}
        disabled={disabled}
      >
        {isMicOn ? "🎤 On" : "🎤 Off"}
      </button>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    gap: "8px",
    marginTop: "8px",
    justifyContent: "center", // Center the buttons
  },
  btn: {
    padding: "4px 12px", // 🟢 Smaller padding
    borderRadius: "6px",
    color: "white",
    border: "none",
    fontSize: "0.8rem", // 🟢 Smaller font
    fontWeight: "600",
    minWidth: "70px",
    transition: "background-color 0.2s",
  },
};

export default MediaControls;
