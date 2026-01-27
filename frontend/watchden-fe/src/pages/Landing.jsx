import React from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import "../styles/global.css";

const Landing = () => {
  const { user } = useAuth();

  // If already logged in, skip landing and go to rooms
  if (user) {
    return <Navigate to="/rooms" replace />;
  }

  return (
    <div
      className="landing-container"
      style={{ textAlign: "center", marginTop: "100px" }}
    >
      <h1>Welcome to WatchDen</h1>
      <p>Watch videos together with friends in real-time.</p>

      <div className="action-buttons" style={{ marginTop: "20px" }}>
        <Link to="/login">
          <button className="btn-primary" style={{ marginRight: "10px" }}>
            Login
          </button>
        </Link>
        <Link to="/register">
          <button className="btn-secondary">Register</button>
        </Link>
      </div>
    </div>
  );
};

export default Landing;
