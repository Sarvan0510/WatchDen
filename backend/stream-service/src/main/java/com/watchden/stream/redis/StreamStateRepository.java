package com.watchden.stream.redis;

import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Repository;

import java.util.Map;

@Repository
public class StreamStateRepository {

    private final RedisTemplate<String, Object> redisTemplate;

    public StreamStateRepository(RedisTemplate<String, Object> redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public void saveState(Long roomId, Map<String, Object> state) {
        redisTemplate.opsForHash().putAll("stream:" + roomId, state);
    }

    public Map<Object, Object> getState(Long roomId) {
        return redisTemplate.opsForHash().entries("stream:" + roomId);
    }

    public void delete(Long roomId) {
        redisTemplate.delete("stream:" + roomId);
    }
}
