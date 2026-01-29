package com.watchden.chat.controller;

import com.watchden.chat.model.SignalMessage;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
public class SignalingController {

    private final SimpMessagingTemplate messagingTemplate;

    public SignalingController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * WebRTC Signaling Endpoint
     * Frontend sends to: /app/chat/{roomId}/signal
     * We broadcast to: /topic/room/{roomId}/signal
     */
    @MessageMapping("/chat/{roomId}/signal")
    public void handleSignal(@DestinationVariable String roomId,
                             @Payload SignalMessage message,
                             SimpMessageHeaderAccessor headerAccessor) {

        // 🔍 DEBUG LOGS
        System.out.println("⚡ SIGNAL RECEIVED: " + message.getType());
        System.out.println("   From JSON (sender): " + message.getSenderId());
        
        // Check Session (Likely null, which is fine if JSON sender is correct)
        String sessionUsername = (String) headerAccessor.getSessionAttributes().get("username");
        System.out.println("   From Session: " + sessionUsername);

        if (sessionUsername != null) {
            message.setSenderId(sessionUsername);
        }
        
        // 🔍 Print final broadcast
        System.out.println("   >> Broadcasting to: /topic/room/" + roomId + "/signal");

        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/signal", message);
    }
}