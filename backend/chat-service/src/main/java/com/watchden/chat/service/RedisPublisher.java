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
        // 1. SAVE history to Redis List (Key: "chat:history:room-1")
        String historyKey = "chat:history:" + message.getRoomId();
        redisTemplate.opsForList().rightPush(historyKey, message);
        
        // Optional: Trim history to last 50 messages to save memory
        redisTemplate.opsForList().trim(historyKey, 0, 50);

        // 2. Publish as before
        String channel = "chat.room." + message.getRoomId();
        redisTemplate.convertAndSend(channel, message);
    }
}