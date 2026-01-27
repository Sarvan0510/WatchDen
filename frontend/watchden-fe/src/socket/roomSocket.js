import SockJS from "sockjs-client";
import Stomp from "stompjs";

let stompClient = null;

export const connectSocket = (roomId, onMessageReceived, onUserJoined) => {
  // Pointing to the Gateway (8080). Ensure your Gateway forwards /ws requests to Chat Service!
  // If Gateway fails for WS, fallback to direct Chat Service: 'http://localhost:8083/ws'
  const socket = new SockJS("http://localhost:8080/ws");
  stompClient = Stomp.over(socket);

  stompClient.debug = null; // Disable debug logs in console

  stompClient.connect(
    {},
    () => {
      // 1. Subscribe to Public Chat Messages
      stompClient.subscribe(`/topic/room/${roomId}`, (payload) => {
        const message = JSON.parse(payload.body);
        onMessageReceived(message);
      });

      // 2. Subscribe to Participant Updates (Joins/Leaves)
      stompClient.subscribe(`/topic/room/${roomId}/participants`, (payload) => {
        onUserJoined(JSON.parse(payload.body));
      });

      // 3. Notify others that I have joined
      const user = JSON.parse(localStorage.getItem("user"));
      if (user) {
        stompClient.send(
          `/app/chat/${roomId}/join`,
          {},
          JSON.stringify({
            sender: user.username,
            type: "JOIN",
          })
        );
      }
    },
    (error) => {
      console.error("Socket error:", error);
    }
  );
};

export const sendMessage = (roomId, messageContent) => {
  if (stompClient && stompClient.connected) {
    const user = JSON.parse(localStorage.getItem("user"));
    const chatMessage = {
      sender: user.username,
      content: messageContent,
      type: "CHAT",
    };
    stompClient.send(
      `/app/chat/${roomId}/sendMessage`,
      {},
      JSON.stringify(chatMessage)
    );
  }
};

export const disconnectSocket = () => {
  if (stompClient) {
    // 🔴 Only try to disconnect if we are actually connected
    if (stompClient.connected) {
      stompClient.disconnect(() => {
        console.log("Disconnected");
      });
    }
    stompClient = null;
  }
};
