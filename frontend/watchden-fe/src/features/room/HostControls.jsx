import React from "react";
import {
  FileVideo,
  MonitorPlay,
  XCircle,
  YoutubeLogo,
  Play,
} from "@phosphor-icons/react";

const HostControls = ({
  onStartMp4,
  onStartScreen,
  onStopScreen,
  onStartYoutube,
  fileInputRef,
}) => {
  return (
    /* 🟢 NO controlZone wrapper here. Just the panel. */
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h3 style={styles.title}>Stream Controls</h3>
        <span style={styles.badge}>ADMIN</span>
      </div>

      {/* Main Controls Grid */}
      <div style={styles.controlsGrid}>
        <input
          type="file"
          accept="video/mp4"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={(e) => onStartMp4(e.target.files[0])}
        />

        <button style={styles.btn} onClick={() => fileInputRef.current.click()}>
          <FileVideo size={20} weight="fill" />
          <span>Play MP4</span>
        </button>

        <button style={styles.btn} onClick={onStartScreen}>
          <MonitorPlay size={20} weight="fill" />
          <span>Screen</span>
        </button>

        <button
          style={{ ...styles.btn, ...styles.stopBtn }}
          onClick={onStopScreen}
        >
          <XCircle size={20} weight="fill" />
          <span>Stop</span>
        </button>
      </div>

      {/* YouTube Section */}
      <div style={styles.youtubeContainer}>
        <div style={styles.inputGroup}>
          <YoutubeLogo
            size={24}
            color="#ef4444"
            weight="fill"
            style={styles.ytIcon}
          />
          <input
            type="text"
            placeholder="Paste YouTube Link..."
            style={styles.inputRaw}
            onKeyDown={(e) => {
              if (e.key === "Enter") onStartYoutube(e.target.value);
            }}
            id="yt-input"
          />
        </div>

        <button
          style={styles.playBtn}
          onClick={() => {
            const val = document.getElementById("yt-input").value;
            if (val) onStartYoutube(val);
          }}
        >
          <Play size={16} weight="fill" />
        </button>
      </div>
    </div>
  );
};

const styles = {
  // 🟢 REMOVED: controlZone, position: absolute, bottom: 0
  // Now it's just a card style:
  container: {
    padding: "16px",
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
    width: "100%",
    // It will fill the width of the parent container in RoomView
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "12px",
  },
  title: {
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "1px",
    margin: 0,
  },
  badge: {
    backgroundColor: "#334155",
    color: "#e2e8f0",
    fontSize: "10px",
    padding: "3px 8px",
    borderRadius: "4px",
    fontWeight: "600",
  },
  controlsGrid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr 1fr",
    gap: "12px",
    marginBottom: "12px",
  },
  btn: {
    height: "44px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    backgroundColor: "#334155",
    color: "#f1f5f9",
    border: "1px solid rgba(255,255,255,0.05)",
    borderRadius: "10px",
    cursor: "pointer",
    fontSize: "13px",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  stopBtn: {
    backgroundColor: "#450a0a",
    borderColor: "#7f1d1d",
    color: "#fca5a5",
  },
  youtubeContainer: {
    display: "flex",
    gap: "10px",
    height: "44px",
  },
  inputGroup: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "10px",
    paddingLeft: "12px",
    transition: "border-color 0.2s",
  },
  ytIcon: {
    flexShrink: 0,
    marginRight: "10px",
  },
  inputRaw: {
    flex: 1,
    height: "100%",
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "13px",
    outline: "none",
    paddingRight: "12px",
  },
  playBtn: {
    width: "44px",
    height: "100%",
    backgroundColor: "#dc2626",
    color: "white",
    border: "none",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  },
};

export default HostControls;
