import { jwtDecode } from "jwt-decode"; // You might need: npm install jwt-decode

const TOKEN_KEY = "token";
const USER_KEY = "user";

export const authUtils = {
  getToken: () => localStorage.getItem(TOKEN_KEY),

  getUser: () => {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  setAuth: (token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearAuth: () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated: () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return false;

    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      if (decoded.exp < currentTime) {
        authUtils.clearAuth();
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  },
};
