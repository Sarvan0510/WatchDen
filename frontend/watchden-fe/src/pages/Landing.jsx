import { useNavigate } from "react-router-dom";

const Landing = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <h1>Welcome to WatchDen</h1>
      <p>Watch videos together with friends in real-time.</p>
      <div style={styles.actions}>
        <button onClick={() => navigate("/login")} style={styles.button}>
          Start Watching
        </button>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#121212",
    color: "white",
  },
  actions: { marginTop: "20px" },
  button: {
    padding: "10px 20px",
    fontSize: "1.2rem",
    cursor: "pointer",
    background: "#007bff",
    color: "white",
    border: "none",
    borderRadius: "5px",
  },
};

export default Landing;
