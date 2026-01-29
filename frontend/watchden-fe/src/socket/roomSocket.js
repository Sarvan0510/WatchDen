import SockJS from "sockjs-client";
import Stomp from "stompjs";

let stompClient = null;

export const connectSocket = (roomId, onMessageReceived, onUserJoined) => {
  if (stompClient && stompClient.connected) {
    stompClient.disconnect();
  }

  const socket = new SockJS("http://localhost:8083/ws");
  stompClient = Stomp.over(socket);
  stompClient.debug = () => { };

  stompClient.connect(
    {},
    () => {
      console.log("✅ WebSocket Connected!");

      // 1. Subscribe to Messages
      stompClient.subscribe(`/topic/room/${roomId}`, (payload) => {
        onMessageReceived(JSON.parse(payload.body));
      });

      // 2. Subscribe to Participants
      stompClient.subscribe(`/topic/room/${roomId}/participants`, (payload) => {
        onUserJoined(JSON.parse(payload.body));
      });

      // 3. Send JOIN Signal
      const user = JSON.parse(sessionStorage.getItem("user"));
      if (user) {
        stompClient.send(
          `/app/chat/${roomId}/join`,
          {},
          JSON.stringify({
            sender: user.username,
            userId: user.id,
            type: "JOIN",
          })
        );
      }
    },
    (error) => console.log("Socket error:", error)
  );
};

export const sendMessage = (roomId, messageContent) => {
  if (stompClient && stompClient.connected) {
    const user = JSON.parse(sessionStorage.getItem("user"));
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

export const notifyHostLeft = (roomId) => {
  if (stompClient && stompClient.connected) {
    const user = JSON.parse(sessionStorage.getItem("user"));
    const message = {
      sender: user.username,
      type: "HOST_LEFT",
      content: "Host has left the room. Closing in 5 seconds...",
    };

    stompClient.send(
      `/app/chat/${roomId}/sendMessage`,
      {},
      JSON.stringify(message)
    );
  }
};

export const disconnectSocket = () => {
  if (stompClient) {
    // ONLY disconnect if it's actually in a connected state
    // STOMP internal state 0: CONNECTING, 1: CONNECTED
    if (stompClient.connected) {
      try {
        stompClient.disconnect(() => {
          console.log("Socket Disconnected");
        });
      } catch (e) {
        // Ignore "already closed" errors
      }
    }
    stompClient = null;
  }
};
