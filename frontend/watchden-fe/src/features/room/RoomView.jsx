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
  const videoPlayerRef = useRef(null); // 🟢 Ref to control VideoPlayer

  const { remoteStreams, handleIncomingSignal, replaceVideoTrack, connectToPeer } = useWebRTC(
    roomCode,
    user
  );

  const lastHostTimeRef = useRef(0); // 🟢 Track Host Time

  // 🟢 PARTICIPANT: Handle "Snap to Host" on Play
  const handleParticipantPlay = () => {
    if (!isHost && playerState.isMp4 && videoPlayerRef.current) {
      // Snap to "Live" edge to sync with Host
      console.log("⚡ Snapping to Live Stream...");
      videoPlayerRef.current.jumpToLive();
    }
  };

  // 🟢 HOST: Send Heartbeat (Time Sync + State) Every 2s
  // 🟢 HOST: Send Heartbeat (Time Sync + State) Every 2s
  useEffect(() => {
    let interval;
    if (isHost && playerState.isMp4) {
      interval = setInterval(() => {
        const currentTime = mp4VideoRef.current?.currentTime || 0;
        import("../../socket/roomSocket").then(({ sendMessage }) => {
          // Include isMp4 and mediaName so new joiners can sync state
          const payload = {
            type: "HEARTBEAT",
            time: currentTime,
            isMp4: true,
            mediaName: playerState.mediaName,
            isPlaying: playerState.isPlaying // 🟢 Send Play Status too
          };
          sendMessage(roomCode, JSON.stringify(payload), "SYNC");
        });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [isHost, playerState.isMp4, playerState.mediaName, playerState.isPlaying, roomCode]);

  // 🟢 FIX 1: Robust Stream Selection (The "Safety Net")
  const hostProfile = profileMap[hostId];
  const hostUsername = hostProfile?.username;

  // Debugging log to see if we found the stream
  console.log("Stream Select:", {
    hostId,
    hostUsername,
    streamsSize: remoteStreams.size,
    streamKeys: Array.from(remoteStreams.keys())
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

    // Import sendMessage dynamically
    import("../../socket/roomSocket").then(({ sendMessage }) => {
      // 🟢 Payload is JSON string inside 'content' field
      if (video.paused) {
        video.play();
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      } else {
        video.pause();
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
    });
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

      console.log("✅ Local Stream Set:", stream.id);

      await video.play();
      setPlayerState({
        isPlaying: true,
        isMp4: true,
        currentTime: 0,
        duration: video.duration || 0,
        mediaName: file.name // Local state update
      });
      console.log("✅ Player State Updated, playing video...");

      // 🟢 Broadcast LOAD Signal so others see thumbnail/title
      // AND Broadcast PLAY immediately so it auto-starts for everyone
      import("../../socket/roomSocket").then(({ sendMessage }) => {
        sendMessage(roomCode, JSON.stringify({ type: "LOAD", filename: file.name }), "SYNC");

        setTimeout(() => {
          sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
        }, 500); // Small delay to ensure LOAD handles first
      });

      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "MP4",
        source: file.name,
      });

      // 🟢 FIX: Ensure we have usernames before connecting (Fixes "Skipped Connection" on fast refresh)
      const currentProfiles = { ...profileMap };
      const missingIds = participants.filter(pId => !currentProfiles[pId]);

      if (missingIds.length > 0) {
        console.log("⏳ Fetching missing profiles for:", missingIds);
        try {
          const fetchedProfiles = await userApi.getUsersBatch(missingIds.map(Number));
          fetchedProfiles.forEach(p => {
            currentProfiles[p.userId] = p;
          });
          setProfileMap(prev => ({ ...prev, ...currentProfiles }));
        } catch (e) {
          console.error("Profile fetch failed:", e);
        }
      }

      // 🟢 FIX: Host Refreshed? Proactively connect to everyone!
      if (participants && participants.length > 0) {
        console.log("📡 Broadcasting Stream to Participants:", participants);
        participants.forEach(pId => {
          const pidNum = Number(pId);
          const myId = Number(user.id);

          // Let's rely on profileMap to get username for the ID
          const pProfile = currentProfiles[pId]; // Use local map copy
          if (pidNum !== myId && pProfile?.username) {
            connectToPeer(pProfile.username, stream);
          } else {
            console.warn(`⚠️ Skipping ${pId}: No username found (MyID: ${myId})`);
          }
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

    // 🟢 Prevent Accidental Host Refresh
    const handleBeforeUnload = (e) => {
      if (isHost && playerState.isMp4) {
        e.preventDefault();
        e.returnValue = "You are hosting a stream. Leaving will stop playback. Are you sure?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isHost, playerState.isMp4]);

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

    //This will increase the count of participants in the public room in roomList
    const joinRoomOnLoad = async () => {
      try {
        // Attempt to join the room in the backend to register participant
        await roomApi.joinRoom(roomCode);
        console.log("Joined room successfully on load");
      } catch (error) {
        // Ignore "Already Joined" errors, but log others
        if (error.response && error.response.status !== 409 && error.response.data?.message !== "User already joined this room") {
          console.error("Failed to auto-join room:", error);
        }
      }
    };
    joinRoomOnLoad();

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
          // 🟢 Handle SYNC/SYSTEM Messages (Do NOT add to chat)
          else if (msg.type === "SYNC") {
            console.log("🔄 SYNC Signal:", msg.content);
            try {
              const action = JSON.parse(msg.content);
              if (action.type === "PAUSE" && videoPlayerRef.current) {
                videoPlayerRef.current.pause();
              } else if (action.type === "PLAY" && videoPlayerRef.current) {
                videoPlayerRef.current.play();
              } else if (action.type === "LOAD") {
                // 🟢 Handle Media Load (Thumbnail)
                setPlayerState(prev => ({
                  ...prev,
                  isMp4: true,
                  mediaName: action.filename
                }));
              } else if (action.type === "HEARTBEAT") {
                // 🟢 Update Host Time Ref
                lastHostTimeRef.current = action.time;

                // 🟢 Late Joiner / Refresh Logic:
                // If we don't know it's an MP4 yet, but Host says it is, UPDATE STATE!
                // Also update isPlaying status if provided
                setPlayerState(prev => {
                  if (!prev.isMp4 && action.isMp4) {
                    console.log("⚡ Auto-Syncing State from Heartbeat");
                    return {
                      ...prev,
                      isMp4: true,
                      mediaName: action.mediaName,
                      isPlaying: action.isPlaying ?? prev.isPlaying
                    };
                  }
                  // Even if already MP4, sync Play/Pause status occasionally? 
                  // Let's rely on event stream for main sync, but this is a backup.
                  if (prev.isMp4 && action.isPlaying !== undefined && action.isPlaying !== prev.isPlaying) {
                    return { ...prev, isPlaying: action.isPlaying };
                  }
                  return prev;
                });
              }
            } catch (e) {
              console.error("Failed to parse SYNC payload", e);
            }
          }
          // Only add actual CHAT messages to UI
          else if (msg.type === "CHAT") {
            setMessages((prev) => [...prev, msg]);
          }
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
              key={activeStream ? activeStream.id : "no-stream"}
              ref={videoPlayerRef}
              roomCode={roomCode}
              stream={activeStream}
              isHost={isHost}
              mediaName={playerState.mediaName}
              isMp4={playerState.isMp4}
              onPlay={handleParticipantPlay}
            />

            {/* 🟢 CONTROLS SECTION (For Host AND Participants) */}
            <div style={styles.controlsSection}>
              {playerState.isMp4 && (
                <PlayerControls
                  isPlaying={playerState.isPlaying}
                  currentTime={playerState.currentTime}
                  duration={playerState.duration}
                  isHost={isHost}
                  onPlayPause={isHost ? handlePlayPause : () => {
                    // 🟢 Participant Toggle: Local Pause vs Jump-To-Live
                    if (playerState.isPlaying) {
                      videoPlayerRef.current?.pause();
                      setPlayerState(p => ({ ...p, isPlaying: false }));
                    } else {
                      videoPlayerRef.current?.play(); // Triggers onPlay -> jumpToLive
                      setPlayerState(p => ({ ...p, isPlaying: true }));
                    }
                  }}
                  onStop={handleStop}
                  onSeek={handleSeek}
                  onSkipForward={handleSkipForward}
                  onSkipBack={handleSkipBack}
                  onGoToStart={handleGoToStart}
                  onGoToEnd={handleGoToEnd}
                />
              )}

              {isHost && (
                <>
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
                </>
              )}
            </div>
          </div>
        </div>

        <div className="sidebar">
          <div className="participants-section">
            {/* Pass profileMap to resolve names in the list */}
            <ParticipantList
              participants={participants}
              profileMap={profileMap}
            />
          </div>
          <div className="chat-section">
            {/* Pass profileMap to resolve names in chat bubbles */}
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
