package com.watchden.stream.controller;

import com.watchden.stream.dto.SignalMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * WebRTC signaling relay
     * Client sends to: /app/rooms/{roomId}/signal
     * Server broadcasts to: /topic/rooms/{roomId}/signal
     */
    @MessageMapping("/rooms/{roomId}/signal")
    public void signal(
            @DestinationVariable Long roomId,
            @Payload SignalMessage message
    ) {
        messagingTemplate.convertAndSend(
                "/topic/rooms/" + roomId + "/signal",
                message
        );
    }
}
