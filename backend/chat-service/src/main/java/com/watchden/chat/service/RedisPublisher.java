package com.watchden.chat.service;

import com.watchden.chat.model.ChatMessage;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

@Component
public class RedisPublisher {

    private final RedisTemplate<String, Object> redisTemplate;

    public RedisPublisher(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void publish(ChatMessage message) {
        // 🔴 FIX: Only save to history if it's a real CHAT message
        if (ChatMessage.Type.CHAT.equals(message.getType())) {
            String historyKey = "chat:history:" + message.getRoomId();
            redisTemplate.opsForList().rightPush(historyKey, message);
            
            // Optional: Keep history size manageable (e.g., last 50 messages)
            redisTemplate.opsForList().trim(historyKey, 0, 50);
        }

        // 2. Publish EVERYTHING (Join, Leave, Chat) to the topic so real-time works
        String channel = "chat.room." + message.getRoomId();
        redisTemplate.convertAndSend(channel, message);
    }
}