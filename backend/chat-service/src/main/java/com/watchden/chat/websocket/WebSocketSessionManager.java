package com.watchden.chat.websocket;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketSession;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class WebSocketSessionManager {

    private final Map<String, Set<WebSocketSession>> roomSessions =
            new ConcurrentHashMap<>();

    public void addSession(String roomId, WebSocketSession session) {
        System.out.println("ADDING SESSION to room " + roomId);

        roomSessions
            .computeIfAbsent(roomId, k -> ConcurrentHashMap.newKeySet())
            .add(session);

        System.out.println("ROOM SIZE: " +
            roomSessions.get(roomId).size());
    }

    public void removeSession(String roomId, WebSocketSession session) {
        if (roomId == null || session == null) return;

        Set<WebSocketSession> sessions = roomSessions.get(roomId);
        if (sessions != null) {
            sessions.remove(session);
        }
    }

    public Set<WebSocketSession> getSessions(String roomId) {
        return roomId == null
                ? Set.of()
                : roomSessions.getOrDefault(roomId, Set.of());
    }
}