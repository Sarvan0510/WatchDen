import React from "react";
import { Outlet, Link, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/useAuth";
import Avatar from "../components/Avatar";
import "../styles/layout.css"; // We will add this next

const AppLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
