const VideoGrid = ({ streams }) => (
  <div className="video-grid">
    {Object.entries(streams).map(([id, stream]) => (
      <video
        key={id}
        autoPlay
        playsInline
        ref={(v) => v && (v.srcObject = stream)}
      />
    ))}
  </div>
);

export default VideoGrid;
