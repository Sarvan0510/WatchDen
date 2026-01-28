import { Client } from "@stomp/stompjs";

export const createStompClient = (roomId, onMessage) => {
  const client = new Client({
    brokerURL: "ws://localhost:8080/ws-stream",
    reconnectDelay: 5000,
    onConnect: () => {
      client.subscribe(
        `/topic/rooms/${roomId}/signal`,
        (msg) => onMessage(JSON.parse(msg.body))
      );
    },
  });

  client.activate();
  return client;
};
