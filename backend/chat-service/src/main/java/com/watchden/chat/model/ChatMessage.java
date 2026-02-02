package com.watchden.chat.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class ChatMessage {

    public enum Type {
        JOIN,
        CHAT,
        LEAVE,
        HOST_LEFT,
        SYNC // Video sync (LOAD, PLAY, PAUSE, LOAD_YOUTUBE, HEARTBEAT) so participants see
             // YouTube
    }

    private Type type;

    // Allows frontend to send "room" or "roomId"
    @JsonProperty("roomId")
    private String roomId;

    // Map 'sender' (Frontend) to 'senderId' (Backend)
    @JsonProperty("sender")
    private String senderId;

    private String content;
    private long timestamp;

    // --- Getters and Setters ---

    public Type getType() {
        return type;
    }

    public void setType(Type type) {
        this.type = type;
    }

    public String getRoomId() {
        return roomId;
    }

    public void setRoomId(String roomId) {
        this.roomId = roomId;
    }

    public String getSenderId() {
        return senderId;
    }

    public void setSenderId(String senderId) {
        this.senderId = senderId;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(long timestamp) {
        this.timestamp = timestamp;
    }

    private Long userId;

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }
}