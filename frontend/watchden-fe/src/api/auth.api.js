import api from "./api";

export const authApi = {
  login: async (credentials) => {
    // POST /api/auth/signin
    const response = await api.post("/auth/signin", credentials);
    return response.data;
  },

  register: async (userData) => {
    // POST /api/auth/signup
    const response = await api.post("/auth/signup", userData);
    return response.data;
  },
};
