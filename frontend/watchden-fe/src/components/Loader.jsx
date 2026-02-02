import React from "react";
import "../styles/global.css";

const Loader = ({ fullScreen = false }) => {
  const containerStyle = fullScreen
    ? {
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        width: "100vw",
        position: "fixed",
        top: 0,
        left: 0,
        backgroundColor: "rgba(255, 255, 255, 0.8)",
        zIndex: 9999,
      }
    : {
        display: "flex",
        justifyContent: "center",
        padding: "20px",
      };

  return (
    <div style={containerStyle}>
      <div className="loader-spinner"></div>
      <style>{`
        .loader-spinner {
          border: 4px solid #f3f3f3;
          border-top: 4px solid #6366f1;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Loader;
