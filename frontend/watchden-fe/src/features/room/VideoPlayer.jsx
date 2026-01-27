const VideoPlayer = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "black",
        position: "relative",
      }}
    >
      {/* Placeholder for future HLS Stream */}
      <h2 style={{ color: "#555" }}>Stream Unavailable</h2>
      <p style={{ position: "absolute", bottom: "20px", color: "#777" }}>
        Video Player Area
      </p>
    </div>
  );
};

export default VideoPlayer;
