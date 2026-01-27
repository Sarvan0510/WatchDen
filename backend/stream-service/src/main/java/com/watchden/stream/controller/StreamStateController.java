package com.watchden.stream.controller;

import com.watchden.stream.redis.StreamStateRepository;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/streams")
public class StreamStateController {

    private final StreamStateRepository streamStateRepository;

    public StreamStateController(StreamStateRepository streamStateRepository) {
        this.streamStateRepository = streamStateRepository;
    }

    @GetMapping("/state")
    public Map<String, Object> getStreamState(@RequestParam Long roomId) {

        Map<Object, Object> rawState = streamStateRepository.getState(roomId);

        if (rawState == null || rawState.isEmpty()) {
            return Map.of("status", "STOPPED");
        }

        Map<String, Object> state = new HashMap<>();
        rawState.forEach((k, v) -> state.put(String.valueOf(k), v));

        return state;
    }
}
