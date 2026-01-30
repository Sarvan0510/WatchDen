import { useRef, useState, useCallback } from "react";
import { sendSignal } from "../socket/roomSocket";

const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const useWebRTC = (roomId, user) => {
  const peersRef = useRef(new Map()); // { userId: RTCPeerConnection }
  const [remoteStreams, setRemoteStreams] = useState(new Map()); // { userId: MediaStream }

  // Helper: Create PC
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
        console.log("🎥 Received Remote Stream from:", targetUserId);
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

    // 1. Parse Payload
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      } catch (e) {
        console.error("❌ Failed to parse signal payload:", e);
        return;
      }
    }

    // 🟢 FIX 1: TARGET CHECK (The "3rd User" Fix)
    // If the signal has a specific 'target' and it is NOT me, ignore it.
    if (payload.target && payload.target !== user.username) {
      return;
    }

    let pc = peersRef.current.get(sender);

    try {
      if (type === "offer") {

        // 🟢 FIX 3: PERMISSIVE RENEGOTIATION (Allow "Duplicate" Offers)
        if (pc) {
          console.log("♻️ Renegotiation: Resetting PC for", sender);
          // 🟢 CRITICAL: Stop "Closed" event from nuking the stream map
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
        // Only set remote answer when we're waiting for it (avoid "wrong state: stable" when
        // e.g. host switched to YouTube and we get a stale or duplicate answer)
        if (pc.signalingState !== "have-local-offer") return;
        try {
          await pc.setRemoteDescription(
            new RTCSessionDescription(payload.sdp || payload)
          );
        } catch (answerErr) {
          if (answerErr?.name === "InvalidStateError") {
            console.warn("⚠️ Silencing WebRTC State Error:", answerErr.message);
          } else {
            throw answerErr;
          }
        }
      } else if (type === "candidate" && pc) {
        if (payload.candidate) {
          await pc.addIceCandidate(new RTCIceCandidate(payload.candidate));
        }
      } else if (type === "join") {
        // 🟢 FIX 2: REFRESH LOGIC (The "Zombie Connection" Fix)
        // If we receive "join", it means the user disconnected/refreshed.
        // We MUST close the old connection and start a new one.

        // Even if we are the sender, if someone joins, we offer.
        if (localStream) {
          if (pc) {
            console.log(`♻️ User ${sender} rejoined. Resetting connection...`);
            pc.close();
            peersRef.current.delete(sender);
          }

          // Create FRESH connection
          const newPc = createPeerConnection(sender, localStream, true);
          const offer = await newPc.createOffer();
          await newPc.setLocalDescription(offer);

          // Send offer specifically to this user
          sendSignal(roomId, "offer", { sdp: offer, target: sender });
        }
      }
    } catch (err) {
      if (err.name === "InvalidStateError") {
        console.warn("⚠️ Silencing WebRTC State Error:", err.message);
      } else {
        console.error("WebRTC Signaling Error:", err);
      }
    }
  };

  // Switch Video Track (For Screen Share / MP4)
  const replaceVideoTrack = (newStream) => {
    const newVideoTrack = newStream.getVideoTracks()[0];
    if (!newVideoTrack) return;

    peersRef.current.forEach((pc) => {
      const sender = pc.getSenders().find((s) => s.track?.kind === "video");
      if (sender) {
        sender.replaceTrack(newVideoTrack);
      }
    });
  };

  // 🟢 Manual Connection Trigger (Host calls this when starting stream)
  const connectToPeer = async (targetUserId, stream) => {
    console.log(`🔌 Manual Connection initiated to: ${targetUserId}`);
    if (!stream) {
      console.error("❌ Cannot connect to peer: No stream provided");
      return;
    }

    if (peersRef.current.has(targetUserId)) {
      peersRef.current.get(targetUserId).close();
      peersRef.current.delete(targetUserId);
    }

    // Use the passed stream, NOT localStreamRef (which is undefined here)
    const pc = createPeerConnection(targetUserId, stream, true);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(roomId, "offer", { sdp: offer, target: targetUserId });
  };

  return { remoteStreams, handleIncomingSignal, replaceVideoTrack, connectToPeer };
};
