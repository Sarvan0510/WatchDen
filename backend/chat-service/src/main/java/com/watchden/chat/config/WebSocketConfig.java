package com.watchden.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker // Enable STOMP Broker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // 2. Register the "/ws" endpoint that roomSocket.js connects to
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*") // Allow Gateway connection
                .withSockJS(); // Enable SockJS support
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        // 3. Configure prefixes
        // Frontend sends to "/app/..." -> routed to @MessageMapping
        registry.setApplicationDestinationPrefixes("/app");
        
        // Backend sends to "/topic/..." -> routed to Frontend subscribers
        registry.enableSimpleBroker("/topic");
    }
}