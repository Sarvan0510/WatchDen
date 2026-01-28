import React from "react";

const PlayerControls = () => {
  return (
    <div style={styles.container}>
      <button style={styles.btn}>⏮</button>
      <button style={{ ...styles.btn, ...styles.playBtn }}>▶ Play</button>
      <button style={styles.btn}>⏭</button>
    </div>
  );
};

const styles = {
  container: {
    padding: "16px",
    backgroundColor: "#1e293b", // Slate blue
    display: "flex",
    gap: "12px",
    justifyContent: "center",
    borderTop: "1px solid #334155",
  },
  btn: {
    backgroundColor: "#334155",
    border: "1px solid #475569",
    color: "white",
    padding: "8px 16px",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    transition: "all 0.2s ease",
  },
  playBtn: {
    backgroundColor: "#6366f1", // Indigo accent
    borderColor: "#818cf8",
    padding: "8px 24px",
    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
  },
};

export default PlayerControls;
