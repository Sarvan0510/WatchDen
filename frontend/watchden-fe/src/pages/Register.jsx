import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UserPlusIcon, WarningIcon } from "@phosphor-icons/react";
import { useAuth } from "../features/auth/useAuth";
import Loader from "../components/Loader";

const Register = () => {
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const { register, loading, error } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await register(userData);
    if (success) {
      navigate("/login");
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
            Create your account to start watching together.
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
              placeholder="Pick a unique username"
              onChange={handleChange}
              style={styles.input}
              required
            />
          </div>

          <div className="form-group" style={styles.group}>
            <label style={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              placeholder="name@example.com"
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
                placeholder="Create a strong password"
                onChange={handleChange}
                // Add padding to right so text doesn't overlap icon
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
                  <EyeSlashIcon size={20} color="#94a3b8" />
                ) : (
                  <EyeIcon size={20} color="#94a3b8" />
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
                <UserPlusIcon size={20} weight="bold" />
                Create Account
              </>
            )}
          </button>
        </form>

        <p style={styles.footerText}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
};

// --- Styles ---
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
    maxWidth: "420px",
    backgroundColor: "#1e293b",
    padding: "40px",
    borderRadius: "16px",
    boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.5)",
    border: "1px solid #334155",
    textAlign: "center",
  },
  header: { marginBottom: "32px" },
  logo: {
    fontSize: "2rem",
    fontWeight: "bold",
    color: "white",
    margin: "0 0 8px 0",
    letterSpacing: "-1px",
  },
  subtitle: { color: "#94a3b8", fontSize: "0.9rem", margin: 0 },
  error: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
    color: "#ef4444",
    padding: "12px",
    borderRadius: "8px",
    marginBottom: "20px",
    fontSize: "0.85rem",
    border: "1px solid rgba(239, 68, 68, 0.2)",
    textAlign: "left",
    display: "flex",
    alignItems: "center",
  },
  form: { textAlign: "left" },
  group: { marginBottom: "20px" },
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
    boxSizing: "border-box",
    transition: "border-color 0.2s",
  },
  eyeBtn: {
    position: "absolute",
    right: "12px",
    top: "50%",
    // Visual centering tweak
    transform: "translateY(-65%)",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "4px",
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
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "8px",
    transition: "background-color 0.2s",
  },
  buttonDisabled: {
    backgroundColor: "#4338ca",
    opacity: 0.7,
    cursor: "not-allowed",
  },
  footerText: { marginTop: "24px", color: "#94a3b8", fontSize: "0.9rem" },
  link: { color: "#818cf8", textDecoration: "none", fontWeight: "500" },
};

export default Register;
