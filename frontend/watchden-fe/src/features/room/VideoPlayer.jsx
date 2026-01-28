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
    <div
      className="player-wrapper"
      style={{
        width: "100%",
        height: "100%",
        minHeight: "400px",
        background: "black",
      }}
    >
      <ReactPlayer
        url={url}
        playing={playing}
        controls={true}
        width="100%"
        height="100%"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Simple Control to Change Video */}
      <div
        className="video-controls"
        style={{ padding: "10px", background: "#222", color: "white" }}
      >
        <input
          type="text"
          placeholder="Paste YouTube URL"
          style={{ width: "70%", padding: "5px" }}
          onChange={(e) => setUrl(e.target.value)}
        />
        <button
          onClick={() => setPlaying(!playing)}
          style={{ marginLeft: "10px" }}
        >
          {playing ? "Pause" : "Play"}
        </button>
      </div>
    </div>
  );
};

export default VideoPlayer;
