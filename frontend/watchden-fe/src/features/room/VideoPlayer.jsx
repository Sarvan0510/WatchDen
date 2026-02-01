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
    // --- State ---
    const [playing, setPlaying] = useState(isPlaying);
    const [showOverlay, setShowOverlay] = useState(false);
    const [showPlayOverlay, setShowPlayOverlay] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isValidStream, setIsValidStream] = useState(true);

    // --- References ---
    const videoRef = useRef(null);
    const reactPlayerRef = useRef(null);
    const playerWrapperRef = useRef(null);

    // 🟢 FIX: Track time locally to avoid calling broken ref methods
    const currentTimeRef = useRef(0);

    // --- Synchronization ---
    useEffect(() => {
      setPlaying(isPlaying);
    }, [isPlaying]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.volume = volume;
        videoRef.current.muted = muted;
      }
    }, [volume, muted]);

    useEffect(() => {
      if (mediaName) {
        setShowOverlay(true);
        const timer = setTimeout(() => setShowOverlay(false), 3000);
        return () => clearTimeout(timer);
      }
    }, [mediaName]);

    // --- Helpers ---
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

    useEffect(() => {
      const handleFsChange = () =>
        setIsFullscreen(!!document.fullscreenElement);
      document.addEventListener("fullscreenchange", handleFsChange);
      return () =>
        document.removeEventListener("fullscreenchange", handleFsChange);
    }, []);

    const jumpToLiveInternal = () => {
      if (isYoutube && reactPlayerRef.current) {
        // Only try to seek if the method actually exists (safety check)
        if (typeof reactPlayerRef.current.seekTo === "function") {
          const duration = reactPlayerRef.current.getDuration();
          if (duration) {
            reactPlayerRef.current.seekTo(duration - 1, "seconds");
          }
        }
        return;
      }

      const vid = videoRef.current;
      if (vid && vid.buffered.length > 0) {
        try {
          vid.currentTime = vid.buffered.end(vid.buffered.length - 1);
        } catch (e) {
          console.error("Failed to jump to live edge", e);
        }
      }
    };

    // --- Imperative Handle (Command Center) ---
    useImperativeHandle(
      ref,
      () => ({
        pause: () => setPlaying(false),
        play: () => setPlaying(true),
        seek: (time) => {
          if (isYoutube) {
            // Safety check for seekTo
            if (
              reactPlayerRef.current &&
              typeof reactPlayerRef.current.seekTo === "function"
            ) {
              reactPlayerRef.current.seekTo(time, "seconds");
            }
          } else if (videoRef.current) {
            videoRef.current.currentTime = time;
          }
        },
        jumpToLive: jumpToLiveInternal,

        // 🟢 FIX: Return locally tracked time instead of calling ref method
        getCurrentTime: () => {
          if (isYoutube) {
            return currentTimeRef.current;
          }
          if (videoRef.current) {
            return videoRef.current.currentTime;
          }
          return 0;
        },
      }),
      [isYoutube, isMp4]
    );

    // --- Stream Autoplay ---
    useEffect(() => {
      if (isYoutube) return;
      setIsValidStream(!!stream);

      const vid = videoRef.current;
      if (stream && vid) {
        vid.srcObject = stream;
        if (vid.isConnected) {
          vid.play().catch((e) => {
            if (e.name === "NotAllowedError") setShowPlayOverlay(true);
          });
        }
      }
    }, [stream, isYoutube]);

    // --- Render Logic ---

    const effectiveYoutubeUrl =
      typeof youtubeUrl === "string" ? youtubeUrl.trim() : "";

    // 1. YouTube Mode
    if (isYoutube && effectiveYoutubeUrl) {
      return (
        <div
          className="player-wrapper player-wrapper--youtube"
          style={styles.wrapper}
          ref={playerWrapperRef}
        >
          <div style={{ ...styles.playerContainer, position: "relative" }}>
            <ReactPlayer
              ref={reactPlayerRef}
              src={effectiveYoutubeUrl}
              playing={playing}
              muted={muted}
              volume={volume}
              playsInline={true}
              controls={false}
              width="100%"
              height="100%"
              onStart={() => {
                if (isPlaying) setPlaying(true);
              }}
              onPlay={() => {
                setPlaying(true);
                if (onPlay) onPlay();
              }}
              onPause={() => {
                if (onPause) onPause();
              }}
              // 🟢 FIX: Update local time ref on progress
              onProgress={(progress) => {
                currentTimeRef.current = progress.playedSeconds;
                if (onProgress) {
                  onProgress(progress.playedSeconds);
                }
              }}
              onError={(e) => console.error("YT Player Error:", e)}
            />
          </div>

          <div style={styles.liveBadge}>● YouTube</div>

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
                setPlaying(true);
              }}
            />
          )}

          <button onClick={toggleFullscreen} style={styles.fsBtn}>
            {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
          </button>
        </div>
      );
    }

    // 2. MP4 / Stream Placeholder
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
              <h2 style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
                Video Removed by Host
              </h2>
              <p style={{ color: "#94a3b8" }}>Waiting for host to resume...</p>
            </div>
          </div>
        </div>
      );
    }

    // 3. Active Stream / MP4
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
              controls={false}
              onPlay={onPlay}
              muted={muted}
              style={{ width: "100%", height: "100%", objectFit: "contain" }}
            />
            <div style={styles.liveBadge}>● LIVE</div>

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

            {showOverlay && mediaName && (
              <div style={styles.mediaOverlay}>🎥 Playing: {mediaName}</div>
            )}

            <button onClick={toggleFullscreen} style={styles.fsBtn}>
              {isFullscreen ? <ExitFullscreenIcon /> : <FullscreenIcon />}
            </button>
          </div>
        </div>
      );
    }

    // 4. Default
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
