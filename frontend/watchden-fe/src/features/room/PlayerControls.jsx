import React, { useState, useEffect } from "react";
import {
  Play,
  Pause,
  Stop,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  SpeakerX,
  FastForward,
  Rewind,
} from "@phosphor-icons/react";

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
  isHost,
  isMuted,
  volume,
  onToggleMute,
  onVolumeChange,
}) => {
  // Local state to handle dragging without flickering
  const [isDragging, setIsDragging] = useState(false);
  const [sliderValue, setSliderValue] = useState(currentTime);

  // Sync local slider with video time if not dragging
  useEffect(() => {
    if (!isDragging) {
      setSliderValue(currentTime);
    }
  }, [currentTime, isDragging]);

  // Handle User Dragging
  const handleSeekChange = (e) => {
    const val = Number(e.target.value);
    setSliderValue(val); // Update visual slider immediately
    onSeek(val); // Send seek command to video
  };

  const handleDragStart = () => setIsDragging(true);
  const handleDragEnd = () => setIsDragging(false);

  // Format Time: 65 -> 1:05
  const formatTime = (seconds) => {
    if (!seconds) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <div style={styles.container}>
      {/* Seek Bar (Host Only) */}
      {isHost && (
        <div style={styles.seekRow}>
          <span style={styles.timeText}>{formatTime(sliderValue)}</span>
          <input
            type="range"
            min="0"
            max={duration || 100}
            // Use local sliderValue instead of currentTime prop
            value={sliderValue || 0}
            onChange={handleSeekChange}
            // Detect Drag Events
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
            onTouchStart={handleDragStart}
            onTouchEnd={handleDragEnd}
            style={styles.seekBar}
          />
          <span style={styles.timeText}>{formatTime(duration)}</span>
        </div>
      )}

      {/* Controls Row */}
      <div style={styles.controlsRow}>
        {/* Left: Playback Controls */}
        <div style={styles.buttonGroup}>
          {isHost ? (
            <>
              {/* Host Actions */}
              <button
                style={styles.iconBtn}
                onClick={onGoToStart}
                title="Start"
              >
                <SkipBack weight="fill" size={20} />
              </button>
              <button style={styles.iconBtn} onClick={onSkipBack} title="-10s">
                <Rewind weight="fill" size={20} />
              </button>

              <button style={styles.playBtn} onClick={onPlayPause}>
                {isPlaying ? (
                  <Pause weight="fill" size={24} />
                ) : (
                  <Play weight="fill" size={24} />
                )}
              </button>

              <button style={styles.stopBtn} onClick={onStop} title="Stop">
                <Stop weight="fill" size={20} />
              </button>

              <button
                style={styles.iconBtn}
                onClick={onSkipForward}
                title="+10s"
              >
                <FastForward weight="fill" size={20} />
              </button>
              <button style={styles.iconBtn} onClick={onGoToEnd} title="End">
                <SkipForward weight="fill" size={20} />
              </button>
            </>
          ) : (
            // Participant View
            <div style={styles.statusBadge}>
              {isPlaying ? (
                <>
                  <Play weight="fill" size={16} />
                  <span>Watching</span>
                </>
              ) : (
                <>
                  <Pause weight="fill" size={16} />
                  <span>Paused</span>
                </>
              )}
            </div>
          )}
        </div>

        {/* Right: Volume (Everyone) */}
        <div style={styles.volumeGroup}>
          <button style={styles.iconBtn} onClick={onToggleMute}>
            {isMuted ? (
              <SpeakerX weight="fill" size={20} />
            ) : (
              <SpeakerHigh weight="fill" size={20} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={isMuted ? 0 : volume}
            onChange={(e) => onVolumeChange(Number(e.target.value))}
            style={styles.volumeSlider}
          />
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    backgroundColor: "rgba(30, 41, 59, 0.95)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    width: "100%",
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  seekRow: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#cbd5e1",
    fontSize: "0.85rem",
    fontWeight: "500",
  },
  timeText: {
    minWidth: "45px",
    textAlign: "center",
    fontVariantNumeric: "tabular-nums",
  },
  seekBar: {
    flex: 1,
    height: "4px",
    borderRadius: "2px",
    cursor: "pointer",
    accentColor: "#6366f1",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  buttonGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
  },
  iconBtn: {
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    padding: "8px",
    borderRadius: "8px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "background 0.2s, color 0.2s",
  },
  playBtn: {
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    width: "48px",
    height: "40px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 6px -1px rgba(99, 102, 241, 0.3)",
  },
  stopBtn: {
    backgroundColor: "#450a0a",
    color: "#fca5a5",
    border: "1px solid #7f1d1d",
    width: "40px",
    height: "40px",
    borderRadius: "10px",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  statusBadge: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 16px",
    backgroundColor: "#0f172a",
    borderRadius: "20px",
    border: "1px solid #334155",
    color: "#94a3b8",
    fontSize: "0.9rem",
    fontWeight: "600",
  },
  volumeGroup: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    backgroundColor: "#0f172a",
    padding: "4px 12px 4px 4px",
    borderRadius: "20px",
    border: "1px solid #334155",
  },
  volumeSlider: {
    width: "80px",
    height: "4px",
    cursor: "pointer",
    accentColor: "#10b981",
  },
};

export default PlayerControls;
