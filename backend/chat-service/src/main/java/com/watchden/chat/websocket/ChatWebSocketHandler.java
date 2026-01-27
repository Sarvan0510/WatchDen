package com.watchden.chat.websocket;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchden.chat.client.RoomServiceClient; // 👈 Import 1
import com.watchden.chat.model.ChatMessage;
import com.watchden.chat.service.RedisPublisher;
import org.springframework.beans.factory.annotation.Value; // 👈 Import 2
import org.springframework.stereotype.Component;
import org.springframework.web.socket.*;
import org.springframework.web.socket.handler.TextWebSocketHandler;

@Component
public class ChatWebSocketHandler extends TextWebSocketHandler {

    private final WebSocketSessionManager sessionManager;
    private final RedisPublisher redisPublisher;
    private final RoomServiceClient roomClient; // 👈 Add Field
    private final ObjectMapper objectMapper = new ObjectMapper();

    // 🚩 Feature Flag: Default to false so your current tests don't break
    @Value("${app.security.validate-room-access:false}")
    private boolean validateRoomAccess;

    public ChatWebSocketHandler(
            WebSocketSessionManager sessionManager,
            RedisPublisher redisPublisher,
            RoomServiceClient roomClient) { // 👈 Update Constructor

        this.sessionManager = sessionManager;
        this.redisPublisher = redisPublisher;
        this.roomClient = roomClient;
    }

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message)
            throws Exception {

        ChatMessage chatMessage =
                objectMapper.readValue(message.getPayload(), ChatMessage.class);

        if (chatMessage.getType() == null || chatMessage.getRoomId() == null) {
            session.close(CloseStatus.BAD_DATA);
            return;
        }

        switch (chatMessage.getType()) {

            case JOIN -> {
                // 👇 START VALIDATION LOGIC
                if (validateRoomAccess) {
                    try {
                        boolean isAllowed = roomClient.validateAccess(
                                chatMessage.getRoomId(),
                                chatMessage.getSenderId()
                        );

                        if (!isAllowed) {
                            System.out.println("❌ Access Denied: " + chatMessage.getSenderId());
                            session.close(CloseStatus.POLICY_VIOLATION);
                            return; // Stop here
                        }
                    } catch (Exception e) {
                        System.err.println("⚠️ Room Service check failed: " + e.getMessage());
                        // Optional: session.close(CloseStatus.SERVER_ERROR);
                    }
                }
                // 👆 END VALIDATION LOGIC

                sessionManager.addSession(chatMessage.getRoomId(), session);
                
                // Recommended: Publish JOIN so others see "User Joined"
                redisPublisher.publish(chatMessage); 
            }

            case CHAT -> {
                // Ensure sender is registered (just in case)
                sessionManager.addSession(chatMessage.getRoomId(), session);
                redisPublisher.publish(chatMessage);
            }

            case LEAVE -> {
                sessionManager.removeSession(chatMessage.getRoomId(), session);
                redisPublisher.publish(chatMessage); // Publish LEAVE so UI removes user
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        // ideally remove session here too if you can track roomId
        // currently handled by explicit LEAVE message
    }
}