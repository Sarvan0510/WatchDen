package com.watchden.stream.webrtc;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class SignalMessage {

    public enum Type {
        OFFER,
        ANSWER,
        ICE
    }

    private Long roomId;
    private String from;
    private String to;
    private Type type;
    private Object payload;

    @JsonCreator
    public SignalMessage(
            @JsonProperty("roomId") Long roomId,
            @JsonProperty("from") String from,
            @JsonProperty("to") String to,
            @JsonProperty("type") Type type,
            @JsonProperty("payload") Object payload
    ) {
        this.roomId = roomId;
        this.from = from;
        this.to = to;
        this.type = type;
        this.payload = payload;
    }

    public Long getRoomId() { return roomId; }
    public String getFrom() { return from; }
    public String getTo() { return to; }
    public Type getType() { return type; }
    public Object getPayload() { return payload; }
}
