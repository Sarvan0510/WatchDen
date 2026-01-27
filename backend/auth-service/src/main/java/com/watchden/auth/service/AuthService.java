package com.watchden.auth.service;

import org.springframework.http.ResponseEntity;

import com.watchden.auth.dto.JWTResponseDTO;
import com.watchden.auth.dto.LoginDTO;
import com.watchden.auth.dto.UsersDTO;

public interface AuthService {
	
	JWTResponseDTO login(LoginDTO dto);
	ResponseEntity<?> register(UsersDTO dto);
}
