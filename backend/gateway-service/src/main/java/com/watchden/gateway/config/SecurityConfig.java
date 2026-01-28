package com.watchden.gateway.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.web.server.ServerHttpSecurity;
import org.springframework.security.web.server.SecurityWebFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsConfigurationSource;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityWebFilterChain securityWebFilterChain(ServerHttpSecurity http) {

	    return http
	            // 1. Disable CSRF (Correct)
	            .csrf(ServerHttpSecurity.CsrfSpec::disable)
	            
	            // 🔴 2. FIX: ADD THIS LINE TO ACTIVATE YOUR CORS BEAN
	            .cors(cors -> cors.configurationSource(corsConfigurationSource()))

	            .authorizeExchange(exchange -> exchange
	                    // Allow CORS preflight
	                    .pathMatchers(HttpMethod.OPTIONS).permitAll()

	                    // Allow auth endpoints
	                    .pathMatchers("/api/auth/**").permitAll()

	                    // Allow public room listing
	                    .pathMatchers("/api/rooms/public").permitAll()
	                    
	                    // all socket connections
	                    .pathMatchers("/ws/**").permitAll()

	                    // Everything else
	                    .anyExchange().permitAll() // Note: You might want to change this back to .authenticated() later!
	            )
	            .build();
	}
    
    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of("http://localhost:5173"));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}