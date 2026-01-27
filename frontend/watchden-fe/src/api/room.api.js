// ✅ Fix: Use curly braces and alias 'apiClient' to 'api'
import { apiClient as api } from "./api";

// ⚠️ Note: If your api.js baseURL is 'http://localhost:8080/api/v1',
// you should remove the leading "/api" here to avoid "/api/v1/api/rooms".

export const getRooms = () => api.get("/rooms");

export const joinRoom = (roomId) => api.post(`/rooms/${roomId}/join`);

export const leaveRoom = (roomId) => api.post(`/rooms/${roomId}/leave`);
