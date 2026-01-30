package com.watchden.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.watchden.chat.model.ChatMessage;
import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.messaging.simp.SimpMessagingTemplate; // 👈 KEY IMPORT
import org.springframework.stereotype.Component;

@Component
public class RedisSubscriber implements MessageListener {

    private final SimpMessagingTemplate messagingTemplate; // 👈 Use this for STOMP
    private final ObjectMapper objectMapper;

    public RedisSubscriber(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
    }

    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String body = new String(message.getBody());
            System.out.println("1️⃣ REDIS RAW MSG: " + body);

            ChatMessage chatMessage = objectMapper.readValue(body, ChatMessage.class);
            // System.out.println("2️⃣ PARSED ROOM ID: " + chatMessage.getRoomId());

            // 🚀 STOMP PUSH: Send to everyone subscribed to "/topic/room/{roomId}"
            // This matches the frontend subscribe path: `/topic/room/${roomId}`
            String destination = "/topic/room/" + chatMessage.getRoomId();
            
            messagingTemplate.convertAndSend(destination, chatMessage);
            
            System.out.println("✅ STOMP SENT TO: " + destination);

        } catch (Exception e) {
            System.err.println("❌ REDIS SUB ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}