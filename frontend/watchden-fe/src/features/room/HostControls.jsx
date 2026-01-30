import React from "react";
import { streamApi } from "../../api/stream.api";

const HostControls = ({
  onStartMp4,
  onStartScreen,
  onStopScreen,
  onStartYoutube,
  fileInputRef,
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

      {/* YouTube Section */}
      <div style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
        <input
          type="text"
          placeholder="Paste YouTube Link..."
          style={styles.input}
          onKeyDown={(e) => {
            if (e.key === "Enter") onStartYoutube(e.target.value);
          }}
          id="yt-input"
        />
        <button
          style={{ ...styles.btn, flex: "0 0 auto", backgroundColor: "#ff0000", borderColor: "#cc0000" }}
          onClick={() => {
            const val = document.getElementById("yt-input").value;
            if (val) onStartYoutube(val);
          }}
        >
          ▶ Load YouTube
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
  input: {
    flex: 1,
    padding: "8px 12px",
    borderRadius: "6px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    color: "white",
    outline: "none"
  }
};

export default HostControls;
