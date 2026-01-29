import React from "react";

const PlayerControls = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  onSeek,
  onSkipForward,
  onSkipBack,
  onGoToStart,
  onGoToEnd,
}) => {
  // Helper to format time (e.g., 65s -> "1:05")
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={styles.container}>
      {/* 🟢 SEEK BAR ROW */}
      <div style={styles.seekContainer}>
        <span style={styles.timeText}>{formatTime(currentTime)}</span>
        <input
          type="range"
          min="0"
          max={duration || 100}
          value={currentTime}
          onChange={(e) => onSeek(Number(e.target.value))}
          style={styles.seekBar}
        />
        <span style={styles.timeText}>{formatTime(duration)}</span>
      </div>

      {/* 🟢 BUTTONS ROW */}
      <div style={styles.controlsRow}>
        <button style={styles.btn} onClick={onGoToStart} title="Go to Start">
          |&lt;
        </button>
        <button style={styles.btn} onClick={onSkipBack} title="-10s">
          ⏪
        </button>

        <button style={styles.stopBtn} onClick={onStop} title="Stop">
          ⏹
        </button>

        <button style={styles.playBtn} onClick={onPlayPause}>
          {isPlaying ? "⏸" : "▶"}
        </button>

        <button style={styles.btn} onClick={onSkipForward} title="+10s">
          ⏩
        </button>
        <button style={styles.btn} onClick={onGoToEnd} title="Go to End">
          &gt;|
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "12px",
    backgroundColor: "#1e293b",
    display: "flex",
    flexDirection: "column", // Stack slider above buttons
    gap: "10px",
    marginTop: "10px",
    borderRadius: "8px",
    borderTop: "1px solid #334155",
  },
  seekContainer: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    color: "#94a3b8",
    fontSize: "0.85rem",
  },
  seekBar: {
    flex: 1,
    cursor: "pointer",
    accentColor: "#6366f1", // Indigo color for slider
  },
  timeText: {
    minWidth: "40px",
    textAlign: "center",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "center",
    gap: "8px",
  },
  btn: {
    backgroundColor: "#334155",
    border: "1px solid #475569",
    color: "white",
    width: "40px",
    height: "35px",
    borderRadius: "6px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "1rem",
  },
  playBtn: {
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    width: "50px",
    height: "35px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1.2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  stopBtn: {
    backgroundColor: "#ef4444", // Red for Stop
    color: "white",
    border: "none",
    width: "40px",
    height: "35px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default PlayerControls;
