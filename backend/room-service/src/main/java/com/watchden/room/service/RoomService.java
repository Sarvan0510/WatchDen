package com.watchden.room.service;

import java.util.List;

import com.watchden.room.dto.CreateRoomRequestDTO;
import com.watchden.room.dto.CreateRoomResponseDTO;
import com.watchden.room.dto.RoomListResponseDTO;

public interface RoomService {

	// Creates a new room and auto-joins host
	CreateRoomResponseDTO createRoom(CreateRoomRequestDTO request, Long hostUserId);

	// Join Room using room code
	void joinRoom(String roomCode, Long userId);

	/**
	 * Allows a user to leave a room.
	 * If host leaves -> room is deleted.
	 * If last participant leaves -> room is deleted.
	 */
	void leaveRoom(String roomCode, Long userId);

	// Inside RoomService interface
	Long getHostIdByRoomId(Long roomId);
	
	// List all public rooms
	List<RoomListResponseDTO> getPublicRooms();

	// Get specific room details
	RoomListResponseDTO getRoomDetails(String roomCode);
}
