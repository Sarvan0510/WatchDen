package com.watchden.room.handler;

import java.util.HashMap;
import java.util.Map;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.watchden.room.exception.*;

@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);


	// ---------------- VALIDATION ERRORS ----------------
	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Map<String, String>>handleValidationExceptions(MethodArgumentNotValidException ex) {

		Map<String, String> errors = new HashMap<>();

		ex.getBindingResult()
			.getFieldErrors()
			.forEach(error ->
			errors.put(error.getField(), error.getDefaultMessage())
		);

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
	}


	// ---------------- ROOM EXCEPTIONS ----------------
	@ExceptionHandler(RoomNotFoundException.class)
	public ResponseEntity<String> handleRoomNotFound(RoomNotFoundException ex) {
		
		return ResponseEntity.status(HttpStatus.NOT_FOUND).body(ex.getMessage());
	}
	
	@ExceptionHandler(RoomFullException.class)
	public ResponseEntity<String> handleRoomFull(RoomFullException ex) {

		return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
	}

	@ExceptionHandler(AlreadyJoinedException.class)
	public ResponseEntity<String> handleAlreadyJoined(AlreadyJoinedException ex) {
	
		return ResponseEntity.status(HttpStatus.CONFLICT).body(ex.getMessage());
	}


	@ExceptionHandler(UnauthorizedRoomActionException.class)
	public ResponseEntity<String> handleUnauthorizedAction(UnauthorizedRoomActionException ex) {
	
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(ex.getMessage());
	}


	@ExceptionHandler(RoomClosedException.class)
	public ResponseEntity<String> handleRoomClosed(RoomClosedException ex) {
	
		return ResponseEntity.status(HttpStatus.GONE).body(ex.getMessage());
	}


	@ExceptionHandler(InvalidRoomCodeException.class)
	public ResponseEntity<String> handleInvalidRoomCode(InvalidRoomCodeException ex) {
	
		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(ex.getMessage());
	}


	// ---------------- FALLBACK ----------------
	@ExceptionHandler(Exception.class)
	public ResponseEntity<String> handleGeneralException(Exception ex) {

		logger.error("Unhandled exception occurred", ex);

		return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("An unexpected error occurred");
	}

}
