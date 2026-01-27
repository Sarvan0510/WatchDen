import axios from "axios";

// Point this to your Spring Cloud Gateway URL (e.g., port 8080)
const API_BASE_URL = "http://localhost:8084";

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // If using cookies/sessions
});

// Interceptor to attach tokens (if you add JWT later)
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
