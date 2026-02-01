import React, { useState, useRef, useEffect } from "react";
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
    <div className="chat-panel">
      <div className="messages-list">
        {messages
          .filter((msg) => msg.type === "CHAT" && msg.content?.trim() !== "")
          .map((msg, index) => {
            const isMe = msg.sender === currentUsername;

            /**
             * 🟢 FIX: THE "KAZUHA" LOOKUP
             * 1. Try direct lookup by ID (if sender is an ID)
             * 2. If that fails, search the profileMap values for a matching username
             */
            const profileById =
              profileMap[msg.sender] || profileMap[Number(msg.sender)];

            const profileByUsername = !profileById
              ? Object.values(profileMap).find((p) => p.username === msg.sender)
              : null;

            const finalProfile = profileById || profileByUsername;

            // Priority: Display Name -> Username -> Raw Sender string
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

      <div className="chat-input-area">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type a message..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;
