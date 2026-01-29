export const createMp4Stream = (file) => {
  const video = document.createElement("video");
  video.src = URL.createObjectURL(file);
  video.crossOrigin = "anonymous";
  video.muted = false;
  video.playsInline = true;
  video.controls = false;

  return new Promise((resolve) => {
    video.onloadedmetadata = () => {
      const stream = video.captureStream();
      resolve({ video, stream });
    };
  });
};
