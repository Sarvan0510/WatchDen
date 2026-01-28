import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:8080/api", // gateway
});

export const startStream = (payload) =>
  API.post("/streams/start", payload);

export const pauseStream = (payload) =>
  API.post("/streams/pause", payload);

export const stopStream = (payload) =>
  API.post("/streams/stop", payload);

export const getStreamState = (roomId) =>
  API.get(`/streams/state?roomId=${roomId}`);
