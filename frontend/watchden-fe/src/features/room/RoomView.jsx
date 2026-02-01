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
import { getLocalMedia } from "../../hooks/useLocalMedia";
import { createMp4Stream } from "../../hooks/useMP4Stream";
import HostControls from "./HostControls";
import MediaControls from "./MediaControls";
import PlayerControls from "./PlayerControls";
import "./room.css";

const RoomView = () => {
  const { roomCode: rawRoomCode } = useParams();
  const roomCode = rawRoomCode?.toUpperCase(); // 🟢 Case-insensitive matching
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
    isYoutube: false, // 🟢 Initialize
    youtubeUrl: null, // 🟢 Initialize
    currentTime: 0,
    duration: 0,
    mediaName: null,
  });

  const [isCamOn, setIsCamOn] = useState(false);
  const [isMicOn, setIsMicOn] = useState(false);

  // 🟢 LOCAL AUDIO STATE
  const [isLocalMuted, setIsLocalMuted] = useState(true); // Start muted (autoplay policy)
  const [localVolume, setLocalVolume] = useState(0.5);

  const localStreamRef = useRef(null);
  const isConnected = useRef(false);

  // Refs
  const mp4VideoRef = useRef(null);
  const screenStreamRef = useRef(null);
  const fileInputRef = useRef(null);
  const joinSentRef = useRef(false);
  const videoPlayerRef = useRef(null); // 🟢 Ref to control VideoPlayer

  const {
    remoteStreams,
    handleIncomingSignal,
    replaceVideoTrack,
    connectToPeer,
  } = useWebRTC(roomCode, user);

  const lastHostTimeRef = useRef(0); // 🟢 Track Host Time
  const lastHeartbeatReceivedAt = useRef(Date.now()); // 🟢 Track Wall Clock Time of last heartbeat

  // 🟢 HANDLE PLAYER EVENTS (Native Controls or Auto-Play)
  const handlePlayerPlay = () => {
    // HOST: Broadcast PLAY
    if (isHost) {
      if (!playerState.isPlaying) {
        console.log("▶ HOST: Native Play Detected -> Broadcasting...");
        setPlayerState((prev) => ({ ...prev, isPlaying: true }));
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }
      return;
    }

    // PARTICIPANT: Snap to Host
    // 1. MP4 Snap to Live Edge (Buffer end)
    if (playerState.isMp4 && videoPlayerRef.current) {
      console.log("⚡ MP4: Snapping to Live Edge...");
      videoPlayerRef.current.jumpToLive();
    }
    // 2. YouTube Snap to Host Time (Heartbeat)
    else if (playerState.isYoutube && videoPlayerRef.current) {
      const hostTime = lastHostTimeRef.current || 0;
      console.log(`⚡ YouTube: Snapping to Host Time: ${hostTime}s`);
      videoPlayerRef.current.seek(hostTime);
    }
  };

  const handlePlayerPause = () => {
    // HOST: Broadcast PAUSE
    if (isHost) {
      if (playerState.isPlaying) {
        console.log("⏸ HOST: Native Pause Detected -> Broadcasting...");
        setPlayerState((prev) => ({ ...prev, isPlaying: false }));
        sendMessage(roomCode, JSON.stringify({ type: "PAUSE" }), "SYNC");
      }
    }
  };

  // 🟢 HOST: Send Heartbeat (Time Sync + State) Every 2s
  useEffect(() => {
    let interval;
    // 🟢 Enable Heartbeat for MP4 OR YouTube
    if (isHost && (playerState.isMp4 || playerState.isYoutube)) {
      interval = setInterval(() => {
        const currentTime = mp4VideoRef.current?.currentTime || 0;

        // Include isMp4 and mediaName so new joiners can sync state
        const payload = {
          type: "HEARTBEAT",
          time: currentTime,
          isMp4: playerState.isMp4,
          isYoutube: playerState.isYoutube, // 🟢 Send YouTube flag
          youtubeUrl: playerState.youtubeUrl, // 🟢 Send URL
          mediaName: playerState.mediaName,
          isPlaying: playerState.isPlaying,
        };
        console.log("💓 HOST SENDING HEARTBEAT:", payload); // 🟢 LOG
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

  // 🟢 FIX 1: Robust Stream Selection (The "Safety Net")
  const hostProfile = profileMap[hostId];
  const hostUsername = hostProfile?.username;

  // Debugging log to see if we found the stream
  console.log("Stream Select:", {
    hostId,
    hostUsername,
    streamsSize: remoteStreams.size,
    streamKeys: Array.from(remoteStreams.keys()),
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
    // 🟢 YouTube: use VideoPlayer ref (ReactPlayer); MP4: use native video element
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
        mediaName: file.name, // Local state update
      });
      console.log("✅ Player State Updated, playing video...");

      // 🟢 Broadcast LOAD Signal so others see thumbnail/title
      // AND Broadcast PLAY immediately so it auto-starts for everyone
      sendMessage(
        roomCode,
        JSON.stringify({ type: "LOAD", filename: file.name }),
        "SYNC"
      );

      setTimeout(() => {
        sendMessage(roomCode, JSON.stringify({ type: "PLAY" }), "SYNC");
      }, 500); // Small delay to ensure LOAD handles first

      await streamApi.startStream({
        roomId: numericRoomId,
        userId: user.id,
        type: "MP4",
        source: file.name,
      });

      // 🟢 FIX: Ensure we have usernames before connecting (Fixes "Skipped Connection" on fast refresh)
      const currentProfiles = { ...profileMap };
      const missingIds = participants.filter((pId) => !currentProfiles[pId]);

      if (missingIds.length > 0) {
        console.log("⏳ Fetching missing profiles for:", missingIds);
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

      // 🟢 FIX: Host Refreshed? Proactively connect to everyone!
      if (participants && participants.length > 0) {
        console.log("📡 Broadcasting Stream to Participants:", participants);
        participants.forEach((pId) => {
          const pidNum = Number(pId);
          const myId = Number(user.id);

          // Let's rely on profileMap to get username for the ID
          const pProfile = currentProfiles[pId]; // Use local map copy
          if (pidNum !== myId && pProfile?.username) {
            connectToPeer(pProfile.username, stream);
          } else {
            console.warn(
              `⚠️ Skipping ${pId}: No username found (MyID: ${myId})`
            );
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

  // 🟢 Normalize YouTube URL so ReactPlayer can load it (handles youtu.be, extra params, whitespace)
  const normalizeYoutubeUrl = (input) => {
    const raw = typeof input === "string" ? input.trim() : "";
    if (!raw) return null;
    let videoId = null;
    try {
      // youtu.be/VIDEO_ID
      const shortMatch = raw.match(
        /(?:youtu\.be\/)([A-Za-z0-9_-]{11})(?:\?|$)/
      );
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

  // 🟢 YouTube Handler: normalize URL, await stop, then set state and broadcast
  const handleStartYoutube = async (url) => {
    if (!isHost || !url) return;

    const normalizedUrl = normalizeYoutubeUrl(url);
    if (!normalizedUrl) {
      console.warn("Invalid YouTube URL:", url);
      return;
    }

    // Stop any existing stream first so our setState runs last (fixes isPlaying being overwritten)
    await handleStopScreen();

    // Update Local State (after stop so it isn't overwritten)
    setPlayerState({
      isPlaying: true,
      isMp4: false,
      isYoutube: true,
      currentTime: 0,
      duration: 0,
      mediaName: "YouTube Video",
      youtubeUrl: normalizedUrl,
    });

    // Broadcast Signal with normalized URL so all clients get a valid URL
    // Broadcast Signal with normalized URL so all clients get a valid URL
    sendMessage(
      roomCode,
      JSON.stringify({ type: "LOAD_YOUTUBE", url: normalizedUrl }),
      "SYNC"
    );
  };

  const handleStopScreen = async () => {
    if (!isHost) return;

    // 🟢 Fix 500 Error: Check if we actually HAVE a stream to stop before calling backend
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

    // 🟢 Broadcast STOP to all participants so they reset too
    sendMessage(roomCode, JSON.stringify({ type: "STOP" }), "SYNC");

    const camStream = await getLocalMedia();
    camStream.getVideoTracks()[0].enabled = isCamOn;
    camStream.getAudioTracks()[0].enabled = isMicOn;

    setLocalStream(camStream);
    localStreamRef.current = camStream;
    replaceVideoTrack(camStream);

    if (hasActiveStream) {
      try {
        await streamApi.stopStream({ roomId: roomCode, userId: user.id });
      } catch (e) {
        console.warn("Stop stream API failed (ignoring):", e);
      }
    }
  };

  // --- EFFECTS ---
  useEffect(() => {
    const handleUserUpdate = () => {
      setUser(authUtils.getUser());
    };
    window.addEventListener("user-updated", handleUserUpdate);

    // 🟢 Prevent Accidental Host Refresh
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

  // 🟢 FIX 2: Explicitly fetch Host Profile (Fixes undefined username)
  useEffect(() => {
    const syncProfiles = async () => {
      // Create a set of IDs to fetch: Participants + Host
      const uniqueIds = new Set(participants.map((id) => Number(id)));
      if (hostId) uniqueIds.add(Number(hostId));

      console.log("🔄 Syncing Profiles for IDs:", Array.from(uniqueIds));

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

  // 🟢 WATCHDOG: Detect if Host Stops Sending Heartbeats (Refresh/Close)
  useEffect(() => {
    if (isHost) return; // Host doesn't need to watch themselves

    const checkInterval = setInterval(() => {
      // Only check if we are actually in a session (YouTube or MP4)
      if (playerState.isYoutube || playerState.isMp4) {
        const timeSinceLastHeartbeat =
          Date.now() - lastHeartbeatReceivedAt.current;

        // If no heartbeat for > 10 seconds (Heartbeat is every 2s, so 10s is safe buffer against jitter)
        if (timeSinceLastHeartbeat > 10000) {
          console.warn(
            `⚠️ Host Heartbeat lost for ${timeSinceLastHeartbeat}ms! Resetting to Waiting Room...`
          );

          setPlayerState((prev) => {
            // Only reset if actually playing something to avoid infinite loops
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
          // Reset timer so we don't spam
          lastHeartbeatReceivedAt.current = Date.now();
        }
      }
    }, 2000); // Check every 2 seconds

    return () => clearInterval(checkInterval);
  }, [isHost, playerState.isYoutube, playerState.isMp4]); // Re-run when mode changes

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
          // 🟢 Handle SYNC/SYSTEM Messages (Do NOT add to chat) — robust to casing/numeric enum
          else if (String(msg.type).toUpperCase() === "SYNC") {
            console.log("🔄 SYNC Signal:", msg.content);
            try {
              const action = JSON.parse(msg.content);
              // 🟢 ANY Valid Signal from Host resets the Watchdog timer
              lastHeartbeatReceivedAt.current = Date.now();
              console.log("SYNC received, action.type:", action?.type);
              // 🟢 SYNC HANDLER
              if (action.type === "PAUSE") {
                console.log("⏸️ SYNC: PAUSE");
                videoPlayerRef.current?.pause();
                setPlayerState((prev) => ({ ...prev, isPlaying: false }));
              } else if (action.type === "PLAY") {
                console.log("▶ SYNC: PLAY");
                videoPlayerRef.current?.play();
                setPlayerState((prev) => ({ ...prev, isPlaying: true }));
              } else if (action.type === "LOAD") {
                console.log("📂 SYNC: LOAD", action.filename);
                setPlayerState((prev) => ({
                  ...prev,
                  isMp4: true,
                  isYoutube: false,
                  mediaName: action.filename,
                  isPlaying: false, // Reset to paused on load
                }));
              } else if (action.type === "LOAD_YOUTUBE") {
                console.log("📺 SYNC: LOAD_YOUTUBE", action.url);
                const url = normalizeYoutubeUrl(action.url) || action.url;
                if (url) {
                  setPlayerState((prev) => ({
                    ...prev,
                    isMp4: false,
                    isYoutube: true,
                    youtubeUrl: url,
                    mediaName: "YouTube Video",
                    isPlaying: true, // Auto-play on load
                  }));
                }
              } else if (action.type === "STOP") {
                console.log("⏹️ SYNC: STOP");
                setPlayerState((prev) => ({
                  ...prev,
                  isMp4: false,
                  isYoutube: false,
                  youtubeUrl: null,
                  mediaName: null,
                  isPlaying: false,
                }));
              } else if (action.type === "HEARTBEAT") {
                // 🟢 Update Host Time Ref
                lastHostTimeRef.current = action.time;
                lastHeartbeatReceivedAt.current = Date.now(); // 🟢 Update timestamp

                setPlayerState((prev) => {
                  let newState = { ...prev };
                  let hasChanged = false;

                  // 🟢 FORCE SYNC: If Host says YouTube, IT IS YOUTUBE (unless we are host)
                  if (!isHost && action.isYoutube && action.youtubeUrl) {
                    const normalizedUrl =
                      normalizeYoutubeUrl(action.youtubeUrl) ||
                      action.youtubeUrl;

                    if (!prev.isYoutube || prev.youtubeUrl !== normalizedUrl) {
                      console.log(
                        "⚡ HEARTBEAT FORCE SYNC: YouTube Mode",
                        normalizedUrl
                      );
                      newState.isYoutube = true;
                      newState.isMp4 = false;
                      newState.youtubeUrl = normalizedUrl;
                      newState.mediaName = action.mediaName || "YouTube Video";
                      hasChanged = true;
                    }
                  }
                  // 🟢 FORCE SYNC: If Host says MP4, IT IS MP4
                  else if (!isHost && action.isMp4) {
                    if (!prev.isMp4 || prev.mediaName !== action.mediaName) {
                      console.log(
                        "⚡ HEARTBEAT FORCE SYNC: MP4 Mode",
                        action.mediaName
                      );
                      newState.isMp4 = true;
                      newState.isYoutube = false;
                      newState.mediaName = action.mediaName;
                      hasChanged = true;
                    }
                  }

                  // 🟢 SYNC PLAY/PAUSE (Always, for everyone)
                  if (
                    action.isPlaying !== undefined &&
                    action.isPlaying !== prev.isPlaying
                  ) {
                    console.log(
                      "⚡ HEARTBEAT FORCE SYNC: isPlaying =",
                      action.isPlaying
                    );
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
          // Only add actual CHAT messages to UI
          else if (msg.type === "CHAT") {
            setMessages((prev) => {
              // 🟢 FIX: Deduplicate Messages (Prevent "Double Text" on Join)
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
          console.log("👥 Socket Participants update:", users);
          setParticipants(users);
        },
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
        disableProfileLink={true} // 🟢 Disable Profile Link in Room to prevent Zombie Rooms
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
            }}
          >
            <VideoPlayer
              // 🟢 FORCE KEY CHANGE: Ensure remount when switching modes to avoid state stuck
              key={
                playerState.isYoutube
                  ? `youtube-${playerState.youtubeUrl}`
                  : activeStream
                    ? activeStream.id
                    : "no-stream"
              }
              ref={videoPlayerRef}
              roomCode={roomCode}
              // 🟢 FIX: Only pass stream if MP4 (paused/playing) OR active playback (Screen Share).
              // If stopped/idle, pass null to force "Waiting" screen.
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
              isPlaying={playerState.isPlaying} // 🟢 Pass Play State!
              onPlay={handlePlayerPlay}
              onPause={handlePlayerPause}
              // 🟢 AUDIO PROPS
              muted={isLocalMuted}
              volume={localVolume}
            />

            {/* 🟢 UNIFIED CONTROLS CONTAINER */}
            {/* This container handles the Hover, Position, and Stacking */}
            <div
              className="host-controls-wrapper" // Make sure this class is in room.css!
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                width: "100%",
                display: "flex",
                flexDirection: "column", // Stack them vertically
                justifyContent: "flex-end", // Push to bottom
                alignItems: "center", // Center horizontally
                padding: "20px 20px 40px 20px", // Extra bottom padding for look
                background:
                  "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
                zIndex: 50,
                gap: "10px", // Gap between HostControls and PlayerControls
              }}
            >
              {/* 1. Host Controls (Top of stack) */}
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

              {/* 2. Player Controls (Bottom of stack) */}
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
            {/* Pass profileMap to resolve names in the list */}
            <ParticipantList
              participants={participants}
              profileMap={profileMap}
            />
          </div>
          <div className="chat-section">
            {/* Chat Panel (Right Sidebar) */}
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
