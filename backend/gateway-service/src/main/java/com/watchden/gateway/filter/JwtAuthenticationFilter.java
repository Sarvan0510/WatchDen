package com.watchden.gateway.filter;

import com.watchden.gateway.util.JwtUtil;

import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

@Component
public class JwtAuthenticationFilter implements GlobalFilter {

    private final JwtUtil jwtUtil;

    public JwtAuthenticationFilter(JwtUtil jwtUtil) {
        this.jwtUtil = jwtUtil;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange,
                             GatewayFilterChain chain) {

        String authHeader =
                exchange.getRequest().getHeaders()
                        .getFirst(HttpHeaders.AUTHORIZATION);

        // Allow public endpoints
        String path = exchange.getRequest().getURI().getPath();
        if (path.contains("/api/auth/") || path.contains("/rooms/public")) {
            return chain.filter(exchange);
        }

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }

        String token = authHeader.substring(7);

        try {
            Claims claims = jwtUtil.validateAndGetClaims(token);

            String username = claims.getSubject();
            Long userId = claims.get("userId", Long.class);

            //Inject headers for downstream services
            ServerWebExchange modifiedExchange =
                    exchange.mutate()
                            .request(builder -> builder
                                    .header("X-USER-ID", String.valueOf(userId))
                                    .header("X-USERNAME", username)
                            )
                            .build();

            return chain.filter(modifiedExchange);

        } 
        catch (Exception e) {
            
        	exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
            return exchange.getResponse().setComplete();
        }
    }
}
