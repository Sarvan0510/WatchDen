package com.watchden.chat.controller;

import com.watchden.chat.model.ChatMessage;
import com.watchden.chat.service.RedisPublisher;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Set;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final RedisTemplate<String, Object> redisTemplate;
    private final RedisPublisher redisPublisher;
    private final SimpMessagingTemplate messagingTemplate;

    public ChatController(RedisTemplate<String, Object> redisTemplate,
            RedisPublisher redisPublisher,
            SimpMessagingTemplate messagingTemplate) {
        this.redisTemplate = redisTemplate;
        this.redisPublisher = redisPublisher;
        this.messagingTemplate = messagingTemplate;
    }

    // --- HTTP ENDPOINT (History) ---
    @GetMapping("/history/{roomId}")
    public List<Object> getChatHistory(@PathVariable String roomId) {
        return redisTemplate.opsForList().range("chat:history:" + roomId, 0, -1);
    }

    // --- STOMP ENDPOINTS ---

    @MessageMapping("/chat/{roomId}/sendMessage")
    public void sendMessage(@DestinationVariable String roomId, @Payload ChatMessage chatMessage) {
        chatMessage.setRoomId(roomId);
        redisPublisher.publish(chatMessage);
    }

    @MessageMapping("/chat/{roomId}/join")
    public void joinRoom(@DestinationVariable String roomId,
            @Payload ChatMessage chatMessage,
            SimpMessageHeaderAccessor headerAccessor) {

        String username = chatMessage.getSenderId();
        Long userId = chatMessage.getUserId(); // 5. Get User ID

        // 1. Add User to Session (so we know who to remove when they disconnect)
        if (headerAccessor.getSessionAttributes() != null) {
            headerAccessor.getSessionAttributes().put("username", username);
            headerAccessor.getSessionAttributes().put("userId", userId); // 6. Store ID
            headerAccessor.getSessionAttributes().put("roomId", roomId);
        }

        // 2. Add to Redis Set (Unique list of USER IDs now)
        String participantKey = "room:participants:" + roomId;
        // Store as String to match Redis Set behavior
        redisTemplate.opsForSet().add(participantKey, String.valueOf(userId));

        // 3. Broadcast JOIN message (for Chat Log)
        chatMessage.setRoomId(roomId);
        chatMessage.setType(ChatMessage.Type.JOIN);
        redisPublisher.publish(chatMessage);

        // 4. Broadcast UPDATED PARTICIPANT LIST (for Sidebar)
        sendParticipantList(roomId);
    }

    // --- Helper to Send List ---
    private void sendParticipantList(String roomId) {
        String participantKey = "room:participants:" + roomId;
        Set<Object> activeUsers = redisTemplate.opsForSet().members(participantKey);

        // Send to "/topic/room/{roomId}/participants"
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/participants", activeUsers);

        System.out.println("👥 Updated Participants for " + roomId + ": " + activeUsers);
    }
}