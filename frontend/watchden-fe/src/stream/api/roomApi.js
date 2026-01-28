import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api",
});

export const getRoomHost = (roomId) =>
  API.get(`/rooms/${roomId}/host`);
