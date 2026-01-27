package com.watchden.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.watchden.auth.dto.LoginDTO;
import com.watchden.auth.dto.UsersDTO;
import com.watchden.auth.service.AuthService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
	
	private final AuthService authService;
	
	//Constructor injection
	public AuthController(AuthService authService) {
		
		this.authService = authService;
	}
	
	
	//Login
	@PostMapping("/signin")
	public ResponseEntity<?> authenticateUser(@Valid @RequestBody LoginDTO dto) {

		return ResponseEntity.ok(authService.login(dto));
	}
	
	// Register a new User Account
	@PostMapping("/signup")
	public ResponseEntity<?> registerUser(@Valid @RequestBody UsersDTO dto) {

		return ResponseEntity.status(HttpStatus.CREATED).body(authService.register(dto));
	}
		
}









