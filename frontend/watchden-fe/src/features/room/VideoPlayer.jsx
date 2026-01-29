import React, { useState, useEffect, useRef } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = ({ roomCode, stream, isHost }) => {
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=LXb3EKWsInQ");
  const [playing, setPlaying] = useState(false);
  const videoRef = useRef(null);

  // Auto-play WebRTC stream when it changes
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // If a WebRTC stream exists (Host is streaming), show the VIDEO tag
  if (stream) {
    return (
      <div className="player-wrapper" style={styles.wrapper}>
        <div style={styles.playerContainer}>
          {/* 🔴 LIVE STREAM VIEW */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            // 🟢 ENABLE CONTROLS FOR VIEWERS
            // Viewers get controls (Play/Pause/Vol), Host gets none (they use HostControls)
            controls={!isHost}
            muted={isHost} // Host mutes themselves to avoid echo
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
          {/* Overlay Badge */}
          <div style={styles.liveBadge}>🔴 LIVE</div>
        </div>
      </div>
    );
  }

  // Otherwise, show standard YouTube Player
  return (
    <div className="player-wrapper" style={styles.wrapper}>
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

      {/* Control Bar (Local YouTube Control) */}
      <div className="video-controls" style={styles.controlsBar}>
        <div style={styles.inputWrapper}>
          <span style={styles.inputIcon}>🔗</span>
          <input
            type="text"
            placeholder="Paste YouTube URL..."
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

const styles = {
  wrapper: {
    width: "100%",
    // height: "100%",  <-- REMOVE this line if you haven't already (from previous fix)
    flex: 1, // Allow flex growth
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#020617",
    borderRadius: "12px",
    overflow: "hidden",
    border: "1px solid #1e293b",
    position: "relative",
  },
  playerContainer: {
    flex: 1,
    width: "100%",
    backgroundColor: "black",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "0", // Important for Flexbox
  },
  liveBadge: {
    position: "absolute",
    top: "16px",
    left: "16px",
    backgroundColor: "#ef4444",
    color: "white",
    padding: "4px 12px",
    borderRadius: "20px",
    fontSize: "0.8rem",
    fontWeight: "bold",
    boxShadow: "0 2px 10px rgba(239, 68, 68, 0.5)",
    pointerEvents: "none", // Let clicks pass through to video
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
  inputIcon: { fontSize: "0.9rem", marginRight: "8px", opacity: 0.6 },
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
  },
  pauseBtn: {
    padding: "10px 20px",
    backgroundColor: "#334155",
    color: "#cbd5e1",
    border: "1px solid #475569",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
};

export default VideoPlayer;
