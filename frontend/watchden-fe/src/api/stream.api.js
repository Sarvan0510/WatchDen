// src/api/stream.api.js
import api from "./api";

export const streamApi = {
  startStream: async (payload) => {
    // POST /api/streams/start
    // Payload: { roomId, userId, type, source }
    const response = await api.post("/streams/start", payload);
    return response.data;
  },

  pauseStream: async (payload) => {
    // POST /api/streams/pause
    // Payload: { roomId, userId, time }
    const response = await api.post("/streams/pause", payload);
    return response.data;
  },

  stopStream: async (payload) => {
    // POST /api/streams/stop
    // Payload: { roomId, userId }
    const response = await api.post("/streams/stop", payload);
    return response.data;
  },

  getStreamState: async (roomId) => {
    // GET /api/streams/state?roomId=123
    const response = await api.get("/streams/state", {
      params: { roomId },
    });
    return response.data;
  },
};
