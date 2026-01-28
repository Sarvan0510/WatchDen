import React, { useState } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ roomCode }) => {
  // State to manage sync
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=LXb3EKWsInQ"); // Default video
  const [playing, setPlaying] = useState(false);

  // In a real implementation, you would emit socket events here:
  // onPlay={() => sendSocketEvent('PLAY')}
  // onPause={() => sendSocketEvent('PAUSE')}

  return (
    <div className="player-wrapper" style={styles.wrapper}>
      {/* 📺 Video Display Area */}
      <div style={styles.playerContainer}>
        <ReactPlayer
          url={url}
          playing={playing}
          controls={true}
          width="100%"
          height="100%"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        />
      </div>

      {/* 🛠 Control Bar (URL and Play/Pause) */}
      <div className="video-controls" style={styles.controlsBar}>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}>🔗</span>
          <input
            type="text"
            placeholder="Paste YouTube or Video URL..."
            value={url}
            style={styles.input}
            onChange={(e) => setUrl(e.target.value)}
          />
        </div>

        <button
          onClick={() => setPlaying(!playing)}
          style={playing ? styles.pauseBtn : styles.playBtn}
        >
          {playing ? "⏸ Pause" : "▶ Play"}
        </button>
      </div>
    </div>
  );
};

// --- WatchDen Cinema Styles ---
const styles = {
  wrapper: {
    width: "100%",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#020617", // Pure dark for immersion
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #1e293b",
  },
  playerContainer: {
    flex: 1,
    width: "100%",
    minHeight: "400px",
    backgroundColor: "black",
  },
  controlsBar: {
    padding: "16px 20px",
    backgroundColor: "#1e293b",
    display: "flex",
    alignItems: "center",
    gap: "12px",
    borderTop: "1px solid #334155",
  },
  inputWrapper: {
    flex: 1,
    display: "flex",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: "8px",
    padding: "4px 12px",
    border: "1px solid #334155",
  },
  inputIcon: {
    fontSize: "0.9rem",
    marginRight: "8px",
    opacity: 0.6,
  },
  input: {
    width: "100%",
    padding: "10px 0",
    backgroundColor: "transparent",
    border: "none",
    color: "white",
    fontSize: "0.9rem",
    outline: "none",
  },
  playBtn: {
    padding: "10px 20px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "100px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
    transition: "background 0.2s",
  },
  pauseBtn: {
    padding: "10px 20px",
    backgroundColor: "#334155",
    color: "#cbd5e1",
    border: "1px solid #475569",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    minWidth: "100px",
    transition: "all 0.2s",
  },
};

export default VideoPlayer;
