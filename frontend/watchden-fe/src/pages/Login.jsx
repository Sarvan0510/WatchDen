import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  SignInIcon,
  EyeIcon,
  EyeSlashIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../features/auth/useAuth";
import Loader from "../components/Loader";

const Login = () => {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { login, loading, error } = useAuth();

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(credentials);
    if (success) {
      window.location.href = "/rooms";
    }
  };

  return (
    <div className="auth-page" style={styles.page}>
      <div className="auth-card" style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.logo}>
            Watch<span style={{ color: "#6366f1" }}>Den</span>
          </h1>
          <p style={styles.subtitle}>
            Welcome back! Please login to your account.
          </p>
        </div>

        {error && (
          <div className="error-message" style={styles.error}>
            <WarningIcon
              size={20}
              weight="bold"
              style={{ marginRight: "8px" }}
            />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div className="form-group" style={styles.group}>
            <label style={styles.label}>Username</label>
            <input
              name="username"
              type="text"
              placeholder="Enter your username"
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="form-group" style={styles.group}>
            <label style={styles.label}>Password</label>
            <div style={styles.passwordWrapper}>
              <input
                name="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                onChange={handleChange}
                style={{ ...styles.input, paddingRight: "40px" }}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={styles.eyeBtn}
                tabIndex="-1"
              >
                {showPassword ? (
                  <EyeSlashIcon size={20} weight="bold" color="#94a3b8" />
                ) : (
                  <EyeIcon size={20} weight="bold" color="#94a3b8" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={
              loading
                ? { ...styles.button, ...styles.buttonDisabled }
                : styles.button
            }
          >
            {loading ? (
              <Loader />
            ) : (
              <>
                <SignInIcon size={20} weight="bold" />
                Sign In
              </>
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
};

const styles = {
  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    backgroundImage:
      "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 100%)",
    padding: "20px",
  },
  card: {
    width: "100%",
    maxWidth: "400px",
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)",
    border: "1px solid #334155",
    textAlign: "center",
  },
  header: {
    marginBottom: "32px",
  },
  logo: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "white",
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
  },
  subtitle: {
    color: "#94a3b8",
    fontSize: "0.9rem",
    margin: 0,
  },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.85rem",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  form: {
    textAlign: "left",
  },
  group: {
    marginBottom: "20px",
  },
  label: {
    display: "block",
    color: "#e2e8f0",
    fontSize: "0.85rem",
    fontWeight: "500",
    marginBottom: "8px",
  },
  passwordWrapper: {
    position: "relative",
    width: "100%",
  },
  input: {
    width: "100%",
    padding: "12px 16px",
    backgroundColor: "#0f172a",
    border: "1px solid #334155",
    borderRadius: "8px",
    color: "white",
    fontSize: "1rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-65%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
    margin: 0,
    color: "#94a3b8",
  },
  button: {
    width: "100%",
    padding: "12px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1rem",
    fontWeight: "600",
    cursor: "pointer",
    marginTop: "10px",
    transition: "background-color 0.2s, transform 0.1s",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
  },
  buttonDisabled: {
    backgroundColor: "#4338ca",
    opacity: 0.7,
    cursor: "not-allowed",
  },
  footerText: {
    marginTop: "24px",
    color: "#94a3b8",
    fontSize: "0.9rem",
  },
  link: {
    color: "#818cf8",
    textDecoration: "none",
    fontWeight: "500",
  },
};

export default Login;
