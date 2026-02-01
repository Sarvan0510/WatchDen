import { useState } from "react";
import { authApi } from "../../api/auth.api";
import { userApi } from "../../api/user.api"; // 🟢 Import userApi
import { authUtils } from "./auth.utils"; // 🟢 Import your utils

export const useAuth = () => {
  // 🟢 1. FIX: Initialize state from LocalStorage immediately
  // This prevents the "Login" button from flashing on refresh
  const [user, setUser] = useState(authUtils.getUser());

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      // API Call
      const data = await authApi.login(credentials);

      // 🟢 1.5 FIX: If Login Response is slim (missing avatar), Fetch Full Profile
      let fullProfile = {};
      if (data.id && !data.avatarUrl) {
        try {
          // Temporarily set token so API call works (if needed by interceptor)
          authUtils.setAuth(data.token, { id: data.id });
          fullProfile = await userApi.getProfile(data.id);
        } catch (e) {
          console.warn("Failed to fetch full profile during login", e);
        }
      }

      // Normalize User Data
      const userData = {
        id: data.id,
        username: data.username, // Ensure backend sends 'username'
        email: data.email,
        roles: data.roles,
        avatarUrl: data.avatarUrl || fullProfile.avatarUrl, // 🟢 Prioritize login data, fallback to fetch
        displayName: data.displayName || fullProfile.displayName,
      };

      // 🟢 2. FIX: Save to Storage SYNCHRONOUSLY
      // This runs before the function returns, so the data is 100% ready
      // when your Login page calls navigate("/rooms")
      authUtils.setAuth(data.token, userData);

      // Update React State
      setUser(userData);
      return true;
    } catch (err) {
      console.error("Login Error:", err);
      setError(err.response?.data?.message || err.message || "Login failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(userData);
      // Optional: You could auto-login here if the backend returns a token
      return true;
    } catch (err) {
      console.error("Register Error:", err);
      setError(err.response?.data?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // 🟢 3. FIX: Clear storage immediately
    authUtils.clearAuth();
    setUser(null);

    // Force a hard refresh to clear any lingering memory states
    window.location.href = "/login";
  };

  return { user, login, register, logout, loading, error };
};
