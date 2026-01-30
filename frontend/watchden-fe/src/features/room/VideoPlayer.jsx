import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
import ReactPlayer from "react-player";

const VideoPlayer = forwardRef(({ roomCode, stream, isHost, mediaName, isMp4, isYoutube, youtubeUrl, isPlaying, onPlay }, ref) => {
  // --- 1. HOOKS & STATE (Must be at the top) ---
  console.log("🎥 VideoPlayer Render:", { isYoutube, youtubeUrl, isMp4, streamId: stream?.id, isPlaying });
  const [playing, setPlaying] = useState(isPlaying || false); // Initialize from prop

  // Sync prop changes to local state
  useEffect(() => {
    setPlaying(isPlaying);
  }, [isPlaying]);

  const [showOverlay, setShowOverlay] = useState(false);
  const [showPlayOverlay, setShowPlayOverlay] = useState(false);

  // Ref for the native video element
  const videoRef = useRef(null);
  // Ref for ReactPlayer (YouTube)
  const reactPlayerRef = useRef(null);

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
      if (isYoutube && reactPlayerRef.current) {
        setPlaying(false); // Update ReactPlayer playing prop proxy
      } else if (videoRef.current) {
        videoRef.current.pause();
      }
    },
    play: () => {
      if (isYoutube && reactPlayerRef.current) {
        setPlaying(true);
      } else if (videoRef.current) {
        videoRef.current.play().catch(e => console.log("Play interrupted", e));
      }
    },
    seek: (time) => {
      if (isYoutube && reactPlayerRef.current) {
        reactPlayerRef.current.seekTo(time, "seconds");
      } else if (videoRef.current) {
        videoRef.current.currentTime = time;
      }
    },
    // YouTube doesn't really have "Jump to Live" in this context unless it's a livestream, 
    // but for MP4 we use the internal helper.
    jumpToLive: jumpToLiveInternal
  }));

  const [isValidStream, setIsValidStream] = useState(true);

  // Auto-play WebRTC stream when it changes
  useEffect(() => {
    // Only run this logic if we are NOT in YouTube mode
    if (isYoutube) return;

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

        // 🟢 FIX: Only play if element is actually in the DOM to avoid AbortError on unmount
        if (vid.isConnected) {
          vid.play().catch(e => {
            // Ignore AbortError (interrupted by unmount/load)
            if (e.name === "AbortError" || e.message.includes("interrupted")) return;

            console.error("Autoplay failed", e);
            if (e.name === "NotAllowedError") {
              setShowPlayOverlay(true);
            }
          });
        }
      }

      return () => {
        if (track) {
          track.removeEventListener("ended", handleTrackEnded);
        }
        // 🟢 Cleanup: Stop video to prevent AbortErrors when switching to YouTube
        if (vid) {
          vid.pause();
          vid.removeAttribute('src'); // Helper to clean up
          vid.load(); // Reset
        }
      };
    }
  }, [stream, isYoutube]);

  // --- 3. RENDER ---

  // 🟢 1. YOUTUBE PLAYER MODE
  if (isYoutube && youtubeUrl) {
    return (
      <div className="player-wrapper" style={styles.wrapper}>
        <div style={styles.playerContainer}>
          <ReactPlayer
            ref={reactPlayerRef}
            url={youtubeUrl}
            playing={playing}
            controls={true} // 🟢 FORCE CONTROLS ON for debugging (and to allow unblock)
            width="100%"
            height="100%"
            onError={(e) => console.error("YouTube Player Error:", e)}
            onReady={() => console.log("✅ YouTube Player Ready")}
            onStart={() => console.log("▶ YouTube Player Started")}
            onBuffer={() => console.log("⏳ YouTube Player Buffering")}
            onProgress={(p) => {
              // Optional: could send progress back to host for sync checks
            }}
          />
        </div>
        {/* Overlay Badge for YouTube */}
        <div style={{ ...styles.liveBadge, backgroundColor: "#FF0000" }}>▶ YouTube Mode</div>
      </div>
    );
  }


  // 🟢 2. MP4 / STREAM PLAYER MODE
  // Waiting for Stream / Stream Disconnected
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

  // Default: Empty / Placeholder
  return (
    <div className="player-wrapper" style={styles.wrapper}>
      <div style={{ ...styles.playerContainer, backgroundColor: "#1e293b" }}>
        <p style={{ color: "#94a3b8" }}>Waiting for Host to start content...</p>
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
