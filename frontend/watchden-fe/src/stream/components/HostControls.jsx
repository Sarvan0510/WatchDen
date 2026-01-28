import React from "react";
import { startStream, pauseStream, stopStream } from "../api/streamApi";

const HostControls = ({
  roomId,
  userId,
  videoRef,
  onStartMp4,
  onStartScreen,
  onStopScreen,
  broadcastControl,
}) => {
  const play = async () => {
    const time = videoRef.current?.currentTime || 0;
    await startStream({ roomId, userId, type: "MP4", source: "local" });
    broadcastControl("PLAY", time);
  };

  const pause = async () => {
    const time = videoRef.current?.currentTime || 0;
    await pauseStream({ roomId, userId, time });
    broadcastControl("PAUSE", time);
  };

  const stop = async () => {
    await stopStream({ roomId, userId });
    broadcastControl("STOP", 0);
  };

  return (
    <div style={barStyle}>
      <input
        type="file"
        accept="video/mp4"
        onChange={(e) => onStartMp4(e.target.files[0])}
      />

      <button onClick={play} style={btn}>▶</button>
      <button onClick={pause} style={btn}>⏸</button>
      <button onClick={stop} style={btn}>⏹</button>

      <button onClick={onStartScreen} style={btn}>Share</button>
      <button onClick={onStopScreen} style={btn}>Stop Share</button>
    </div>
  );
};

const barStyle = {
  padding: "12px",
  background: "#1f1f1f",
  display: "flex",
  gap: "10px",
  justifyContent: "center",
};

const btn = {
  background: "#c62828",
  border: "none",
  color: "white",
  padding: "6px 14px",
  borderRadius: "18px",
  cursor: "pointer",
};

export default HostControls;
