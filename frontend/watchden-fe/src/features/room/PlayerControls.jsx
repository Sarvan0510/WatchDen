const PlayerControls = () => {
  return (
    <div
      style={{
        padding: "15px",
        background: "#252525",
        display: "flex",
        gap: "15px",
        justifyContent: "center",
      }}
    >
      <button style={btnStyle}>⏮</button>
      <button style={btnStyle}>▶ Play</button>
      <button style={btnStyle}>⏭</button>
    </div>
  );
};

const btnStyle = {
  background: "#444",
  border: "none",
  color: "white",
  padding: "5px 15px",
  borderRadius: "4px",
  cursor: "pointer",
};

export default PlayerControls;
