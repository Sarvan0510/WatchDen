package com.watchden.chat.websocket;

import com.watchden.chat.model.ChatMessage;
import org.springframework.context.event.EventListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

import java.util.Set;

@Component
public class WebSocketEventListener {

    private final RedisTemplate<String, Object> redisTemplate;
    private final SimpMessagingTemplate messagingTemplate;

    public WebSocketEventListener(RedisTemplate<String, Object> redisTemplate,
            SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.messagingTemplate = messagingTemplate;
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());

        // 1. Get the username and roomId we saved during JOIN
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String roomId = (String) headerAccessor.getSessionAttributes().get("roomId");

        if (username != null && roomId != null && userId != null) {
            System.out.println("❌ User Disconnected: " + username);

            // 2. Remove from Redis Set (Remove ID)
            String participantKey = "room:participants:" + roomId;
            redisTemplate.opsForSet().remove(participantKey, String.valueOf(userId));

            // 3. Broadcast Updated Participant List
            Set<Object> activeUsers = redisTemplate.opsForSet().members(participantKey);
            messagingTemplate.convertAndSend("/topic/room/" + roomId + "/participants", activeUsers);

            // 4. (Optional) Broadcast "User Left" message to chat
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(ChatMessage.Type.LEAVE);
            chatMessage.setSenderId(username);
            chatMessage.setContent(username + " left!");
            messagingTemplate.convertAndSend("/topic/room/" + roomId, chatMessage);
        }
    }
}