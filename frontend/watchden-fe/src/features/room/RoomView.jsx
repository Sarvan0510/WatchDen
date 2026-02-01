import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../../api/api";
import { userApi } from "../../api/user.api";
import { roomApi } from "../../api/room.api";
import { streamApi } from "../../api/stream.api";
import RoomHeader from "./RoomHeader";
import VideoPlayer from "./VideoPlayer";
import ChatPanel from "./ChatPanel";
import ParticipantList from "./ParticipantList";
import {
  connectSocket,
  disconnectSocket,
  sendMessage,
} from "../../socket/roomSocket";
import { authUtils } from "../auth/auth.utils";
import { useWebRTC } from "../../hooks/useWebRTC";
import { createMp4Stream } from "../../hooks/useMP4Stream";
import HostControls from "./HostControls";
import PlayerControls from "./PlayerControls";
import "./room.css";

const RoomView = () => {
  const { roomCode: rawRoomCode } = useParams();
  const roomCode = rawRoomCode?.toUpperCase();
  const navigate = useNavigate();

  // --- Basic State ---
  const [messages, setMessages] = useState([]);
  const [participants, setParticipants] = useState([]);
  const [profileMap, setProfileMap] = useState({});
  const [user, setUser] = useState(() => authUtils.getUser());

  // --- Room State ---
  const [isHost, setIsHost] = useState(false);
  const [hostId, setHostId] = useState(null);
  const [hostLeft, setHostLeft] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [numericRoomId, setNumericRoomId] = useState(null);

  // --- WebRTC & Media State ---
  const [localStream, setLocalStream] = useState(null);

  // Player state manages the active media content
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMp4: false,
    isYoutube: false,
    youtubeUrl: null,
    currentTime: 0,
    duration: 0,
    mediaName: null,
  });

  // Local Audio State
  const [isLocalMuted, setIsLocalMuted] = useState(true);
  const [localVolume, setLocalVolume] = useState(0.5);

  const localStreamRef = useRef(null);
  const isConnected = useRef(false);

  // Refs
  const mp4VideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const joinSentRef = useRef(false);
  const videoPlayerRef = useRef(null);

  const {
    remoteStreams,
    handleIncomingSignal,
    replaceVideoTrack,
    connectToPeer,
  } = useWebRTC(roomCode, user);

  const lastHostTimeRef = useRef(0);
  const lastHeartbeatReceivedAt = useRef(Date.now());

  // --- Player Event Handlers ---
  const handlePlayerPlay = () => {
    if (isHost) {
      if (!playerState.isPlaying) {
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }
      return;
    }
    // Participant Logic
    if (playerState.isMp4 && videoPlayerRef.current) {
      videoPlayerRef.current.jumpToLive();
    } else if (playerState.isYoutube && videoPlayerRef.current) {
      const hostTime = lastHostTimeRef.current || 0;
      videoPlayerRef.current.seek(hostTime);
    }
  };

  const handlePlayerPause = () => {
    if (isHost) {
      if (playerState.isPlaying) {
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
    }
  };

  // --- Host Heartbeat Loop ---
  useEffect(() => {
    let interval;
    if (isHost && (playerState.isMp4 || playerState.isYoutube)) {
      interval = setInterval(() => {
        const currentTime = mp4VideoRef.current?.currentTime || 0;
        const payload = {
          type: "HEARTBEAT",
          time: currentTime,
          isMp4: playerState.isMp4,
          isYoutube: playerState.isYoutube,
          youtubeUrl: playerState.youtubeUrl,
          mediaName: playerState.mediaName,
          isPlaying: playerState.isPlaying,
        };
        sendMessage(roomCode, JSON.stringify(payload), "SYNC");
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isHost, playerState, roomCode]);

  // --- Stream Selection Logic ---
  const hostProfile = profileMap[hostId];
  const hostUsername = hostProfile?.username;
  const activeStream = isHost
    ? localStream
    : (hostUsername && remoteStreams.get(hostUsername)) ||
      (remoteStreams.size > 0 ? remoteStreams.values().next().value : null);

  // --- Playback Handlers ---
  const handlePlayPause = () => {
    if (playerState.isYoutube && videoPlayerRef.current) {
      const nextPlaying = !playerState.isPlaying;
      if (nextPlaying) {
        videoPlayerRef.current.play();
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      } else {
        videoPlayerRef.current.pause();
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
      return;
    }
    const video = mp4VideoRef.current;
    if (video) {
      if (video.paused) {
        video.play();
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      } else {
        video.pause();
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
    }
  };

  const handleStop = () => {
    if (playerState.isYoutube && videoPlayerRef.current) {
      videoPlayerRef.current.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
      return;
    }
    const video = mp4VideoRef.current;
    if (video) {
      video.pause();
      video.currentTime = 0;
      setPlayerState((prev) => ({ ...prev, isPlaying: false, currentTime: 0 }));
    }
  };

  const handleSeek = (time) => {
    const video = mp4VideoRef.current;
    if (video) {
      video.currentTime = time;
      setPlayerState((prev) => ({ ...prev, currentTime: time }));
    }
  };

  const handleSkipForward = () => {
    const video = mp4VideoRef.current;
    if (video)
      video.currentTime = Math.min(video.currentTime + 10, video.duration);
  };

  const handleSkipBack = () => {
    const video = mp4VideoRef.current;
    if (video) video.currentTime = Math.max(video.currentTime - 10, 0);
  };

  const handleGoToStart = () => {
    const video = mp4VideoRef.current;
    if (video) video.currentTime = 0;
  };

  const handleGoToEnd = () => {
    const video = mp4VideoRef.current;
    if (video) video.currentTime = video.duration;
  };

  // --- Host Specific Functions ---

  const handleStartMp4 = async (file) => {
    if (!isHost || !file) return;
    try {
      const { video, stream } = await createMp4Stream(file);
      mp4VideoRef.current = video;

      video.ontimeupdate = () => {
        setPlayerState((prev) => ({ ...prev, currentTime: video.currentTime }));
      };
      video.onloadedmetadata = () => {
        setPlayerState((prev) => ({ ...prev, duration: video.duration }));
      };
      video.onended = () =>
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));

      setLocalStream(stream);
      localStreamRef.current = stream;
      replaceVideoTrack(stream);

      await video.play();
      setPlayerState({
        isPlaying: true,
        isMp4: true,
        currentTime: 0,
        duration: video.duration || 0,
        mediaName: file.name,
      });

      sendMessage(
        roomCode,
        JSON.stringify({ type: "LOAD", filename: file.name }),
        "SYNC"
      );
      setTimeout(() => {
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }, 500);

      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "MP4",
        source: file.name,
      });

      const currentProfiles = { ...profileMap };
      if (participants && participants.length > 0) {
        participants.forEach((pId) => {
          const pProfile = currentProfiles[pId];
          if (pProfile?.username) connectToPeer(pProfile.username, stream);
        });
      }
    } catch (e) {
      console.error("MP4 Error", e);
    }
  };

  const handleStartScreen = async () => {
    if (!isHost) return;
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });
      screenStreamRef.current = stream;

      setLocalStream(stream);
      localStreamRef.current = stream;
      replaceVideoTrack(stream);
      setPlayerState({
        isPlaying: true,
        isMp4: false,
        currentTime: 0,
        duration: 0,
      });

      stream.getVideoTracks()[0].onended = handleStopScreen;

      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "SCREEN",
        source: "Screen",
      });
    } catch (e) {
      console.error("Screen Share Error", e);
    }
  };

  const normalizeYoutubeUrl = (input) => {
    const raw = typeof input === "string" ? input.trim() : "";
    if (!raw) return null;
    let videoId = null;
    try {
      const shortMatch = raw.match(
        /(?:youtu\.be\/)([A-Za-z0-9_-]{11})(?:\?|$)/
      );
      if (shortMatch) {
        videoId = shortMatch[1];
      } else {
        const watchMatch = raw.match(/(?:v=|\/embed\/)([A-Za-z0-9_-]{11})/);
        if (watchMatch) videoId = watchMatch[1];
      }
      if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    } catch (_) {}
    return null;
  };

  const handleStartYoutube = async (url) => {
    if (!isHost || !url) return;

    const normalizedUrl = normalizeYoutubeUrl(url);
    if (!normalizedUrl) {
      console.warn("Invalid YouTube URL:", url);
      return;
    }

    // Stop any existing streams first
    await handleStopScreen();

    setPlayerState({
      isPlaying: true,
      isMp4: false,
      isYoutube: true,
      currentTime: 0,
      duration: 0,
      mediaName: "YouTube Video",
      youtubeUrl: normalizedUrl,
    });

    sendMessage(
      roomCode,
      JSON.stringify({ type: "LOAD_YOUTUBE", url: normalizedUrl }),
      "SYNC"
    );
  };

  const handleStopScreen = async () => {
    if (!isHost) return;

    const hasActiveStream = !!screenStreamRef.current || !!mp4VideoRef.current;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (mp4VideoRef.current) {
      mp4VideoRef.current.pause();
      mp4VideoRef.current = null;
    }

    setPlayerState((prev) => ({
      ...prev,
      isPlaying: false,
      isMp4: false,
      isYoutube: false,
      youtubeUrl: null,
    }));

    sendMessage(roomCode, JSON.stringify({ type: "STOP" }), "SYNC");

    // Clear local stream
    setLocalStream(null);
    localStreamRef.current = null;

    // 🟢 CRITICAL FIX: DO NOT CALL replaceVideoTrack(null).
    // It causes useWebRTC to crash because it tries to read properties of null.
    // Since we are stopping, we don't need to replace the track with anything.
    // replaceVideoTrack(null); <--- REMOVED

    if (hasActiveStream) {
      try {
        await streamApi.stopStream({ roomId: roomCode, userId: user.id });
      } catch (e) {
        console.warn("Stop stream API failed", e);
      }
    }
  };

  // --- Effects ---
  useEffect(() => {
    const handleUserUpdate = () => setUser(authUtils.getUser());
    window.addEventListener("user-updated", handleUserUpdate);
    const handleBeforeUnload = (e) => {
      if (isHost && (playerState.isMp4 || playerState.isYoutube)) {
        e.preventDefault();
        e.returnValue = "Leaving will stop playback. Are you sure?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isHost, playerState]);

  const handleLogout = () => {
    authUtils.clearAuth();
    setUser(null);
    navigate("/login");
  };

  useEffect(() => {
    const syncProfiles = async () => {
      const uniqueIds = new Set(participants.map((id) => Number(id)));
      if (hostId) uniqueIds.add(Number(hostId));
      if (uniqueIds.size === 0) return;
      try {
        const userIds = Array.from(uniqueIds);
        const profiles = await userApi.getUsersBatch(userIds);
        const newMap = {};
        profiles.forEach((p) => {
          newMap[p.userId] = p;
        });
        setProfileMap((prev) => ({ ...prev, ...newMap }));
      } catch (err) {
        console.error(err);
      }
    };
    syncProfiles();
  }, [participants, hostId]);

  useEffect(() => {
    let timer;
    if (hostLeft && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (hostLeft && countdown === 0) {
      navigate("/rooms");
    }
    return () => clearInterval(timer);
  }, [hostLeft, countdown, navigate]);

  useEffect(() => {
    if (isHost) return;
    const checkInterval = setInterval(() => {
      if (playerState.isYoutube || playerState.isMp4) {
        const timeSinceLastHeartbeat =
          Date.now() - lastHeartbeatReceivedAt.current;
        if (timeSinceLastHeartbeat > 10000) {
          console.warn("Host Heartbeat lost");
          setPlayerState((prev) => {
            if (!prev.isYoutube && !prev.isMp4) return prev;
            return {
              ...prev,
              isPlaying: false,
              isMp4: false,
              isYoutube: false,
              youtubeUrl: null,
            };
          });
          lastHeartbeatReceivedAt.current = Date.now();
        }
      }
    }, 2000);
    return () => clearInterval(checkInterval);
  }, [isHost, playerState]);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login");
      return;
    }

    roomApi.joinRoom(roomCode).catch((e) => {
      if (e.response?.status !== 409) console.error(e);
    });

    api
      .get(`/chat/history/${roomCode}`)
      .then((res) => {
        if (Array.isArray(res.data)) setMessages(res.data);
      })
      .catch(console.error);

    const checkHostStatus = async (retry = 0) => {
      try {
        const details = await roomApi.getRoomDetails(roomCode);
        setHostId(details.hostUserId);
        setNumericRoomId(details.roomId);
        if (user && details.hostUserId == user.id) setIsHost(true);
      } catch (error) {
        if (retry < 2) setTimeout(() => checkHostStatus(retry + 1), 1000);
      }
    };
    checkHostStatus();

    if (!isConnected.current) {
      isConnected.current = true;
      connectSocket(
        roomCode,
        (msg) => {
          if (msg.type === "HOST_LEFT") setHostLeft(true);
          else if (String(msg.type).toUpperCase() === "SYNC") {
            try {
              const action = JSON.parse(msg.content);
              lastHeartbeatReceivedAt.current = Date.now();
              if (action.type === "PAUSE") {
                videoPlayerRef.current?.pause();
                setPlayerState((prev) => ({ ...prev, isPlaying: false }));
              } else if (action.type === "PLAY") {
                videoPlayerRef.current?.play();
                setPlayerState((prev) => ({ ...prev, isPlaying: true }));
              } else if (action.type === "LOAD") {
                setPlayerState((prev) => ({
                  ...prev,
                  isMp4: true,
                  isYoutube: false,
                  mediaName: action.filename,
                  isPlaying: false,
                }));
              } else if (action.type === "LOAD_YOUTUBE") {
                const url = normalizeYoutubeUrl(action.url) || action.url;
                if (url)
                  setPlayerState((prev) => ({
                    ...prev,
                    isMp4: false,
                    isYoutube: true,
                    youtubeUrl: url,
                    mediaName: "YouTube Video",
                    isPlaying: true,
                  }));
              } else if (action.type === "STOP") {
                setPlayerState((prev) => ({
                  ...prev,
                  isMp4: false,
                  isYoutube: false,
                  youtubeUrl: null,
                  mediaName: null,
                  isPlaying: false,
                }));
              } else if (action.type === "HEARTBEAT") {
                lastHostTimeRef.current = action.time;
                lastHeartbeatReceivedAt.current = Date.now();
                setPlayerState((prev) => {
                  let newState = { ...prev };
                  let hasChanged = false;
                  if (!isHost && action.isYoutube && action.youtubeUrl) {
                    const nUrl =
                      normalizeYoutubeUrl(action.youtubeUrl) ||
                      action.youtubeUrl;
                    if (!prev.isYoutube || prev.youtubeUrl !== nUrl) {
                      newState.isYoutube = true;
                      newState.isMp4 = false;
                      newState.youtubeUrl = nUrl;
                      newState.mediaName = "YouTube Video";
                      hasChanged = true;
                    }
                  } else if (!isHost && action.isMp4) {
                    if (!prev.isMp4 || prev.mediaName !== action.mediaName) {
                      newState.isMp4 = true;
                      newState.isYoutube = false;
                      newState.mediaName = action.mediaName;
                      hasChanged = true;
                    }
                  }
                  if (
                    action.isPlaying !== undefined &&
                    action.isPlaying !== prev.isPlaying
                  ) {
                    newState.isPlaying = action.isPlaying;
                    hasChanged = true;
                  }
                  return hasChanged ? newState : prev;
                });
              }
            } catch (e) {
              console.error(e);
            }
          } else if (msg.type === "CHAT") {
            setMessages((prev) => {
              const isDuplicate = prev.some(
                (m) =>
                  (m.id && m.id === msg.id) ||
                  (m.sender === msg.sender &&
                    m.content === msg.content &&
                    Math.abs(
                      new Date(m.timestamp).getTime() -
                        new Date(msg.timestamp).getTime()
                    ) < 1000)
              );
              if (isDuplicate) return prev;
              return [...prev, msg];
            });
          }
        },
        setParticipants,
        (signal) => handleIncomingSignal(signal, localStreamRef.current)
      );
      if (!joinSentRef.current) {
        joinSentRef.current = true;
        setTimeout(() => {
          import("../../socket/roomSocket").then(({ sendSignal }) =>
            sendSignal(roomCode, "join", {})
          );
        }, 1500);
      }
    }
    return () => {
      isConnected.current = false;
      disconnectSocket();
    };
  }, [roomCode, navigate]);

  if (!user) return null;

  return (
    <div className="room-wrapper" style={styles.wrapper}>
      <RoomHeader
        roomId={roomCode}
        user={user}
        onLogout={handleLogout}
        isHost={isHost}
        disableProfileLink={true}
      />
      <div className="room-container">
        {hostLeft && (
          <div style={styles.overlay}>
            <div style={styles.overlayContent}>
              <h2>Room Closed</h2>
              <p>Host left.</p>
              <div style={styles.countdown}>{countdown}</div>
              <button
                onClick={() => navigate("/rooms")}
                style={styles.overlayBtn}
              >
                Return
              </button>
            </div>
          </div>
        )}
        <div className="main-content">
          <div
            className="video-section"
            style={{
              display: "flex",
              flexDirection: "column",
              flex: 1,
              minHeight: 0,
              backgroundColor: "black",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <VideoPlayer
              key={
                playerState.isYoutube
                  ? `youtube-${playerState.youtubeUrl}`
                  : activeStream
                    ? activeStream.id
                    : "no-stream"
              }
              ref={videoPlayerRef}
              roomCode={roomCode}
              stream={
                playerState.isYoutube ||
                (!playerState.isMp4 && !playerState.isPlaying)
                  ? null
                  : activeStream
              }
              isHost={isHost}
              mediaName={playerState.mediaName}
              isMp4={playerState.isMp4}
              isYoutube={playerState.isYoutube}
              youtubeUrl={playerState.youtubeUrl}
              isPlaying={playerState.isPlaying}
              onPlay={handlePlayerPlay}
              onPause={handlePlayerPause}
              muted={isLocalMuted}
              volume={localVolume}
            />
            <div
              className="host-controls-wrapper"
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                height: "auto",
                minHeight: "180px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                alignItems: "center",
                padding: "0 20px 20px 20px",
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                gap: "10px",
                zIndex: 50,
              }}
            >
              {isHost && (
                <div style={{ width: "100%", maxWidth: "700px" }}>
                  <HostControls
                    onStartMp4={handleStartMp4}
                    onStartScreen={handleStartScreen}
                    onStopScreen={handleStopScreen}
                    onStartYoutube={handleStartYoutube}
                    fileInputRef={fileInputRef}
                  />
                </div>
              )}
              {(playerState.isMp4 || playerState.isYoutube) && (
                <div style={{ width: "100%", maxWidth: "700px" }}>
                  <PlayerControls
                    isPlaying={playerState.isPlaying}
                    currentTime={playerState.currentTime}
                    duration={playerState.duration}
                    isHost={isHost}
                    onPlayPause={isHost ? handlePlayPause : () => {}}
                    onStop={handleStop}
                    onSeek={handleSeek}
                    onSkipForward={handleSkipForward}
                    onSkipBack={handleSkipBack}
                    onGoToStart={handleGoToStart}
                    onGoToEnd={handleGoToEnd}
                    isMuted={isLocalMuted}
                    volume={localVolume}
                    onToggleMute={() => setIsLocalMuted((prev) => !prev)}
                    onVolumeChange={(val) => {
                      setLocalVolume(val);
                      if (val > 0) setIsLocalMuted(false);
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="sidebar">
          <div className="participants-section">
            <ParticipantList
              participants={participants}
              profileMap={profileMap}
            />
          </div>
          <div className="chat-section">
            <ChatPanel
              messages={messages}
              roomCode={roomCode}
              profileMap={profileMap}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  wrapper: {
    height: "100vh",
    display: "flex",
    flexDirection: "column",
    backgroundColor: "#0f172a",
  },
  overlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    backdropFilter: "blur(10px)",
    zIndex: 100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    color: "white",
  },
  overlayContent: { animation: "fadeIn 0.5s ease" },
  countdown: {
    fontSize: "5rem",
    fontWeight: "800",
    color: "#ef4444",
    margin: "20px 0",
  },
  overlayBtn: {
    marginTop: "20px",
    padding: "10px 20px",
    backgroundColor: "#334155",
    color: "white",
    border: "1px solid #475569",
    borderRadius: "8px",
    cursor: "pointer",
    fontSize: "1rem",
  },
};

export default RoomView;
