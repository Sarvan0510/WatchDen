import { useRef, useState, useCallback } from "react";
import { sendSignal } from "../socket/roomSocket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useWebRTC = (roomId, user) => {
  const peersRef = useRef(new Map()); // { userId: RTCPeerConnection }
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // { userId: MediaStream }

  // Create Peer Connection
  const createPeerConnection = useCallback(
    (targetUserId, localStream, isInitiator) => {
      const pc = new RTCPeerConnection(ICE_CONFIG);

      // Add Local Tracks
      if (localStream) {
        localStream.getTracks().forEach((track) => {
          const sender = pc.addTrack(track, localStream);
          // Bitrate Cap for Video
          if (track.kind === "video") {
            const params = sender.getParameters();
            if (!params.encodings) params.encodings = [{}];
            params.encodings[0].maxBitrate = 1_500_000; // 1.5Mbps
            sender.setParameters(params).catch((e) => null);
          }
        });
      }

      // ICE Candidates
      pc.onicecandidate = (e) => {
        if (e.candidate) {
          sendSignal(roomId, "candidate", {
            candidate: e.candidate,
            target: targetUserId,
          });
        }
      };

      // Incoming Stream
      pc.ontrack = (e) => {
        // console.log("Received Remote Stream from:", targetUserId);
        setRemoteStreams((prev) => {
          const newMap = new Map(prev);
          newMap.set(targetUserId, e.streams[0]);
          return newMap;
        });
      };

      // Cleanup
      pc.onconnectionstatechange = () => {
        if (
          pc.connectionState === "failed" ||
          pc.connectionState === "closed"
        ) {
          setRemoteStreams((prev) => {
            const newMap = new Map(prev);
            newMap.delete(targetUserId);
            return newMap;
          });
          peersRef.current.delete(targetUserId);
        }
      };

      peersRef.current.set(targetUserId, pc);
      return pc;
    },
    [roomId]
  );

  const handleIncomingSignal = async (signal, localStream) => {
    let { type, sender, payload } = signal;
    if (sender === user.username) return;

    // Parse Payload
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        // console.error("Failed to parse signal payload:", e);
        return;
      }
    }

    // Target check to ensure signals are meant for this user
    if (payload.target && payload.target !== user.username) {
      return;
    }

    let pc = peersRef.current.get(sender);

    try {
      if (type === "offer") {
        // Permissive renegotiation logic
        if (pc) {
          // console.log("Renegotiation: Resetting PC for", sender);
          // Prevent closed event from removing the stream map during renegotiation
          pc.onconnectionstatechange = null;
          pc.close();
          peersRef.current.delete(sender);
          pc = null;
        }

        if (!pc) pc = createPeerConnection(sender, localStream, false);

        await pc.setRemoteDescription(
          new RTCSessionDescription(payload.sdp || payload)
        );
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);

        // Respond specifically to the sender
        sendSignal(roomId, "answer", { sdp: answer, target: sender });
      } else if (type === "answer" && pc) {
        // Only set remote answer when waiting for it
        if (pc.signalingState !== "have-local-offer") return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(payload.sdp || payload)
          );
        } catch (answerErr) {
          if (answerErr?.name === "InvalidStateError") {
            // console.warn("Silencing WebRTC State Error:", answerErr.message);
          } else {
            throw answerErr;
          }
        }
      } else if (type === "candidate" && pc) {
        if (payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } else if (type === "join") {
        // Refresh logic: If a user rejoins, close old connection and start fresh
        if (localStream) {
          if (pc) {
            // console.log(`User ${sender} rejoined. Resetting connection...`);
            pc.close();
            peersRef.current.delete(sender);
          }

          // Create fresh connection
          const newPc = createPeerConnection(sender, localStream, true);
          const offer = await newPc.createOffer();
          await newPc.setLocalDescription(offer);

          // Send offer specifically to this user
          sendSignal(roomId, "offer", { sdp: offer, target: sender });
        }
      }
    } catch (err) {
      if (err.name === "InvalidStateError") {
        // console.warn("Silencing WebRTC State Error:", err.message);
      } else {
        // console.error("WebRTC Signaling Error:", err);
      }
    }
  };

  // Switch Video Track (For Screen Share / MP4)
  const replaceVideoTrack = (newStream) => {
    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");

      if (sender) {
        if (newStream) {
          // If a new stream exists, switch to its video track
          const newVideoTrack = newStream.getVideoTracks()[0];
          if (newVideoTrack) {
            sender.replaceTrack(newVideoTrack).catch((e) => {
              // console.error("Track replace failed", e)
            });
          }
        } else {
          // If stream is null (e.g. stopping video), stop sending on this track
          sender.replaceTrack(null).catch((e) => {
            // console.error("Track clear failed", e)
          });
        }
      }
    });
  };

  // Manual Connection Trigger (Host calls this when starting stream)
  const connectToPeer = async (targetUserId, stream) => {
    // console.log(`Manual Connection initiated to: ${targetUserId}`);
    if (!stream) {
      // console.error("Cannot connect to peer: No stream provided");
      return;
    }

    if (peersRef.current.has(targetUserId)) {
      peersRef.current.get(targetUserId).close();
      peersRef.current.delete(targetUserId);
    }

    // Use the passed stream
    const pc = createPeerConnection(targetUserId, stream, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(roomId, "offer", { sdp: offer, target: targetUserId });
  };

  return {
    remoteStreams,
    handleIncomingSignal,
    replaceVideoTrack,
    connectToPeer,
  };
};
