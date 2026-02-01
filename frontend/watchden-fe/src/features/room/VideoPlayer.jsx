import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactPlayer from "react-player";

const FullscreenIcon = () => (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <path
      d="M 10 16 L 12 16 L 12 12 L 16 12 L 16 10 L 10 10 L 10 16 Z M 26 16 L 26 10 L 20 10 L 20 12 L 24 12 L 24 16 L 26 16 Z M 26 20 L 24 20 L 24 24 L 20 24 L 20 26 L 26 26 L 26 20 Z M 10 20 L 10 26 L 16 26 L 16 24 L 12 24 L 12 20 L 10 20 Z"
      fill="white"
    ></path>
  </svg>
);

const ExitFullscreenIcon = () => (
  <svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%">
    <path
      d="M 14 14 L 10 14 L 10 16 L 16 16 L 16 10 L 14 10 L 14 14 Z M 22 14 L 22 10 L 20 10 L 20 16 L 26 16 L 26 14 L 22 14 Z M 20 26 L 22 26 L 22 22 L 26 22 L 26 20 L 20 20 L 20 26 Z M 10 22 L 14 22 L 14 26 L 16 26 L 16 20 L 10 20 L 10 22 Z"
      fill="white"
    ></path>
  </svg>
);

const VideoPlayer = forwardRef(
  (
    {
      roomCode,
      stream,
      isHost,
      mediaName,
      isMp4,
      isYoutube,
      youtubeUrl,
      isPlaying,
      onPlay,
      onPause,
      muted,
      volume,
    },
    ref
  ) => {
    // --- 1. HOOKS & STATE (Must be at the top) ---
    useEffect(() => {
      console.log("🎥 VideoPlayer Props Update:", {
        isYoutube,
        youtubeUrl,
        isMp4,
        isPlaying,
      });
    }, [isYoutube, youtubeUrl, isMp4, isPlaying, stream]);

    console.log("🎥 VideoPlayer Render:", {
      isYoutube,
      youtubeUrl,
      isMp4,
      streamId: stream?.id,
      isPlaying,
    });
    const [playing, setPlaying] = useState(isPlaying || false); // Initialize from prop

    // Sync prop changes to local state
    useEffect(() => {
      console.log("🎥 VideoPlayer: Syncing isPlaying prop:", isPlaying);
      setPlaying(isPlaying);
    }, [isPlaying]);

    // 🟢 Sync Volume for Native Video
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = muted;
      }
    }, [volume, muted]);

    const [showOverlay, setShowOverlay] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);

    // Ref for the native video element
    const videoRef = useRef(null);
    // Ref for ReactPlayer (YouTube)
    const reactPlayerRef = useRef(null);
    // 🟢 Ref for Fullscreen Wrapper
    const playerWrapperRef = useRef(null);
    const [isFullscreen, setIsFullscreen] = useState(false);

    // 🟢 Helper: Toggle Fullscreen
    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        playerWrapperRef.current?.requestFullscreen().catch((err) => {
          console.error(
            `Error attempting to enable fullscreen: ${err.message}`
          );
        });
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };

    // Listen to change (to update icon if user exits via Esc)
    useEffect(() => {
      const handleFsChange = () =>
        setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () =>
        document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

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
          videoRef.current
            .play()
            .catch((e) => console.log("Play interrupted", e));
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
      jumpToLive: jumpToLiveInternal,
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
            vid.play().catch((e) => {
              // Ignore AbortError (interrupted by unmount/load)
              if (e.name === "AbortError" || e.message.includes("interrupted"))
                return;

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
            vid.removeAttribute("src"); // Helper to clean up
            vid.load(); // Reset
          }
        };
      }
    }, [stream, isYoutube]);

    // --- 3. RENDER ---

    // 🟢 1. YOUTUBE PLAYER MODE — react-player 3.x uses "src" prop, not "url"
    const effectiveYoutubeUrl =
      typeof youtubeUrl === "string" ? youtubeUrl.trim() : "";
    if (isYoutube && effectiveYoutubeUrl) {
      return (
        <div
          className="player-wrapper player-wrapper--youtube"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          <div style={styles.playerContainer}>
            <ReactPlayer
              ref={reactPlayerRef}
              src={effectiveYoutubeUrl}
              playing={playing}
              muted={muted} // 🟢 Use Prop
              volume={volume} // 🟢 Use Prop
              playsInline={true}
              controls={isHost} // 🟢 HOST ONLY controls
              width="100%"
              height="100%"
              onError={(e) => console.error("YouTube Player Error:", e)}
              onReady={() => console.log("✅ YouTube Player Ready")}
              onStart={() => console.log("▶ YouTube Player Started")}
              onProgress={() => {}}
            />
          </div>
          <div style={styles.liveBadge}>● YouTube Live</div>

          {/* 🟢 INTERACTION SHIELD: Block clicks for Participants so they can't Pause/Seek via YouTube Click */}
          {!isHost && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10, // Above ReactPlayer
                background: "transparent", // Invisible
                cursor: "default",
              }}
              onClick={(e) => {
                e.stopPropagation();
                console.log("🛡️ Shield blocked interaction");
              }}
            />
          )}

          {/* 🟢 FULLSCREEN BUTTON (All Users) */}
          <button
            onClick={toggleFullscreen}
            style={styles.fsBtn}
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>
      );
    }

    // 🟢 2. MP4 / STREAM PLAYER MODE
    // Waiting for Stream / Stream Disconnected
    if (isMp4 && (!stream || !isValidStream)) {
      return (
        <div
          className="player-wrapper"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          {/* Blurred Background with Message */}
          <div
            style={{
              ...styles.playerContainer,
              color: "white",
              backgroundColor: "#000",
              backgroundImage: "url(/assets/placeholder_blur.jpg)", // Optional: You could use a generic poster if available
              backgroundSize: "cover",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                backdropFilter: "blur(15px)",
                backgroundColor: "rgba(0,0,0,0.5)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: "15px",
              }}
            >
              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: "bold",
                  textAlign: "center",
                }}
              >
                🚫 Video Removed by Host
              </h2>
              <p style={{ color: "#94a3b8" }}>Waiting for host to resume...</p>
            </div>
          </div>
        </div>
      );
    }

    // If a WebRTC stream exists (Host is streaming), show the VIDEO tag
    if (stream && isValidStream) {
      return (
        <div
          className="player-wrapper"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          <div style={styles.playerContainer}>
            {/* 🔴 LIVE STREAM VIEW */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              // 🟢 ENABLE CONTROLS FOR VIEWERS (Force off for everyone, use custom controls or overlay)
              controls={false} // Disable native controls everywhere, we have custom volume now (or native will conflict)
              // Wait, for MP4, native controls are nice.
              // But user asked for progress bar "on other user also but he cannot touch". Native controls allow touch.
              // So we MUST disable native controls for ALL PARTICIPANTS for MP4 too.
              // For Host, we can keep them or use custom.

              onPlay={onPlay}
              muted={muted} // 🟢 Local Mute
              // volume={volume} // video tag doesn't take volume prop directly in React perfectly, use Ref effect?
              // Actually simple way: useEffect to set volume on ref.
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            {/* Overlay Badge */}
            <div style={styles.liveBadge}>● LIVE</div>

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
              <div style={styles.mediaOverlay}>🎥 Playing: {mediaName}</div>
            )}

            {/* 🟢 FULLSCREEN BUTTON (All Users) */}
            <button
              onClick={toggleFullscreen}
              style={styles.fsBtn}
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      );
    }

    // Default: Empty / Placeholder
    return (
      <div className="player-wrapper" style={styles.wrapper}>
        <div style={{ ...styles.playerContainer, backgroundColor: "#1e293b" }}>
          <p style={{ color: "#94a3b8" }}>
            Waiting for Host to start content...
          </p>
        </div>
      </div>
    );
  }
);

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
    height: "100%", // 🟢 Explicit height to prevent collapse
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
    backgroundColor: "transparent", // 🟢 Transparent
    color: "#FF0000", // 🟢 Red Text
    padding: "2px 6px",
    fontSize: "1rem", // Slightly larger
    fontWeight: "bold",
    letterSpacing: "0.5px",
    textShadow: "0 1px 2px rgba(0,0,0,0.8)", // Shadow for visibility
    pointerEvents: "none",
    display: "flex",
    alignItems: "center",
    gap: "6px",
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
  fsBtn: {
    position: "absolute",
    top: "16px", // 🟢 CHANGED: Move from bottom to top
    right: "16px", // 🟢 CHANGED: Add spacing to match Live Badge
    background: "rgba(0, 0, 0, 0.5)", // 🟢 ADDED: Semi-transparent background for visibility
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.2)", // 🟢 ADDED: Subtle border
    width: "40px",
    height: "40px",
    cursor: "pointer",
    zIndex: 100, // 🟢 INCREASED: Ensure it sits above everything
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    opacity: 0.9,
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)", // 🟢 ADDED: Blur effect like your other controls
  },
};

export default VideoPlayer;
