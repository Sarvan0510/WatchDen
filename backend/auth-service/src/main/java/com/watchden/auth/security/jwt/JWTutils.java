package com.watchden.auth.security.jwt;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import com.watchden.auth.security.services.UserDetailsImplementation;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;

@Component
public class JWTutils {
	
	// Logger for logging errors
    private static final Logger logger = LoggerFactory.getLogger(JWTutils.class);
    
    @Value("${jwt.secret}")
    private String jwtSecret;
    
    @Value("${jwt.expiration-ms}")
    private int jwtExpiration;
    
    private Key getSigningKey() {
    	
    	return Keys.hmacShaKeyFor(jwtSecret.getBytes(StandardCharsets.UTF_8));
    }
    
    public String generateJWTtoken(Authentication authentication) {
    	
    	UserDetailsImplementation userPrinciple = (UserDetailsImplementation) authentication.getPrincipal();
    	
    	return Jwts.builder()
    			.setSubject(userPrinciple.getUsername()) // Set username as subject
    			.setIssuedAt(new Date())	// Set current time as issued time
    			.setExpiration(new Date((new Date()).getTime() + jwtExpiration)) // Set expiration time
    			.signWith(getSigningKey()) // Sign with secret key
    			.compact();
    }
    
    public String getUserNameFromJwtToken(String token) {
    	
    	return Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // Set the signing key
                .build()
                .parseClaimsJws(token) // Parse the token
                .getBody()
                .getSubject(); // Extract the subject (username)
    }
    
    public boolean validateJwtToken(String authToken) {
        try {
            Jwts.parserBuilder()
                .setSigningKey(getSigningKey()) // Set the signing key
                .build()
                .parseClaimsJws(authToken); // Parse the token to validate it
            return true;
        } 
        catch (MalformedJwtException e) {
            
        	logger.error("Invalid JWT token: {}", e.getMessage());
        } 
        catch (ExpiredJwtException e) {
            
        	logger.error("JWT token is expired: {}", e.getMessage());
        } 
        catch (UnsupportedJwtException e) {
            
        	logger.error("JWT token is unsupported: {}", e.getMessage());
        } 
        catch (IllegalArgumentException e) {
            
        	logger.error("JWT claims string is empty: {}", e.getMessage());
        }
        return false;	//Else token is Invalid
    }

}
