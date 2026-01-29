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
import { connectSocket, disconnectSocket } from "../../socket/roomSocket";
import { authUtils } from "../auth/auth.utils";
import { useWebRTC } from "../../hooks/useWebRTC";
import { getLocalMedia } from "../../hooks/useLocalMedia";
import { createMp4Stream } from "../../hooks/useMP4Stream";
import HostControls from "./HostControls";
import MediaControls from "./MediaControls";
import PlayerControls from "./PlayerControls";
import "./room.css";

const RoomView = () => {
  const { roomCode } = useParams();
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
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMp4: false,
    currentTime: 0,
    duration: 0,
  });

  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  const localStreamRef = useRef(null);
  const isConnected = useRef(false);

  // Refs
  const mp4VideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const joinSentRef = useRef(false);

  const { remoteStreams, handleIncomingSignal, replaceVideoTrack } = useWebRTC(
    roomCode,
    user
  );

  // 🟢 FIX 1: Robust Stream Selection (The "Safety Net")
  const hostProfile = profileMap[hostId];
  const hostUsername = hostProfile?.username;

  // Debugging log to see if we found the stream
  console.log("Stream Select:", {
    hostId,
    hostUsername,
    streams: remoteStreams.size,
  });

  const activeStream = isHost
    ? localStream
    : (hostUsername && remoteStreams.get(hostUsername)) ||
      // Fallback: If we don't know the name yet, but there is ONE stream, play it!
      (remoteStreams.size > 0 ? remoteStreams.values().next().value : null);

  // --- MEDIA HANDLERS ---
  const handleToggleCam = () => {
    if (!localStream) return;
    const videoTrack = localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      setIsCamOn(videoTrack.enabled);
    }
  };

  const handleToggleMic = () => {
    if (!localStream) return;
    const audioTrack = localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMicOn(audioTrack.enabled);
    }
  };

  // --- PLAYBACK HANDLERS ---
  const handlePlayPause = () => {
    const video = mp4VideoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
    } else {
      video.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
    }
  };

  const handleStop = () => {
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

  // --- HOST CONTROLS ---

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
      });

      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "MP4",
        source: file.name,
      });
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

  const handleStopScreen = async () => {
    if (!isHost) return;

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (mp4VideoRef.current) {
      mp4VideoRef.current.pause();
      mp4VideoRef.current = null;
    }

    setPlayerState((prev) => ({ ...prev, isPlaying: false, isMp4: false }));

    const camStream = await getLocalMedia();
    camStream.getVideoTracks()[0].enabled = isCamOn;
    camStream.getAudioTracks()[0].enabled = isMicOn;

    setLocalStream(camStream);
    localStreamRef.current = camStream;
    replaceVideoTrack(camStream);

    await streamApi.stopStream({ roomId: roomCode, userId: user.id });
  };

  // --- EFFECTS ---
  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(authUtils.getUser());
    };
    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  const handleLogout = () => {
    authUtils.clearAuth();
    setUser(null);
    navigate("/login");
  };

  // 🟢 FIX 2: Explicitly fetch Host Profile (Fixes undefined username)
  useEffect(() => {
    const syncProfiles = async () => {
      // Create a set of IDs to fetch: Participants + Host
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
        console.error("Profile sync failed", err);
      }
    };
    syncProfiles();
  }, [participants, hostId]); // Added hostId dependency

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
    if (isHost && !localStream) {
      const startMedia = async () => {
        try {
          const stream = await getLocalMedia();
          stream.getVideoTracks().forEach((t) => (t.enabled = false));
          stream.getAudioTracks().forEach((t) => (t.enabled = false));

          setLocalStream(stream);
          localStreamRef.current = stream;
          setIsCamOn(false);
          setIsMicOn(false);
        } catch (error) {
          console.error("Local media failed", error);
        }
      };
      startMedia();
    }
  }, [isHost, localStream]);

  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadHistory = async () => {
      try {
        const response = await api.get(`/chat/history/${roomCode}`);
        if (Array.isArray(response.data)) setMessages(response.data);
      } catch (err) {
        console.error("History failed", err);
      }
    };
    loadHistory();

    const checkHostStatus = async (retryCount = 0) => {
      try {
        const details = await roomApi.getRoomDetails(roomCode);
        setHostId(details.hostUserId);
        setNumericRoomId(details.roomId);
        if (user && details.hostUserId == user.id) {
          setIsHost(true);
        }
      } catch (error) {
        if (retryCount < 2)
          setTimeout(() => checkHostStatus(retryCount + 1), 1000);
      }
    };
    checkHostStatus();

    if (!isConnected.current) {
      isConnected.current = true;
      connectSocket(
        roomCode,
        (msg) => {
          if (msg.type === "HOST_LEFT") setHostLeft(true);
          else setMessages((prev) => [...prev, msg]);
        },
        (users) => setParticipants(users),
        (signal) => handleIncomingSignal(signal, localStreamRef.current)
      );

      // 🟢 FIX 1: Announce presence so Host starts the call!
      // 🟢 FIX: Prevent Double Join using a Ref
      if (!joinSentRef.current) {
        joinSentRef.current = true; // Mark as sent immediately

        setTimeout(() => {
          // Import sendSignal dynamically to avoid dependency cycles
          import("../../socket/roomSocket").then(({ sendSignal }) => {
            console.log("👋 Sending JOIN signal (ONCE)...");
            sendSignal(roomCode, "join", {});
          });
        }, 1500); // Increased delay slightly to ensure socket is fully ready
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
      />

      <div className="room-container">
        {hostLeft && (
          <div style={styles.overlay}>
            <div style={styles.overlayContent}>
              <h2>Room Closed</h2>
              <p>The host has left the room.</p>
              <div style={styles.countdown}>{countdown}</div>
              <button
                onClick={() => navigate("/rooms")}
                style={styles.overlayBtn}
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        <div className="main-content">
          <div className="video-section">
            <VideoPlayer
              roomCode={roomCode}
              stream={activeStream}
              isHost={isHost}
            />

            {isHost && (
              <div style={styles.controlsSection}>
                {playerState.isMp4 && (
                  <PlayerControls
                    isPlaying={playerState.isPlaying}
                    currentTime={playerState.currentTime}
                    duration={playerState.duration}
                    onPlayPause={handlePlayPause}
                    onStop={handleStop}
                    onSeek={handleSeek}
                    onSkipForward={handleSkipForward}
                    onSkipBack={handleSkipBack}
                    onGoToStart={handleGoToStart}
                    onGoToEnd={handleGoToEnd}
                  />
                )}

                <HostControls
                  onStartMp4={handleStartMp4}
                  onStartScreen={handleStartScreen}
                  onStopScreen={handleStopScreen}
                  fileInputRef={fileInputRef}
                />

                <MediaControls
                  isCamOn={isCamOn}
                  isMicOn={isMicOn}
                  onToggleCam={handleToggleCam}
                  onToggleMic={handleToggleMic}
                  disabled={!localStream}
                />
              </div>
            )}
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
  controlsSection: {
    padding: "0 20px 20px 20px",
    backgroundColor: "#020617",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
  },
};

export default RoomView;
