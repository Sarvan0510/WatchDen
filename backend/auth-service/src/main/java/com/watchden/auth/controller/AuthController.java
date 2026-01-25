package com.watchden.auth.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.watchden.auth.dto.JWTResponseDTO;
import com.watchden.auth.dto.LoginDTO;
import com.watchden.auth.dto.RegisterResponseDTO;
import com.watchden.auth.dto.UsersDTO;
import com.watchden.auth.entity.Users;
import com.watchden.auth.repository.UserRepository;
import com.watchden.auth.security.jwt.JWTutils;
import com.watchden.auth.security.services.UserDetailsImplementation;

import jakarta.validation.Valid;

@CrossOrigin(origins= "*", maxAge = 3600)
@RestController
@RequestMapping("/api/auth")
public class AuthController {
	
	@Autowired
	AuthenticationManager authenticationManager;	// Handles user authentication
	
	@Autowired
	UserRepository userRepository;	// Repository for user-related database operations
	
	@Autowired
	PasswordEncoder encoder;	// Encoder for password hashing
	
	@Autowired
	JWTutils jwtUtils;	// Utility for generating JWT tokens
	
	
	//Login
	@PostMapping("/signin")
	public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginDTO dto){
		
		try {
			Authentication authentication = authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(dto.getUsername(), dto.getPassword()));
			
			SecurityContextHolder.getContext().setAuthentication(authentication);
			
			String jwt = jwtUtils.generateJWTtoken(authentication);
			
			UserDetailsImplementation userDetail = (UserDetailsImplementation) authentication.getPrincipal();
			
			return ResponseEntity.ok(
				
				new JWTResponseDTO(
					jwt,
					userDetail.getId(),
					userDetail.getUsername(),
					userDetail.getEmail()
				)
			);
		} catch (Exception e) {
			
			return ResponseEntity
					.status(HttpStatus.UNAUTHORIZED)
					.body(new RegisterResponseDTO("Invalid username and password"));
		}
	}
	
	//Register a new User Account
	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@Valid @RequestBody UsersDTO dto){
		
		//Check if username is already taken
		if(userRepository.existsByUsername(dto.getUsername())) {
			
			return ResponseEntity.badRequest().body(new RegisterResponseDTO("Error : Username is Already Taken..."));
		}
		
		//Check if email is Already Taken
		if(userRepository.existsByEmail(dto.getEmail())) {
			
			return ResponseEntity.badRequest().body(new RegisterResponseDTO("Error: Email is already in use..."));
		}
		
		//Else Create a new User Account
		Users user = new Users(dto.getUsername(), encoder.encode(dto.getPassword()), dto.getEmail());
		
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









