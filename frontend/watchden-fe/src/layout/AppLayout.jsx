import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import { authUtils } from "../features/auth/auth.utils"; // Import Utils
import Avatar from "../components/Avatar";
import { useState, useEffect } from "react"; // Import Hooks
import "../styles/layout.css";

const AppLayout = () => {
  const { logout } = useAuth(); // Keep logout from hook
  const navigate = useNavigate();

  // Local state for user to trigger re-renders
  const [user, setUser] = useState(authUtils.getUser());

  useEffect(() => {
    // 1. Initial Load
    setUser(authUtils.getUser());

    // 2. Listen for External Updates (Profile Page)
    const handleUserUpdate = () => {
      console.log("👂 AppLayout: Received 'user-updated' event. Refreshing state...");
      const updatedUser = authUtils.getUser();
      console.log("👤 AppLayout: New User State:", updatedUser);
      setUser(updatedUser);
    };

    window.addEventListener("user-updated", handleUserUpdate);
    return () => window.removeEventListener("user-updated", handleUserUpdate);
  }, []);

  return (
    <div className="app-layout">
      <header className="navbar">
        <div
          className="logo"
          onClick={() => navigate("/")}
          style={{ cursor: "pointer" }}
        >
          WatchDen
        </div>

        <nav className="nav-links">
          {user ? (
            <>
              <Link to="/rooms">Rooms</Link>
              <div className="user-menu">
                <Link to="/profile" className="user-profile-link">
                  <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  <span>{user.username}</span>
                </Link>
                <button onClick={logout} className="btn-logout">
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/register" className="btn-register-nav">
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* This is where the page content (Login, Room, Profile) renders */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
