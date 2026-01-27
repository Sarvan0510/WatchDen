package com.watchden.gateway.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

        return http
                .csrf(ServerHttpSecurity.CsrfSpec::disable)
                .authorizeExchange(exchange -> exchange
                        
                		// Allow CORS preflight
                        .pathMatchers(HttpMethod.OPTIONS).permitAll()

                        // Allow auth endpoints
                        .pathMatchers("/api/auth/**").permitAll()

                        // Allow public room listing
                        .pathMatchers("/api/rooms/public").permitAll()

                        // Everything else is handled by JWT filter
                        .anyExchange().permitAll()
                )
                .build();
    }
}