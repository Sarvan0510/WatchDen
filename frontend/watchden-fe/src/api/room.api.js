import api from "./api";

export const roomApi = {
  createRoom: async (roomData) => {
    // POST /api/rooms (Gateway adds X-USER-ID)
    const response = await api.post("/rooms", roomData);
    return response.data;
  },

  joinRoom: async (roomCode) => {
    // POST /api/rooms/join/{roomCode}
    const response = await api.post(`/rooms/join/${roomCode}`);
    return response.data;
  },

  getPublicRooms: async () => {
    // GET /api/rooms/public
    const response = await api.get("/rooms/public");
    return response.data;
  },

  leaveRoom: async (roomId) => {
    // POST /api/rooms/{roomId}/leave
    const response = await api.post(`/rooms/${roomId}/leave`);
    return response.data;
  },

  getRoomDetails: async (roomCode) => {
    // GET /api/rooms/{roomCode}
    const response = await api.get(`/rooms/${roomCode}`);
    return response.data;
  },

  getRoomHost: async (roomId) => {
    // GET /api/rooms/{roomId}/host
    const response = await api.get(`/rooms/${roomId}/host`);
    return response.data;
  },
};
