import { useParams } from "react-router-dom";
import { useState } from "react";

export default function RoomView() {
  const { roomId } = useParams();
  const [messages, setMessages] = useState([]);
  const [currentMessage, setCurrentMessage] = useState("");

  const sendMessage = () => {
    if (!currentMessage.trim()) return;
    setMessages([...messages, currentMessage]);
    setCurrentMessage("");
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Header */}
      <h2 className="text-xl font-semibold mb-4">Room: {roomId}</h2>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Video Section */}
        <div className="flex-1 bg-white p-4 rounded shadow">
          <video controls className="w-full mb-3">
            <source src="" />
          </video>

          <div className="flex gap-2">
            <button className="border px-4 py-1 rounded">Play</button>
            <button className="border px-4 py-1 rounded">Pause</button>
            <button className="border px-4 py-1 rounded">Stop</button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="w-full lg:w-80 bg-white p-4 rounded shadow flex flex-col">
          <h3 className="font-semibold mb-2">Chat</h3>

          <div className="flex-1 border p-2 mb-2 overflow-y-auto">
            {messages.map((msg, idx) => (
              <div key={idx} className="text-sm mb-1">
                {msg}
              </div>
            ))}
          </div>

          <input
            className="border p-2 mb-2 rounded"
            placeholder="Type a message"
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
          />

          <button
            onClick={sendMessage}
            className="bg-black text-white py-2 rounded"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
