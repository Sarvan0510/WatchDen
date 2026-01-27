package com.watchden.chat.controller;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat")
@CrossOrigin(origins = "http://localhost:5173", allowCredentials = "true")
public class ChatController {

    private final RedisTemplate<String, Object> redisTemplate;

    public ChatController(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @GetMapping("/history/{roomId}")
    public List<Object> getChatHistory(
            @PathVariable String roomId,
            // ⚠️ FIX: Set required = false
            @RequestHeader(value = "X-USER-ID", required = false) String userId
    ) {
    	// MUST REMOVE THIS PART AND CHANGE THE REQUIRED STATUS TO TRUE WHENTHE GATEWAY IS RUNnig
        if (userId == null) {
            System.out.println("⚠️ Warning: Direct access, no X-USER-ID header present.");
        } else {
            System.out.println("✅ User " + userId + " fetching history.");
        }
        
        return redisTemplate.opsForList().range("chat:history:" + roomId, 0, -1);
    }
}