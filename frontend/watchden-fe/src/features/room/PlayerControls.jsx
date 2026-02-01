import React from "react";

const PlayerControls = ({
  isPlaying,
  currentTime,
  duration,
  onPlayPause,
  onStop,
  onSeek,
  onSkipForward, // 🟢 Restore missing prop
  onSkipBack,
  onGoToStart,
  onGoToEnd,
  isHost,
  // 🟢 NEW PROPS
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange
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
      {/* 🟢 SEEK BAR ROW (Visible to HOST ONLY) */}
      {isHost && (
        <div style={styles.seekContainer}>
          <span style={styles.timeText}>{formatTime(currentTime)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            value={currentTime}
            onChange={(e) => onSeek(Number(e.target.value))}
            style={{ ...styles.seekBar, cursor: "pointer", opacity: 1 }}
          />
          <span style={styles.timeText}>{formatTime(duration)}</span>
        </div>
      )}

      {/* 🟢 BUTTONS & VOLUME ROW */}
      <div style={styles.controlsRow}>
        {/* Play/Pause Group */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {isHost && (
            <>
              <button style={styles.btn} onClick={onGoToStart} title="Go to Start">|&lt;</button>
              <button style={styles.btn} onClick={onSkipBack} title="-10s">⏪</button>
              <button style={styles.stopBtn} onClick={onStop} title="Stop">⏹</button>
            </>
          )}

          {/* Play/Pause is for Host Only (Participants strictly sync) */}
          {isHost ? (
            <button style={styles.playBtn} onClick={onPlayPause}>
              {isPlaying ? "⏸" : "▶"}
            </button>
          ) : (
            <div style={{ ...styles.btn, width: "auto", padding: "0 10px", cursor: "default", opacity: 0.8, background: '#0f172a' }}>
              {isPlaying ? "▶ Watching" : "⏸ Paused"}
            </div>
          )}

          {isHost && (
            <>
              <button style={styles.btn} onClick={onSkipForward} title="+10s">⏩</button>
              <button style={styles.btn} onClick={onGoToEnd} title="Go to End">&gt;|</button>
            </>
          )}
        </div>

        {/* 🟢 VOLUME CONTROL (Right Side) - Viewers Only */}
        {!isHost && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
            <button style={{ ...styles.btn, width: '40px' }} onClick={onToggleMute} title={isMuted ? "Unmute" : "Mute"}>
              {isMuted ? "🔇" : "🔊"}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => onVolumeChange(Number(e.target.value))}
              style={{ width: '80px', accentColor: '#10b981', cursor: 'pointer' }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "12px",
    backgroundColor: "#1e293b",
    display: "flex",
    flexDirection: "column",
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
    accentColor: "#6366f1",
  },
  timeText: {
    minWidth: "40px",
    textAlign: "center",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between", // Spread Play controls and Volume
    alignItems: "center",
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
    backgroundColor: "#ef4444",
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
