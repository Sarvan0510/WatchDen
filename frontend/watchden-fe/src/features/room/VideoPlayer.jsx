import React, {
  useState,
  useEffect,
  useRef,
  forwardRef,
  useImperativeHandle,
} from "react";
import ReactPlayer from "react-player";

/* --- Icons --- */

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
      onProgress,
      muted,
      volume,
    },
    ref
  ) => {
    // --- State Management ---
    const [playing, setPlaying] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isValidStream, setIsValidStream] = useState(true);

    // --- References ---
    const videoRef = useRef(null);
    const reactPlayerRef = useRef(null);
    const playerWrapperRef = useRef(null);

    // --- Synchronization Effects ---

    // Synchronize local playing state with the parent prop
    useEffect(() => {
      setPlaying(isPlaying);
    }, [isPlaying]);

    // Synchronize volume and mute state for the native video element
    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = muted;
      }
    }, [volume, muted]);

    // Display media name overlay briefly when the content changes
    useEffect(() => {
      if (mediaName) {
        setShowOverlay(true);
        const timer = setTimeout(() => setShowOverlay(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [mediaName]);

    // --- Helper Functions ---

    const toggleFullscreen = () => {
      if (!document.fullscreenElement) {
        playerWrapperRef.current
          ?.requestFullscreen()
          .catch((err) => console.error(err));
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    };

    // Listen for fullscreen changes (e.g., user pressing Escape)
    useEffect(() => {
      const handleFsChange = () =>
        setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () =>
        document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    // Jumps to the latest buffered frame. Useful for syncing participants to a live stream.
    const jumpToLiveInternal = () => {
      const vid = videoRef.current;
      if (vid && vid.buffered.length > 0) {
        try {
          vid.currentTime = vid.buffered.end(vid.buffered.length - 1);
        } catch (e) {
          console.error("Failed to jump to live edge", e);
        }
      }
    };

    // --- Imperative Handle (Expose methods to Parent) ---
    useImperativeHandle(ref, () => ({
      pause: () => setPlaying(false),
      play: () => setPlaying(true),
      seek: (time) => {
        if (isYoutube && reactPlayerRef.current) {
          reactPlayerRef.current.seekTo(time, "seconds");
        } else if (videoRef.current) {
          videoRef.current.currentTime = time;
        }
      },
      jumpToLive: jumpToLiveInternal,
    }));

    // --- Stream Autoplay Logic ---
    useEffect(() => {
      if (isYoutube) return;
      setIsValidStream(!!stream);

      const vid = videoRef.current;
      if (stream && vid) {
        vid.srcObject = stream;

        // Ensure the video element is connected to the DOM before attempting playback
        if (vid.isConnected) {
          vid.play().catch((e) => {
            console.error("Autoplay failed:", e);
            // If the browser blocks audio/autoplay, show the Click-to-Play overlay
            if (e.name === "NotAllowedError") setShowPlayOverlay(true);
          });
        }
      }
    }, [stream, isYoutube]);

    // --- Render Logic ---

    // 1. YouTube Player Mode
    // ReactPlayer requires 'url' instead of 'src'
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
              url={effectiveYoutubeUrl}
              playing={playing}
              muted={muted}
              volume={volume}
              playsInline={true}
              controls={false} // Native controls are hidden; custom controls are used
              width="100%"
              height="100%"
              onError={(e) => console.error("YouTube Player Error:", e)}
              onStart={() => {
                if (isPlaying) setPlaying(true);
              }}
              onProgress={(progress) => {
                if (onProgress) onProgress(progress.playedSeconds);
              }}
            />
          </div>

          <div style={styles.liveBadge}>● YouTube</div>

          {/* Click-to-Start Overlay for Autoplay Blocks */}
          {isPlaying && !playing && (
            <div style={styles.playOverlay}>
              <button
                style={styles.bigPlayBtn}
                onClick={() => setPlaying(true)}
              >
                ▶ Click to Start
              </button>
            </div>
          )}

          {/* Interaction Shield: Prevents participants from clicking the iframe directly */}
          {!isHost && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                zIndex: 10,
                background: "transparent",
                cursor: "default",
              }}
              onClick={(e) => {
                e.stopPropagation();
                // Allow click to sync play state if stuck
                setPlaying(true);
              }}
            />
          )}

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

    // 2. MP4 / Stream Player Mode (Waiting State)
    if (isMp4 && (!stream || !isValidStream)) {
      return (
        <div
          className="player-wrapper"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          <div
            style={{
              ...styles.playerContainer,
              color: "white",
              backgroundColor: "#000",
              backgroundImage: "url(/assets/placeholder_blur.jpg)",
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

    // 3. Active Stream / MP4 Mode
    if (stream && isValidStream) {
      return (
        <div
          className="player-wrapper"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          <div style={styles.playerContainer}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls={false} // Native controls are disabled in favor of custom UI
              onPlay={onPlay}
              muted={muted}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <div style={styles.liveBadge}>● LIVE</div>

            {/* Click-to-Watch Overlay for Autoplay Blocks */}
            {showPlayOverlay && (
              <div style={styles.playOverlay}>
                <button
                  style={styles.bigPlayBtn}
                  onClick={() => {
                    if (videoRef.current) {
                      videoRef.current.play();
                      setShowPlayOverlay(false);
                      jumpToLiveInternal();
                    }
                  }}
                >
                  ▶ Click to Watch
                </button>
              </div>
            )}

            {/* Media Name Toast */}
            {showOverlay && mediaName && (
              <div style={styles.mediaOverlay}>🎥 Playing: {mediaName}</div>
            )}

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

    // 4. Default Placeholder State
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
    flex: 1,
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
    height: "100%",
    backgroundColor: "black",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "0",
  },
  liveBadge: {
    position: "absolute",
    top: "16px",
    left: "16px",
    backgroundColor: "rgba(0,0,0,0.6)",
    borderRadius: "4px",
    color: "#FF0000",
    padding: "4px 8px",
    fontSize: "0.9rem",
    fontWeight: "bold",
    pointerEvents: "none",
    zIndex: 20,
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
    zIndex: 20,
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
    zIndex: 30,
  },
  bigPlayBtn: {
    padding: "16px 32px",
    fontSize: "1.2rem",
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
    top: "16px",
    right: "16px",
    background: "rgba(0, 0, 0, 0.5)",
    borderRadius: "8px",
    color: "white",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    width: "40px",
    height: "40px",
    cursor: "pointer",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "8px",
    opacity: 0.9,
    transition: "all 0.2s ease",
    backdropFilter: "blur(4px)",
  },
};

export default VideoPlayer;
