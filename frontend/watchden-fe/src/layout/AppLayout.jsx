import { Outlet, Link, useNavigate } from "react-router-dom";

const AppLayout = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <div style={layoutStyles.wrapper}>
      {/* Shared Navbar for all protected pages */}
      <nav style={layoutStyles.nav}>
        <div style={layoutStyles.logo}>WatchDen</div>
        <div style={layoutStyles.links}>
          <Link to="/rooms" style={layoutStyles.link}>
            Lobby
          </Link>
          <button onClick={handleLogout} style={layoutStyles.logoutBtn}>
            Logout
          </button>
        </div>
      </nav>

      {/* ⚠️ THIS IS THE KEY: Renders the nested route (RoomView, RoomList, etc.) */}
      <main style={layoutStyles.content}>
        <Outlet />
      </main>
    </div>
  );
};

const layoutStyles = {
  wrapper: {
    display: "flex",
    flexDirection: "column",
    height: "100vh",
    background: "#121212",
    color: "white",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 30px",
    background: "#1f1f1f",
    borderBottom: "1px solid #333",
  },
  logo: { fontSize: "1.5rem", fontWeight: "bold", color: "#007bff" },
  links: { display: "flex", gap: "20px", alignItems: "center" },
  link: { color: "#ccc", textDecoration: "none", fontSize: "1rem" },
  logoutBtn: {
    background: "transparent",
    border: "1px solid #555",
    color: "#aaa",
    padding: "5px 10px",
    cursor: "pointer",
    borderRadius: "4px",
  },
  content: {
    flex: 1,
    overflow: "hidden",
    display: "flex",
    flexDirection: "column",
  },
};

export default AppLayout;
