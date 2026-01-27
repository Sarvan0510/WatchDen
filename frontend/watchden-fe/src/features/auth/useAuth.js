import { useState, useEffect } from "react";
import { authApi } from "../../api/auth.api";
import { authUtils } from "./auth.utils";

export const useAuth = () => {
  const [user, setUser] = useState(authUtils.getUser());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      // Backend returns { token: "...", type: "Bearer", id: 1, username: "...", roles: [...] }
      const data = await authApi.login(credentials);

      // We normalize the user object
      const userData = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles: data.roles,
      };

      authUtils.setAuth(data.token, userData);
      setUser(userData);
      return true; // Success
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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
      // Auto-login after register? Or redirect to login?
      // For now, return success and let UI decide.
      return true;
    } catch (err) {
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
