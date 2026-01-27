import React, { useState, useEffect, useRef } from "react";
import { sendMessage } from "../../socket/roomSocket";
import Avatar from "../../components/Avatar";

const ChatPanel = ({ messages, roomCode }) => {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim()) {
      sendMessage(roomCode, input);
      setInput("");
    }
  };

  return (
    <div className="chat-panel">
      <div className="messages-list">
        {messages.map((msg, index) => {
          const isMe = msg.sender === currentUser?.username;
          return (
            <div
              key={index}
              className={`message-bubble ${isMe ? "my-message" : ""}`}
            >
              {!isMe && (
                <div className="message-avatar">
                  <Avatar name={msg.sender} size="sm" />
                </div>
              )}
              <div className="message-content">
                {!isMe && <span className="sender-name">{msg.sender}</span>}
                <p>{msg.content}</p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="chat-input-area">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
};

export default ChatPanel;
