export const getLocalMedia = async (video = true, audio = true) => {
  return navigator.mediaDevices.getUserMedia({
    video: video
      ? {
          width: { ideal: 640 },
          height: { ideal: 360 },
          frameRate: { ideal: 24, max: 30 },
        }
      : false,
    audio: audio
      ? {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      : false,
  });
};
