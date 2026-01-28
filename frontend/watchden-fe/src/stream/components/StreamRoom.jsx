import React, { useEffect, useRef, useState } from "react";
import { createStompClient } from "../hooks/useStompClient";
import { getLocalMedia } from "../hooks/useLocalMedia";
import { createPeerConnection } from "../hooks/useWebRTC";
import { createMp4Stream } from "../hooks/useMp4Stream";
import { getStreamState } from "../api/streamApi";
import VideoGrid from "./VideoGrid";
import MediaControls from "./MediaControls";
import HostControls from "./HostControls";

const StreamRoom = ({ roomId, userId, isHost }) => {
  const [streams, setStreams] = useState({});
  const [playState, setPlayState] = useState("STOPPED");

  const localStreamRef = useRef(null);
  const mp4VideoRef = useRef(null);
  const screenStreamRef = useRef(null);

  const stompRef = useRef(null);
  const peersRef = useRef({});
  const iceQueueRef = useRef({});

  /* Camera + Mic */
  useEffect(() => {
    getLocalMedia(true, true).then((stream) => {
      localStreamRef.current = stream;
      setStreams((s) => ({ ...s, [userId]: stream }));
    });
  }, [userId]);

  /* Late join sync */
  useEffect(() => {
    getStreamState(roomId).then((res) => {
      if (res?.data?.status) setPlayState(res.data.status);
    });
  }, [roomId]);

  /* STOMP */
  useEffect(() => {
    stompRef.current = createStompClient(roomId, handleSignal);

    stompRef.current?.publish({
      destination: `/app/rooms/${roomId}/signal`,
      body: JSON.stringify({ type: "JOIN", fromUserId: userId }),
    });

    return () => stompRef.current?.deactivate();
  }, [roomId]);

  /* Signaling */
  const handleSignal = async (msg) => {
    const { type, fromUserId, payload, action, time } = msg;

    if (type === "STREAM_CONTROL") {
      applyStreamControl(action, time);
      return;
    }

    if (type === "JOIN" && isHost) {
      createOfferFor(fromUserId);
      return;
    }

    if (!fromUserId || fromUserId === userId) return;

    let pc = peersRef.current[fromUserId];
    if (!pc) {
      pc = createPeerConnection(
        fromUserId,
        localStreamRef.current,
        addRemoteStream,
        sendIce
      );
      peersRef.current[fromUserId] = pc;
    }

    if (type === "OFFER") {
      await pc.setRemoteDescription(payload);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal("ANSWER", fromUserId, answer);
    }

    if (type === "ANSWER") {
      await pc.setRemoteDescription(payload);
    }

    if (type === "ICE_BATCH") {
      for (const c of payload) await pc.addIceCandidate(c);
    }
  };

  const createOfferFor = async (peerId) => {
    if (!isHost) return;

    const pc = createPeerConnection(
      peerId,
      localStreamRef.current,
      addRemoteStream,
      sendIce
    );
    peersRef.current[peerId] = pc;

    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    sendSignal("OFFER", peerId, offer);
  };

  const addRemoteStream = (peerId, stream) => {
    setStreams((s) => ({ ...s, [peerId]: stream }));
  };

  const sendIce = (toUserId, candidate) => {
    if (!iceQueueRef.current[toUserId]) {
      iceQueueRef.current[toUserId] = [];
    }

    iceQueueRef.current[toUserId].push(candidate);

    if (iceQueueRef.current[toUserId].length >= 5) {
      stompRef.current.publish({
        destination: `/app/rooms/${roomId}/signal`,
        body: JSON.stringify({
          type: "ICE_BATCH",
          toUserId,
          payload: iceQueueRef.current[toUserId],
        }),
      });
      iceQueueRef.current[toUserId] = [];
    }
  };

  const sendSignal = (type, toUserId, payload) => {
    stompRef.current?.publish({
      destination: `/app/rooms/${roomId}/signal`,
      body: JSON.stringify({
        roomId,
        fromUserId: userId,
        toUserId,
        type,
        payload,
      }),
    });
  };

  const broadcastControl = (action, time = 0) => {
    if (!isHost) return;

    stompRef.current?.publish({
      destination: `/app/rooms/${roomId}/signal`,
      body: JSON.stringify({ type: "STREAM_CONTROL", action, time }),
    });
  };

  const replaceTracksForAllPeers = (stream) => {
    if (!isHost) return;

    Object.values(peersRef.current).forEach((pc) => {
      pc.getSenders().forEach((sender) => {
        const track = stream
          .getTracks()
          .find((t) => t.kind === sender.track?.kind);
        if (track) sender.replaceTrack(track);
      });
    });
  };

  const startMp4Streaming = async (file) => {
    if (!isHost) return;

    const { video, stream } = await createMp4Stream(file);
    mp4VideoRef.current = video;

    setStreams((s) => ({ ...s, [userId]: stream }));
    replaceTracksForAllPeers(stream);

    await video.play();
    broadcastControl("PLAY", 0);
  };

  const startScreenShare = async () => {
    if (!isHost) return;

    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
    screenStreamRef.current = stream;

    setStreams((s) => ({ ...s, [userId]: stream }));
    replaceTracksForAllPeers(stream);

    stream.getVideoTracks()[0].onended = stopScreenShare;
  };

  const stopScreenShare = () => {
    if (!isHost || !screenStreamRef.current) return;

    screenStreamRef.current.getTracks().forEach((t) => t.stop());
    screenStreamRef.current = null;

    setStreams((s) => ({ ...s, [userId]: localStreamRef.current }));
    replaceTracksForAllPeers(localStreamRef.current);
  };

  const applyStreamControl = (action, time) => {
    const video = mp4VideoRef.current;
    if (!video) return;

    if (action === "PLAY") video.play();
    if (action === "PAUSE") video.pause();
    if (action === "STOP") {
      video.pause();
      video.currentTime = 0;
    }

    if (typeof time === "number") video.currentTime = time;
    setPlayState(action);
  };

  return (
    <div>
      <VideoGrid streams={streams} />
      <MediaControls stream={localStreamRef.current} />
      {isHost && (
        <HostControls
          roomId={roomId}
          userId={userId}
          videoRef={mp4VideoRef}
          onStartMp4={startMp4Streaming}
          onStartScreen={startScreenShare}
          onStopScreen={stopScreenShare}
          broadcastControl={broadcastControl}
        />
      )}
    </div>
  );
};

export default StreamRoom;
