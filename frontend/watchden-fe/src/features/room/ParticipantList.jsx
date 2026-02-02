import React, { useState } from "react";
import {
  CaretCircleUpIcon,
  CaretCircleDownIcon,
  UsersIcon,
} from "@phosphor-icons/react";
import "./room.css";
import Avatar from "../../components/Avatar";

const ParticipantList = ({ participants = [], profileMap = {} }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="participant-list-container" style={styles.container}>
      {/* Clickable Header */}
      <div
        className="participant-toggle-header"
        onClick={() => setIsOpen(!isOpen)}
        title="Click to toggle list"
        style={styles.header}
      >
        <div style={styles.headerLeft}>
          <UsersIcon size={20} weight="fill" color="#94a3b8" />
          <span style={styles.headerTitle}>Participants</span>
          <span style={styles.badge}>{participants.length}</span>
        </div>

        <div style={styles.arrow}>
          {isOpen ? (
            <CaretCircleUpIcon size={20} color="#94a3b8" />
          ) : (
            <CaretCircleDownIcon size={20} color="#94a3b8" />
          )}
        </div>
      </div>

      {/* Animated List Container */}
      <div
        style={{
          ...styles.animatedWrapper,
          gridTemplateRows: isOpen ? "1fr" : "0fr",
          opacity: isOpen ? 1 : 0.5,
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div className="participant-items-scroll" style={styles.listContent}>
            {participants.length === 0 ? (
              <div style={styles.emptyState}>No one else is here... yet.</div>
            ) : (
              participants.map((userId, index) => {
                const id = Number(userId);
                const profile = profileMap[id];
                const displayName =
                  profile?.displayName || profile?.username || "Unknown User";

                return (
                  <div key={index} style={styles.item}>
                    <Avatar
                      src={profile?.avatarUrl}
                      name={displayName}
                      size="sm"
                    />

                    <span style={styles.name}>{displayName}</span>

                    <span style={styles.statusDot}></span>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },
  header: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "10px 12px",
    backgroundColor: "rgba(30, 41, 59, 0.5)",
    borderRadius: "8px",
    cursor: "pointer",
    transition: "background-color 0.2s",
    userSelect: "none",
  },
  headerLeft: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  headerTitle: {
    fontSize: "0.85rem",
    fontWeight: "600",
    color: "#cbd5e1",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  badge: {
    backgroundColor: "#334155",
    color: "#f1f5f9",
    fontSize: "0.75rem",
    padding: "2px 6px",
    borderRadius: "4px",
    fontWeight: "700",
  },
  arrow: {
    display: "flex",
    alignItems: "center",
  },
  // Smooth Animation Styles
  animatedWrapper: {
    display: "grid",
    transition: "grid-template-rows 0.3s ease, opacity 0.3s ease",
  },
  listContent: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
    marginTop: "4px",
  },
  // Item Alignment
  item: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderRadius: "8px",
    transition: "background 0.2s",
    minHeight: "44px",
  },
  name: {
    fontSize: "0.95rem",
    color: "#e2e8f0",
    fontWeight: "500",
    whiteSpace: "nowrap",
    overflow: "hidden",
    textOverflow: "ellipsis",
    flex: 1,
  },
  statusDot: {
    width: "8px",
    height: "8px",
    backgroundColor: "#22c55e",
    borderRadius: "50%",
    boxShadow: "0 0 4px rgba(34, 197, 94, 0.6)",
  },
  emptyState: {
    padding: "12px",
    color: "#64748b",
    fontSize: "0.9rem",
    fontStyle: "italic",
    textAlign: "center",
  },
};

export default ParticipantList;
