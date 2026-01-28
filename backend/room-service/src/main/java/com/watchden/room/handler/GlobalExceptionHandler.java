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
	public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {

		Map<String, String> errors = new HashMap<>();

		ex.getBindingResult()
				.getFieldErrors()
				.forEach(error -> errors.put(error.getField(), error.getDefaultMessage()));

		return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
	}

	// ---------------- ROOM EXCEPTIONS ----------------
	@ExceptionHandler(RoomNotFoundException.class)
	public ResponseEntity<Map<String, String>> handleRoomNotFound(RoomNotFoundException ex) {
		return buildErrorResponse(HttpStatus.NOT_FOUND, ex.getMessage());
	}

	@ExceptionHandler(RoomFullException.class)
	public ResponseEntity<Map<String, String>> handleRoomFull(RoomFullException ex) {
		return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
	}

	@ExceptionHandler(AlreadyJoinedException.class)
	public ResponseEntity<Map<String, String>> handleAlreadyJoined(AlreadyJoinedException ex) {
		return buildErrorResponse(HttpStatus.CONFLICT, ex.getMessage());
	}

	@ExceptionHandler(UnauthorizedRoomActionException.class)
	public ResponseEntity<Map<String, String>> handleUnauthorizedAction(UnauthorizedRoomActionException ex) {
		return buildErrorResponse(HttpStatus.FORBIDDEN, ex.getMessage());
	}

	@ExceptionHandler(RoomClosedException.class)
	public ResponseEntity<Map<String, String>> handleRoomClosed(RoomClosedException ex) {
		return buildErrorResponse(HttpStatus.GONE, ex.getMessage());
	}

	@ExceptionHandler(InvalidRoomCodeException.class)
	public ResponseEntity<Map<String, String>> handleInvalidRoomCode(InvalidRoomCodeException ex) {
		return buildErrorResponse(HttpStatus.BAD_REQUEST, ex.getMessage());
	}

	// ---------------- FALLBACK ----------------
	@ExceptionHandler(Exception.class)
	public ResponseEntity<Map<String, String>> handleGeneralException(Exception ex) {

		logger.error("Unhandled exception occurred", ex);
		return buildErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR, "An unexpected error occurred");
	}

	private ResponseEntity<Map<String, String>> buildErrorResponse(HttpStatus status, String message) {
		Map<String, String> response = new HashMap<>();
		response.put("message", message);
		return ResponseEntity.status(status).body(response);
	}

}
