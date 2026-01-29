import React from "react";
import { streamApi } from "../../api/stream.api";

const HostControls = ({
  onStartMp4,
  onStartScreen,
  onStopScreen,
  fileInputRef, // Passed from parent
}) => {
  return (
    <div style={styles.container}>
      <h3 style={styles.title}>Host Controls</h3>
      <div style={styles.controls}>
        {/* Hidden File Input */}
        <input
          type="file"
          accept="video/mp4"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => onStartMp4(e.target.files[0])}
        />

        <button style={styles.btn} onClick={() => fileInputRef.current.click()}>
          🎬 Play MP4 File
        </button>
        <button style={styles.btn} onClick={onStartScreen}>
          🖥️ Share Screen
        </button>
        <button
          style={{ ...styles.btn, ...styles.stopBtn }}
          onClick={onStopScreen}
        >
          ⏹ Stop Sharing
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    backgroundColor: "#1e293b",
    borderRadius: "8px",
    marginTop: "12px",
    border: "1px solid #334155",
  },
  title: {
    color: "#94a3b8",
    fontSize: "0.8rem",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  },
  controls: {
    display: "flex",
    gap: "10px",
  },
  btn: {
    backgroundColor: "#334155",
    color: "white",
    border: "1px solid #475569",
    padding: "8px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.9rem",
    flex: 1,
  },
  stopBtn: {
    backgroundColor: "#7f1d1d",
    borderColor: "#991b1b",
    color: "#fecaca",
  },
};

export default HostControls;
