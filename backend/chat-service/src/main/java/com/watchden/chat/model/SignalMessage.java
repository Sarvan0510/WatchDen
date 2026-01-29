package com.watchden.chat.model;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SignalMessage {

    // 🟢 CHANGE 1: Use String instead of Enum to prevent case-sensitivity crashes
    private String type;

    @JsonProperty("roomId")
    private String roomId;

    @JsonProperty("sender")
    private String senderId;

    // 🟢 CHANGE 2: Use String for payload to safely pass JSON-as-String
    private String payload;

    public SignalMessage() {}

    public SignalMessage(String type, String payload, String senderId) {
        this.type = type;
        this.payload = payload;
        this.senderId = senderId;
    }

    // --- Getters and Setters ---
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getRoomId() { return roomId; }
    public void setRoomId(String roomId) { this.roomId = roomId; }

    public String getSenderId() { return senderId; }
    public void setSenderId(String senderId) { this.senderId = senderId; }

    public String getPayload() { return payload; }
    public void setPayload(String payload) { this.payload = payload; }
}