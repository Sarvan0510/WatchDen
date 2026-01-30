import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = forwardRef(({ roomCode, stream, isHost, mediaName, isMp4, onPlay }, ref) => {
  // --- 1. HOOKS & STATE (Must be at the top) ---
  const [url, setUrl] = useState("https://www.youtube.com/watch?v=LXb3EKWsInQ");
  const [playing, setPlaying] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);

  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Ref for the native video element
  const videoRef = useRef(null);

  // --- 2. EFFECTS ---

  // Show overlay when mediaName changes, hide after 3s
  useEffect(() => {
    if (mediaName) {
      setShowOverlay(true);
      const timer = setTimeout(() => setShowOverlay(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [mediaName]);

  // 🟢 Internal Helper for Snap-to-Live
  const jumpToLiveInternal = () => {
    const vid = videoRef.current;
    if (vid && vid.buffered.length > 0) {
      // Jump to the very end of the buffered range (Live Edge)
      try {
        vid.currentTime = vid.buffered.end(vid.buffered.length - 1);
      } catch (e) {
        console.log("Jump to live failed", e);
      }
    }
  };

  // Expose methods to Parent via Ref
  useImperativeHandle(ref, () => ({
    pause: () => {
      if (videoRef.current) videoRef.current.pause();
    },
    play: () => {
      if (videoRef.current) videoRef.current.play().catch(e => console.log("Play interrupted", e));
    },
    seek: (time) => {
      if (videoRef.current) videoRef.current.currentTime = time;
    },
    jumpToLive: jumpToLiveInternal // Use the internal function
  }));

  const [isValidStream, setIsValidStream] = useState(true);

  // Auto-play WebRTC stream when it changes
  useEffect(() => {
    const vid = videoRef.current;

    // 🟢 Reset valid state to TRUE whenever the stream reference updates
    console.log("🎥 VideoPlayer Effect: Stream changed:", stream?.id);
    setIsValidStream(!!stream);

    if (stream) {
      const track = stream.getVideoTracks()[0];

      const handleTrackEnded = () => {
        console.log("❌ Stream Track Ended");
        setIsValidStream(false);
      };

      if (track) {
        track.addEventListener("ended", handleTrackEnded);

        // Check immediate state
        if (track.readyState === "ended") {
          console.warn("⚠️ Stream Track is already ENDED on mount");
          setIsValidStream(false);
        } else {
          setIsValidStream(true); // Confirm it is valid
        }
      }

      console.log("🎥 Attaching Stream:", stream.id);
      if (vid) {
        vid.srcObject = stream;
        // Try to play. If browser blocks it (Autoplay Policy), show the "Click to Play" button.
        vid.play().catch(e => {
          console.error("Autoplay failed", e);
          if (e.name === "NotAllowedError") {
            setShowPlayOverlay(true);
          }
        });
      }

      return () => {
        if (track) {
          track.removeEventListener("ended", handleTrackEnded);
        }
      };
    }
  }, [stream]);

  // --- 3. RENDER ---

  // 🟢 Waiting for Stream / Stream Disconnected
  if (isMp4 && (!stream || !isValidStream)) {
    return (
      <div className="player-wrapper" style={styles.wrapper}>
        {/* Blurred Background with Message */}
        <div style={{
          ...styles.playerContainer,
          color: 'white',
          backgroundColor: '#000',
          backgroundImage: 'url(/assets/placeholder_blur.jpg)', // Optional: You could use a generic poster if available
          backgroundSize: 'cover'
        }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(15px)',
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '15px'
          }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center' }}>
              🚫 Video Removed by Host
            </h2>
            <p style={{ color: '#94a3b8' }}>Waiting for host to resume...</p>
          </div>
        </div>
      </div>
    );
  }

  // If a WebRTC stream exists (Host is streaming), show the VIDEO tag
  if (stream && isValidStream) {
    return (
      <div className="player-wrapper" style={styles.wrapper}>
        <div style={styles.playerContainer}>
          {/* 🔴 LIVE STREAM VIEW */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            // 🟢 ENABLE CONTROLS FOR VIEWERS
            // Viewers get controls (Play/Pause/Vol) ONLY if it's a Movie, not for Camera
            controls={!isHost && isMp4}
            onPlay={onPlay} // Attach onPlay listener
            muted={isHost} // Host mutes themselves to avoid echo
            style={{ width: "100%", height: "100%", objectFit: "contain" }}
          />
          {/* Overlay Badge */}
          <div style={styles.liveBadge}>🔴 LIVE</div>

          {/* 🟢 Click to Play Overlay (Fixes NotAllowedError) */}
          {showPlayOverlay && (
            <div style={styles.playOverlay}>
              <button
                style={styles.bigPlayBtn}
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.play();
                    setShowPlayOverlay(false);
                    // Also jump to live to ensure sync
                    jumpToLiveInternal();
                  }
                }}
              >
                ▶ Click to Watch
              </button>
            </div>
          )}

          {/* 🟢 Media Name Overlay (Thumbnail effect) */}
          {showOverlay && mediaName && (
            <div style={styles.mediaOverlay}>
              🎥 Playing: {mediaName}
            </div>
          )}
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
});

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
  mediaOverlay: {
    position: "absolute",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    backgroundColor: "rgba(0,0,0,0.7)",
    color: "white",
    padding: "8px 16px",
    borderRadius: "20px",
    fontSize: "0.9rem",
    pointerEvents: "none",
  },
  playOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
  },
  bigPlayBtn: {
    padding: "16px 32px",
    fontSize: "1.5rem",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "bold",
    boxShadow: "0 4px 20px rgba(0,0,0,0.5)",
    transition: "transform 0.2s",
  },
};

export default VideoPlayer;
