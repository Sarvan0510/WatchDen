package com.watchden.room.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.watchden.room.dto.CreateRoomRequestDTO;
import com.watchden.room.dto.CreateRoomResponseDTO;
import com.watchden.room.dto.RoomListResponseDTO;
import com.watchden.room.service.RoomService;

import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/rooms")
public class RoomController {
	
	private final RoomService roomService;
	//Constructor injection
	public RoomController(RoomService roomService) {
		this.roomService = roomService;
	}
	
	//---------------Create Room ---------------
	@PostMapping
	public ResponseEntity<CreateRoomResponseDTO> createRoom(
			@Valid @RequestBody CreateRoomRequestDTO request,
			@RequestHeader("X-USER-ID")Long userId)
	{	
		CreateRoomResponseDTO response = roomService.createRoom(request, userId);
		return ResponseEntity.status(HttpStatus.CREATED).body(response);
	}
	
	//---------------Join Room ---------------
	@PostMapping("/join/{roomCode}")
	public ResponseEntity<Void> joinRoom(
			@PathVariable String roomCode,
			@RequestHeader("X-USER-ID")Long userId)
	{
		
		roomService.joinRoom(roomCode, userId);
		return ResponseEntity.ok().build();
	}
	
	//---------------Leave Room ---------------
	@PostMapping("/{roomId}/leave")
	public ResponseEntity<Void> leaveRoom(
			@PathVariable Long roomId, 
			@RequestHeader("X-USER-ID")Long userId)
	{
		roomService.leaveRoom(roomId, userId);
		return ResponseEntity.noContent().build();
	}
	
	//---------------List Public Room ---------------
	@GetMapping("/public")
	public ResponseEntity<List<RoomListResponseDTO>> getPublicRooms(){
		
		List<RoomListResponseDTO> rooms = roomService.getPublicRooms();
		return ResponseEntity.ok(rooms);
	}
}

















