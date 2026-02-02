import { useState } from "react";
import { authApi } from "../../api/auth.api";
import { userApi } from "../../api/user.api";
import { authUtils } from "./auth.utils";

export const useAuth = () => {
  const [user, setUser] = useState(authUtils.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const data = await authApi.login(credentials);

      // Handle missing avatar data if necessary
      let fullProfile = {};
      if (data.id && !data.avatarUrl) {
        try {
          authUtils.setAuth(data.token, { id: data.id });
          fullProfile = await userApi.getProfile(data.id);
        } catch (e) {
          // console.warn("Failed to fetch full profile during login", e);
        }
      }

      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
        avatarUrl: data.avatarUrl || fullProfile.avatarUrl,
        displayName: data.displayName || fullProfile.displayName,
      };

      authUtils.setAuth(data.token, userData);
      setUser(userData);
      return true;
    } catch (err) {
      // console.error("Login Error:", err);

      // Custom Error Message Handling
      const status = err.response?.status;

      if (status === 401 || status === 403) {
        // Standard "Wrong Password" status
        setError("Invalid username or password.");
      } else if (status === 500) {
        // Since the backend returns 500 for wrong passwords, we mask it here:
        setError(
          "Invalid credentials. Please check your username and password."
        );
      } else if (err.response?.data?.message) {
        // Use backend message if available
        setError(err.response.data.message);
      } else {
        // Fallback for network errors (e.g., server offline)
        setError("Unable to connect to server. Please try again.");
      }

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
      return true;
    } catch (err) {
      // console.error("Register Error:", err);
      setError(err.response?.data?.message || "Registration failed");
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    authUtils.clearAuth();
    setUser(null);
    window.location.href = "/login";
  };

  return { user, login, register, logout, loading, error };
};
