import React, { memo } from "react";

const VideoTile = memo(({ stream }) => (
  <video
    autoPlay
    playsInline
    ref={(v) => v && (v.srcObject = stream)}
    style={{ width: "100%", background: "black" }}
  />
));

const VideoGrid = ({ streams }) => (
  <div
    className="video-grid"
    style={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
      gap: "8px",
    }}
  >
    {Object.entries(streams).map(([id, stream]) => (
      <VideoTile key={id} stream={stream} />
    ))}
  </div>
);

export default VideoGrid;
