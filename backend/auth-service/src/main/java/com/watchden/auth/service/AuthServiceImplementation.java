package com.watchden.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;


import com.watchden.auth.dto.JWTResponseDTO;
import com.watchden.auth.dto.LoginDTO;
import com.watchden.auth.dto.RegisterResponseDTO;
import com.watchden.auth.dto.UsersDTO;
import com.watchden.auth.entity.Users;
import com.watchden.auth.repository.UserRepository;
import com.watchden.auth.security.jwt.JWTutils;
import com.watchden.auth.security.services.UserDetailsImplementation;

@Service
public class AuthServiceImplementation implements AuthService {
	
	private final AuthenticationManager authenticationManager;	 // Handles user authentication
	private final UserRepository userRepository; 				// Repository for user-related database operations
	private final PasswordEncoder encoder; 						// Encoder for password hashing
	private final JWTutils jwtUtils; 							// Utility for generating JWT tokens

	// Constructor Injection
	public AuthServiceImplementation(AuthenticationManager authenticationManager,
		UserRepository userRepository,
		PasswordEncoder encoder,
		JWTutils jwtUtils) {
		
		this.authenticationManager = authenticationManager;
		this.userRepository = userRepository;
		this.encoder = encoder;
		this.jwtUtils = jwtUtils;
	}
	
	// ---------------- LOGIN ----------------
	@Override
	public JWTResponseDTO login(LoginDTO dto) {

		try {
			// Authenticate the user with provided username and password
			Authentication authentication =
					authenticationManager.authenticate(
						new UsernamePasswordAuthenticationToken(
							dto.getUsername(),
							dto.getPassword()
						)
					);
			
			// Set the authentication in the security context
			SecurityContextHolder.getContext().setAuthentication(authentication);
			
			// Generate JWT token based on the authentication
			String jwt = jwtUtils.generateJWTtoken(authentication);
		
			// Get user Details from the authentication object
			UserDetailsImplementation user = (UserDetailsImplementation) authentication.getPrincipal();
		
			// Return a response containing the JWT and user Details
			return new JWTResponseDTO(
				jwt,
				user.getId(),
				user.getUsername(),
				user.getEmail()
			);
		
		} 
		catch (Exception ex) {
			
			throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Invalid username or password");
		}
	}


	// ---------------- REGISTER ----------------
	@Override
	public ResponseEntity<?> register(UsersDTO dto) {

		// Check if username is already taken
		if (userRepository.existsByUsername(dto.getUsername())) {
			
			return ResponseEntity.badRequest().body(new RegisterResponseDTO("Error : Username is Already Taken..."));
		}

		// Check if email is Already Taken
		if (userRepository.existsByEmail(dto.getEmail())) {
		
			return ResponseEntity.badRequest().body(new RegisterResponseDTO("Error: Email is already in use..."));
		}
	
		// Else Create a new User Account
		Users user = new Users(
			dto.getUsername(),
			encoder.encode(dto.getPassword()),
			dto.getEmail()
		);
	
	
		//Save the user
		try { 
			userRepository.save(user);
		} 
		catch (Exception e) {
			return ResponseEntity
					.badRequest()
					.body(new RegisterResponseDTO("Username or Email already exists"));
		}
	
		// Return a success message upon successful registration
		return ResponseEntity.status(HttpStatus.CREATED).body(new RegisterResponseDTO("User Registered Successfully....."));
	}

}
