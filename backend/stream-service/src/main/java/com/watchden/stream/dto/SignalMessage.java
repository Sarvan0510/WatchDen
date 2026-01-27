package com.watchden.stream.dto;

public record SignalMessage(
        Long roomId,
        Long fromUserId,
        String type,     // OFFER | ANSWER | ICE
        String payload   // SDP or ICE candidate JSON
) {}
