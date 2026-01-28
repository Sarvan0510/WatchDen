const ICE_CONFIG = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export const createPeerConnection = (
  peerId,
  localStream,
  onTrack,
  onIce
) => {
  const pc = new RTCPeerConnection(ICE_CONFIG);

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    const sender = pc.addTrack(track, localStream);

    // 🔧 Bitrate cap (important)
    if (track.kind === "video") {
      const params = sender.getParameters();
      params.encodings = [
        {
          maxBitrate: 800_000,
          maxFramerate: 24,
        },
      ];
      sender.setParameters(params);
    }
  });

  pc.ontrack = (e) => onTrack(peerId, e.streams[0]);

  pc.onicecandidate = (e) => {
    if (e.candidate) onIce(peerId, e.candidate);
  };

  pc.onconnectionstatechange = () => {
    if (pc.connectionState === "failed") {
      pc.restartIce();
    }
  };

  return pc;
};
