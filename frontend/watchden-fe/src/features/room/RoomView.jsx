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

const normalizeYoutubeUrl = (input) => {
  const raw = typeof input === "string" ? input.trim() : "";
  if (!raw) return null;
  let videoId = null;
  try {
    // youtu.be/VIDEO_ID
    const shortMatch = raw.match(/(?:youtu\.be\/)([A-Za-z0-9_-]{11})(?:\?|$)/);
    if (shortMatch) {
      videoId = shortMatch[1];
    } else {
      // youtube.com/watch?v=VIDEO_ID or embed/VIDEO_ID
      const watchMatch = raw.match(/(?:v=|\/embed\/)([A-Za-z0-9_-]{11})/);
      if (watchMatch) videoId = watchMatch[1];
    }
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
  } catch (_) {}
  return null;
};

const RoomView = () => {
  const { roomCode: rawRoomCode } = useParams();
  // Ensure case-insensitive matching for the room code
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

  // Player state manages the active media content (MP4, YouTube, or Screen Share)
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isMp4: false,
    isYoutube: false,
    youtubeUrl: null,
    currentTime: 0,
    duration: 0,
    mediaName: null,
  });

  // Local Audio State (controls whether the user hears the audio)
  const [isLocalMuted, setIsLocalMuted] = useState(true);
  const [localVolume, setLocalVolume] = useState(0.5);

  const localStreamRef = useRef(null);
  const isConnected = useRef(false);

  // Refs for managing DOM elements and active streams
  const mp4VideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const joinSentRef = useRef(false);
  const videoPlayerRef = useRef(null);

  // Custom hook for WebRTC peer connections
  const {
    remoteStreams,
    handleIncomingSignal,
    replaceVideoTrack,
    connectToPeer,
  } = useWebRTC(roomCode, user);

  // Track the host's current timestamp and the last heartbeat time for synchronization
  const lastHostTimeRef = useRef(0);
  const lastHeartbeatReceivedAt = useRef(Date.now());

  // --- Player Event Handlers ---

  // Handles play actions triggered by the native video player or custom controls
  const handlePlayerPlay = () => {
    // If Host, broadcast the PLAY command
    if (isHost) {
      if (!playerState.isPlaying) {
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }
      return;
    }

    // If Participant, snap to the host's current time (Live Edge or Heartbeat time)
    if (playerState.isMp4 && videoPlayerRef.current) {
      videoPlayerRef.current.jumpToLive();
    } else if (playerState.isYoutube && videoPlayerRef.current) {
      const hostTime = lastHostTimeRef.current || 0;
      videoPlayerRef.current.seek(hostTime);
    }
  };

  // Handles pause actions triggered by the native video player or custom controls
  const handlePlayerPause = () => {
    // Only the Host can broadcast a PAUSE command
    if (isHost) {
      if (playerState.isPlaying) {
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
    }
  };

  // --- Host Heartbeat Loop ---
  // Sends synchronization data (time, state) to participants every 2 seconds
  useEffect(() => {
    let interval;
    if (isHost && (playerState.isMp4 || playerState.isYoutube)) {
      interval = setInterval(() => {
        let currentTime = 0;

        if (playerState.isYoutube && videoPlayerRef.current) {
          // Ask ReactPlayer for the time
          currentTime = videoPlayerRef.current.getCurrentTime();
        } else if (playerState.isMp4) {
          // Ask local hidden video element for the time
          currentTime = mp4VideoRef.current?.currentTime || 0;
        }

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
  }, [
    isHost,
    playerState.isMp4,
    playerState.isYoutube,
    playerState.mediaName,
    playerState.isPlaying,
    playerState.youtubeUrl,
    roomCode,
  ]);

  // --- Stream Selection Logic ---
  const hostProfile = profileMap[hostId];
  const hostUsername = hostProfile?.username;

  // Determine which stream to display in the VideoPlayer
  const activeStream = isHost
    ? localStream
    : (hostUsername && remoteStreams.get(hostUsername)) ||
      // Fallback: If host username isn't mapped yet, take the first available stream
      (remoteStreams.size > 0 ? remoteStreams.values().next().value : null);

  // --- Playback Control Handlers (Pause, Stop, Seek) ---

  const handlePlayPause = () => {
    // YouTube specific handling via ReactPlayer ref
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

    // Native Video Element (MP4) handling
    const video = mp4VideoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setPlayerState((prev) => ({ ...prev, isPlaying: true }));
      sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
    } else {
      video.pause();
      setPlayerState((prev) => ({ ...prev, isPlaying: false }));
      sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
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

    // 🟢 FIX 1: IMMEDIATELY kill the previous video to stop "Ghost" time updates
    if (mp4VideoRef.current) {
      mp4VideoRef.current.pause();
      mp4VideoRef.current.ontimeupdate = null; // <--- This stops the flickering
      mp4VideoRef.current.onended = null;
      mp4VideoRef.current = null;
    }

    // Clear the input so "onChange" triggers if you pick the same file again after stopping
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    try {
      const { video, stream } = await createMp4Stream(file);
      mp4VideoRef.current = video;

      // Bind video events to update local state
      video.ontimeupdate = () => {
        setPlayerState((prev) => ({ ...prev, currentTime: video.currentTime }));
      };

      video.onloadedmetadata = () => {
        setPlayerState((prev) => ({ ...prev, duration: video.duration }));
      };

      video.onended = () =>
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));

      // Set the stream as local stream for WebRTC broadcasting
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

      // Broadcast LOAD and PLAY commands
      sendMessage(
        roomCode,
        JSON.stringify({ type: "LOAD", filename: file.name }),
        "SYNC"
      );

      setTimeout(() => {
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }, 500);

      // Register stream with backend
      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "MP4",
        source: file.name,
      });

      // Connect to existing participants if necessary
      const currentProfiles = { ...profileMap };
      const missingIds = participants.filter((pId) => !currentProfiles[pId]);

      if (missingIds.length > 0) {
        try {
          const fetchedProfiles = await userApi.getUsersBatch(
            missingIds.map(Number)
          );
          fetchedProfiles.forEach((p) => {
            currentProfiles[p.userId] = p;
          });
          setProfileMap((prev) => ({ ...prev, ...currentProfiles }));
        } catch (e) {
          console.error("Profile fetch failed:", e);
        }
      }

      if (participants && participants.length > 0) {
        participants.forEach((pId) => {
          const pidNum = Number(pId);
          const myId = Number(user.id);
          const pProfile = currentProfiles[pId];

          if (pidNum !== myId && pProfile?.username) {
            connectToPeer(pProfile.username, stream);
          }
        });
      }
    } catch (e) {
      console.error("MP4 Error", e);
    }
  };

  // RoomView.js

  const handleStartScreen = async () => {
    if (!isHost) return;
    try {
      let stream = null;

      // 🟢 FIX: Retry Logic for "Entire Screen" Sharing
      // Some browsers block "audio: true" when sharing the entire screen.
      try {
        // Attempt 1: Try to get video AND audio
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } catch (err) {
        console.warn("Could not get display audio, trying video only...", err);
        // Attempt 2: Fallback to video only
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
      }

      screenStreamRef.current = stream;

      // 1. Set local state
      setLocalStream(stream);
      localStreamRef.current = stream;
      replaceVideoTrack(stream);

      // Force player to wake up
      setPlayerState({
        isPlaying: true,
        isMp4: false,
        isYoutube: false,
        youtubeUrl: null,
        currentTime: 0,
        duration: 0,
        mediaName: "Host Screen",
      });

      // 2. Handle stream stop (user clicks "Stop Sharing" chrome floating bar)
      stream.getVideoTracks()[0].onended = handleStopScreen;

      // 3. Register with API
      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "SCREEN",
        source: "Screen",
      });

      // 🟢 NEW: FORCE CONNECTION TO ALL PARTICIPANTS
      // We must initiate a WebRTC Offer for every participant so they receive the stream.
      // Without this, they get the "SCREEN_SHARE" socket message but no video data.
      if (participants && participants.length > 0) {
        participants.forEach((pId) => {
          const pidNum = Number(pId);
          const myId = Number(user.id);
          const pProfile = profileMap[pId]; // Ensure profileMap is up to date

          if (pidNum !== myId && pProfile?.username) {
            console.log(`📡 Offering Screen Share to ${pProfile.username}...`);
            connectToPeer(pProfile.username, stream);
          }
        });
      }

      // 4. Broadcast Signal to Participants
      sendMessage(roomCode, JSON.stringify({ type: "SCREEN_SHARE" }), "SYNC");
    } catch (e) {
      console.error("Screen Share Error", e);
      alert("Failed to start screen share. Please check browser permissions.");
    }
  };

  const handleStartYoutube = async (url) => {
    if (!isHost || !url) return;

    const normalizedUrl = normalizeYoutubeUrl(url);
    if (!normalizedUrl) {
      console.warn("Invalid YouTube URL:", url);
      return;
    }

    // FIX: Manual Cleanup to avoid sending a "STOP" message
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    if (mp4VideoRef.current) {
      mp4VideoRef.current.pause();
      mp4VideoRef.current = null;
    }

    // Clear local stream tracks
    setLocalStream(null);
    localStreamRef.current = null;
    replaceVideoTrack(null);

    // Stop backend stream if active
    try {
      // 🟢 FIX: Use 'numericRoomId', NOT 'roomCode'
      if (numericRoomId) {
        await streamApi.stopStream({
          roomId: numericRoomId, // <--- Was 'roomCode' (String), changed to Numeric ID
          userId: user.id,
        });
      }
    } catch (e) {
      // Ignore error if stream wasn't running
      console.warn("Stop stream API failed (ignoring):", e);
    }

    // Update State
    setPlayerState({
      isPlaying: true,
      isMp4: false,
      isYoutube: true,
      currentTime: 0,
      duration: 0,
      mediaName: "YouTube Video",
      youtubeUrl: normalizedUrl,
    });

    // Broadcast Load Command
    sendMessage(
      roomCode,
      JSON.stringify({ type: "LOAD_YOUTUBE", url: normalizedUrl }),
      "SYNC"
    );
  };

  const handleStopScreen = async () => {
    if (!isHost) return;

    const hasActiveStream = !!screenStreamRef.current || !!mp4VideoRef.current;

    // Stop tracks for any active streams
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

    // Clear local stream (effectively showing waiting screen)
    setLocalStream(null);
    localStreamRef.current = null;
    replaceVideoTrack(null);

    if (hasActiveStream) {
      try {
        await streamApi.stopStream({ roomId: numericRoomId, userId: user.id });
      } catch (e) {
        console.warn("Stop stream API failed (ignoring):", e);
      }
    }
  };

  // --- Effects ---

  // Handle User Auth State
  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(authUtils.getUser());
    };
    window.addEventListener("user-updated", handleUserUpdate);

    const handleBeforeUnload = (e) => {
      if (isHost && (playerState.isMp4 || playerState.isYoutube)) {
        e.preventDefault();
        e.returnValue =
          "You are hosting a stream. Leaving will stop playback. Are you sure?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("user-updated", handleUserUpdate);
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isHost, playerState.isMp4, playerState.isYoutube]);

  const handleLogout = () => {
    authUtils.clearAuth();
    setUser(null);
    navigate("/login");
  };

  // Sync Profiles for all participants to map IDs to Usernames
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
        console.error("Profile sync failed", err);
      }
    };
    syncProfiles();
  }, [participants, hostId]);

  // Handle Host Leaving
  useEffect(() => {
    let timer;
    if (hostLeft && countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    } else if (hostLeft && countdown === 0) {
      navigate("/rooms");
    }
    return () => clearInterval(timer);
  }, [hostLeft, countdown, navigate]);

  // Watchdog: Monitor heartbeat from host to detect disconnects
  useEffect(() => {
    if (isHost) return;

    const checkInterval = setInterval(() => {
      if (playerState.isYoutube || playerState.isMp4) {
        const timeSinceLastHeartbeat =
          Date.now() - lastHeartbeatReceivedAt.current;

        if (timeSinceLastHeartbeat > 10000) {
          console.warn(
            `⚠️ Host Heartbeat lost for ${timeSinceLastHeartbeat}ms! Resetting to Waiting Room...`
          );

          setPlayerState((prev) => {
            if (!prev.isYoutube && !prev.isMp4) return prev;
            return {
              ...prev,
              isPlaying: false,
              isMp4: false,
              isYoutube: false,
              youtubeUrl: null,
              mediaName: null,
            };
          });
          lastHeartbeatReceivedAt.current = Date.now();
        }
      }
    }, 2000);

    return () => clearInterval(checkInterval);
  }, [isHost, playerState.isYoutube, playerState.isMp4]);

  // Initial Room Setup (Join, History, Check Host, Socket)
  useEffect(() => {
    if (!authUtils.isAuthenticated()) {
      navigate("/login");
      return;
    }

    const joinRoomOnLoad = async () => {
      try {
        await roomApi.joinRoom(roomCode);
        console.log("Joined room successfully on load");
      } catch (error) {
        if (
          error.response &&
          error.response.status !== 409 &&
          error.response.data?.message !== "User already joined this room"
        ) {
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
          else if (String(msg.type).toUpperCase() === "SYNC") {
            try {
              const action = JSON.parse(msg.content);
              lastHeartbeatReceivedAt.current = Date.now();

              // Handle Synchronization Commands from Host
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
              } else if (action.type === "SCREEN_SHARE") {
                // FIX: Handle Screen Share Broadcast
                setPlayerState((prev) => ({
                  ...prev,
                  isMp4: false,
                  isYoutube: false,
                  youtubeUrl: null,
                  isPlaying: true, // Vital: Unlocks the 'stream' check in VideoPlayer
                  mediaName: "Host Screen",
                }));
              } else if (action.type === "LOAD_YOUTUBE") {
                const url = normalizeYoutubeUrl(action.url) || action.url;
                if (url) {
                  setPlayerState((prev) => ({
                    ...prev,
                    isMp4: false,
                    isYoutube: true,
                    youtubeUrl: url,
                    mediaName: "YouTube Video",
                    isPlaying: true,
                  }));
                }
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

                // 🟢 DEBUG LOG: See what the heartbeat says about YouTube
                if (action.isYoutube) {
                  console.log(
                    `[Socket Debug] Heartbeat -> YouTube Active. Time: ${action.time}, HostPlaying: ${action.isPlaying}`
                  );
                }

                setPlayerState((prev) => {
                  let newState = { ...prev };
                  let hasChanged = false;

                  // Enforce Youtube State if Host dictates
                  if (!isHost && action.isYoutube && action.youtubeUrl) {
                    const normalizedUrl =
                      normalizeYoutubeUrl(action.youtubeUrl) ||
                      action.youtubeUrl;

                    if (!prev.isYoutube || prev.youtubeUrl !== normalizedUrl) {
                      newState.isYoutube = true;
                      newState.isMp4 = false;
                      newState.youtubeUrl = normalizedUrl;
                      newState.mediaName = action.mediaName || "YouTube Video";
                      hasChanged = true;
                    }
                  }
                  // Enforce MP4 State if Host dictates
                  else if (!isHost && action.isMp4) {
                    if (!prev.isMp4 || prev.mediaName !== action.mediaName) {
                      newState.isMp4 = true;
                      newState.isYoutube = false;
                      newState.mediaName = action.mediaName;
                      hasChanged = true;
                    }
                  }

                  // Enforce Play/Pause State
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
              console.error("Failed to parse SYNC payload", e);
            }
          }
          // Handle Chat Messages
          else if (msg.type === "CHAT") {
            setMessages((prev) => {
              // Deduplicate logic to prevent double messages
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
        (users) => {
          setParticipants(users);
        },
        (signal) => handleIncomingSignal(signal, localStreamRef.current)
      );

      // Send Join Signal to initialize WebRTC connection
      if (!joinSentRef.current) {
        joinSentRef.current = true;
        setTimeout(() => {
          import("../../socket/roomSocket").then(({ sendSignal }) => {
            sendSignal(roomCode, "join", {});
          });
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
              onProgress={(time) => {
                if (isHost) {
                  setPlayerState((prev) => ({
                    ...prev,
                    currentTime: time,
                  }));
                }
              }}
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

            {/* Unified Controls Container (Hover Overlay) */}
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
              {/* Host Control Panel */}
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

              {/* Player Controls (Seek bar, Play/Pause, Volume) */}
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
  controlsSection: {
    padding: "0 20px 20px 20px",
    backgroundColor: "#020617",
    borderBottomLeftRadius: "12px",
    borderBottomRightRadius: "12px",
  },
};

export default RoomView;
