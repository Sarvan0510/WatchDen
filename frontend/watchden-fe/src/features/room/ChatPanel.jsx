import { useState, useRef, useEffect } from "react";

const ChatPanel = ({ messages, onSendMessage, currentUser }) => {
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim()) return;
    onSendMessage(text);
    setText("");
  };

  return (
    <div className="chat-panel">
      <div className="messages-list">
        {messages.map((m, i) => {
          const isMe = m.senderId === currentUser.id;
          return (
            <div
              key={i}
              className={`message-bubble ${isMe ? "my-msg" : "other-msg"}`}
            >
              <small className="sender-name">{m.senderId}</small>
              <p>{m.content}</p>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="Type here..."
        />
        <button onClick={handleSend}>Send</button>
      </div>
    </div>
  );
};

export default ChatPanel;
