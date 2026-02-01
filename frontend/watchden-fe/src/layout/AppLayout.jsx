import React, { useState, useEffect } from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import {
  SignInIcon,
  UserPlusIcon,
  SignOutIcon,
  SquaresFourIcon,
  TelevisionIcon,
} from "@phosphor-icons/react";
import { useAuth } from "../features/auth/useAuth";
import { authUtils } from "../features/auth/auth.utils";
import Avatar from "../components/Avatar";
import "../styles/layout.css";

const AppLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  // Local state for user to trigger re-renders
  const [user, setUser] = useState(authUtils.getUser());

  useEffect(() => {
    // 1. Initial Load
    setUser(authUtils.getUser());

    // 2. Listen for External Updates (Profile Page)
    const handleUserUpdate = () => {
      // console.log("AppLayout: Received 'user-updated' event. Refreshing state...");
      const updatedUser = authUtils.getUser();
      // console.log("AppLayout: New User State:", updatedUser);
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
          style={{
            cursor: "pointer",
            fontWeight: "800",
            fontSize: "1.25rem",
            letterSpacing: "-0.5px",
            color: "white",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <TelevisionIcon size={28} color="#6366f1" weight="duotone" />
          <span>
            Watch<span style={{ color: "#6366f1" }}>Den</span>
          </span>
        </div>

        <nav className="nav-links">
          {user ? (
            <>
              <Link
                to="/rooms"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <SquaresFourIcon size={20} weight="bold" />
                Rooms
              </Link>

              <div className="user-menu">
                <Link to="/profile" className="user-profile-link">
                  <Avatar src={user.avatarUrl} name={user.username} size="sm" />
                  <span>{user.username}</span>
                </Link>

                <button
                  onClick={logout}
                  className="btn-logout"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <SignOutIcon size={18} weight="bold" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <>
              <Link
                to="/login"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <SignInIcon size={18} weight="bold" />
                Login
              </Link>

              <Link
                to="/register"
                className="btn-register-nav"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <UserPlusIcon size={18} weight="bold" />
                Register
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Page content rendering */}
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;
