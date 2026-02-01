import React, { useState, useRef, useEffect } from "react";
import { PaperPlaneRightIcon } from "@phosphor-icons/react";
import { sendMessage } from "../../socket/roomSocket";

const ChatPanel = ({ messages, roomCode, profileMap = {} }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const userData = JSON.parse(sessionStorage.getItem("user"));
  const currentUsername = userData?.username;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim()) {
      sendMessage(roomCode, newMessage);
      setNewMessage("");
    }
  };

  return (
    <div className="chat-panel" style={styles.panel}>
      <div className="messages-list" style={styles.messageList}>
        {messages
          .filter((msg) => msg.type === "CHAT" && msg.content?.trim() !== "")
          .map((msg, index) => {
            const isMe = msg.sender === currentUsername;

            const profileById =
              profileMap[msg.sender] || profileMap[Number(msg.sender)];

            const profileByUsername = !profileById
              ? Object.values(profileMap).find((p) => p.username === msg.sender)
              : null;

            const finalProfile = profileById || profileByUsername;
            const displayName =
              finalProfile?.displayName || finalProfile?.username || msg.sender;

            return (
              <div
                key={index}
                className={`message-bubble ${isMe ? "my-message" : ""}`}
              >
                {!isMe && <span className="sender-name">{displayName}</span>}
                <div className="message-content">{msg.content}</div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div style={styles.inputArea}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
          style={styles.input}
        />
        <button onClick={handleSend} style={styles.sendButton}>
          Send
          <PaperPlaneRightIcon size={18} weight="bold" />
        </button>
      </div>
    </div>
  );
};

// STYLES
const styles = {
  panel: {
    display: "flex",
    flexDirection: "column",
    height: "100%",
    overflow: "hidden",
  },
  messageList: {
    flex: 1,
    overflowY: "auto",
    padding: "10px",
  },
  inputArea: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "16px",
    borderTop: "1px solid #334155",
    backgroundColor: "#1e293b",
    minHeight: "72px",
    boxSizing: "border-box",
  },
  input: {
    flex: 1,
    height: "44px",
    margin: 0,
    padding: "0 16px",
    borderRadius: "12px",
    border: "1px solid #475569",
    backgroundColor: "#0f172a",
    color: "white",
    fontSize: "0.95rem",
    outline: "none",
    boxSizing: "border-box",
  },
  sendButton: {
    height: "44px",
    margin: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "0 20px",
    backgroundColor: "#6366f1",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "0.95rem",
    boxSizing: "border-box",
    whiteSpace: "nowrap",
  },
};

export default ChatPanel;
