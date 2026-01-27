package com.watchden.stream.controller;

import com.watchden.stream.webrtc.SignalMessage;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;

@Controller
public class StreamWebSocketController {

    @MessageMapping("/signal")
    @SendTo("/topic/signal")
    public SignalMessage signal(SignalMessage message) {
        return message;
    }
}
