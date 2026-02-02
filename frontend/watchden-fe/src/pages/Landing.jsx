import React from "react";
import { Link, Navigate } from "react-router-dom";
import { Lightning, ChatCircleText, LockKey } from "@phosphor-icons/react";
import { useAuth } from "../features/auth/useAuth";

const Landing = () => {
  const { user } = useAuth();

  if (user) {
    return <Navigate to="/rooms" replace />;
  }

  return (
    <div className="landing-page" style={styles.page}>
      <div style={styles.content}>
        {/* Hero Section */}
        <div style={styles.hero}>
          <h1 style={styles.logo}>
            Watch<span style={{ color: "#6366f1" }}>Den</span>
          </h1>
          <h2 style={styles.title}>Watch Together, Anywhere.</h2>
          <p style={styles.description}>
            A shared viewing experience for you and your friends. Sync videos
            seamlessly, chat in real-time, and enjoy content together.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={styles.buttonContainer}>
          <Link to="/login" style={{ textDecoration: "none" }}>
            <button style={styles.primaryBtn}>Get Started</button>
          </Link>
          <Link to="/register" style={{ textDecoration: "none" }}>
            <button style={styles.secondaryBtn}>Create Account</button>
          </Link>
        </div>

        {/* Feature Highlights */}
        <div style={styles.features}>
          <div style={styles.featureItem}>
            <div style={styles.iconWrapper}>
              <Lightning size={24} color="#fbbf24" weight="fill" />
            </div>
            <p style={styles.featureText}>Real-time Sync</p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.iconWrapper}>
              <ChatCircleText size={24} color="#6366f1" weight="fill" />
            </div>
            <p style={styles.featureText}>Live Chat</p>
          </div>
          <div style={styles.featureItem}>
            <div style={styles.iconWrapper}>
              <LockKey size={24} color="#10b981" weight="fill" />
            </div>
            <p style={styles.featureText}>Private Rooms</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Landing Page Styles ---
const styles = {
  page: {
    height: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0f172a",
    backgroundImage:
      "radial-gradient(circle at 50% 50%, #1e1b4b 0%, #0f172a 100%)",
    color: "white",
    padding: "20px",
    fontFamily: "'Inter', system-ui, sans-serif",
  },
  content: {
    maxWidth: "800px",
    textAlign: "center",
  },
  hero: {
    marginBottom: "40px",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "800",
    letterSpacing: "-1px",
    marginBottom: "20px",
  },
  title: {
    fontSize: "clamp(2.5rem, 8vw, 4rem)",
    fontWeight: "900",
    lineHeight: "1.1",
    marginBottom: "24px",
    background: "linear-gradient(to bottom right, #ffffff, #94a3b8)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
  },
  description: {
    fontSize: "1.1rem",
    color: "#94a3b8",
    lineHeight: "1.6",
    maxWidth: "600px",
    margin: "0 auto",
  },
  buttonContainer: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    marginBottom: "60px",
  },
  primaryBtn: {
    padding: "14px 32px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "transform 0.2s, background-color 0.2s",
  },
  secondaryBtn: {
    padding: "14px 32px",
    backgroundColor: "transparent",
    color: "white",
    border: "1px solid #334155",
    borderRadius: "8px",
    fontSize: "1.1rem",
    fontWeight: "600",
    cursor: "pointer",
    transition: "background-color 0.2s",
  },
  features: {
    display: "flex",
    justifyContent: "center",
    gap: "40px",
    borderTop: "1px solid #1e293b",
    paddingTop: "40px",
  },
  featureItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "48px",
    height: "48px",
    borderRadius: "50%",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    border: "1px solid #334155",
  },
  featureText: {
    fontSize: "0.95rem",
    color: "#e2e8f0",
    margin: 0,
    fontWeight: "500",
  },
};

export default Landing;
