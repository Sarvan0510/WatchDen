import { useNavigate } from "react-router-dom";

const RoomHeader = ({ roomId }) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        padding: "15px",
        background: "#252525",
        borderBottom: "1px solid #333",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <h3 style={{ margin: 0, color: "white" }}>
        WatchDen Room: <span style={{ color: "#007bff" }}>{roomId}</span>
      </h3>
      <button
        onClick={() => navigate("/")}
        style={{
          background: "transparent",
          border: "1px solid #555",
          color: "white",
          padding: "5px 10px",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Leave Room
      </button>
    </div>
  );
};

export default RoomHeader;
