import React, { useState, useRef, useEffect } from "react";
import { sendMessage } from "../../socket/roomSocket";

const ChatPanel = ({ messages, roomCode }) => {
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  // 1. Get current user to decide Left vs Right alignment
  const currentUser = JSON.parse(sessionStorage.getItem("user"))?.username;

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
      {/* Messages List */}
      {/* Messages List */}
      <div className="messages-list">
        {messages
          // 🔴 FIX: Filter out non-chat messages or empty content
          .filter(
            (msg) =>
              msg.type === "CHAT" && msg.content && msg.content.trim() !== ""
          )
          .map((msg, index) => {
            const currentUser = JSON.parse(
              sessionStorage.getItem("user")
            )?.username;
            const isMe = msg.sender === currentUser;

            return (
              <div
                key={index}
                className={`message-bubble ${isMe ? "my-message" : ""}`}
              >
                {!isMe && <span className="sender-name">{msg.sender}</span>}
                <div className="message-content">{msg.content}</div>
              </div>
            );
          })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
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
