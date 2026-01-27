package com.watchden.chat.service;

import com.watchden.chat.model.ChatMessage;
import com.watchden.chat.websocket.WebSocketSessionManager;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Set;

import org.springframework.data.redis.connection.Message;
import org.springframework.data.redis.connection.MessageListener;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

@Component
public class RedisSubscriber implements MessageListener {

    private final WebSocketSessionManager sessionManager;
    private final ObjectMapper objectMapper;

    public RedisSubscriber(WebSocketSessionManager sessionManager) {
        this.sessionManager = sessionManager;
        this.objectMapper = new ObjectMapper();
        this.objectMapper.findAndRegisterModules();
    }

 // In RedisSubscriber.java
    @Override
    public void onMessage(Message message, byte[] pattern) {
        try {
            String body = new String(message.getBody());
            System.out.println("1️⃣ REDIS RAW MSG: " + body);

            ChatMessage chatMessage = objectMapper.readValue(body, ChatMessage.class);
            System.out.println("2️⃣ PARSED ROOM ID: " + chatMessage.getRoomId());

            var sessions = sessionManager.getSessions(chatMessage.getRoomId());
            System.out.println("3️⃣ ACTIVE SESSIONS: " + sessions.size());

            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(objectMapper.writeValueAsString(chatMessage)));
                    System.out.println("4️⃣ SENT TO CLIENT");
                }
            }
        } catch (Exception e) {
            System.err.println("❌ REDIS SUB ERROR: " + e.getMessage());
            e.printStackTrace();
        }
    }
}