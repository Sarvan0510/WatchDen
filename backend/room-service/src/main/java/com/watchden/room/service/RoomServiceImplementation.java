package com.watchden.room.service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.watchden.room.dto.CreateRoomRequestDTO;
import com.watchden.room.dto.CreateRoomResponseDTO;
import com.watchden.room.dto.RoomListResponseDTO;
import com.watchden.room.entity.Room;
import com.watchden.room.entity.RoomParticipant;
import com.watchden.room.exception.AlreadyJoinedException;
import com.watchden.room.exception.InvalidRoomCodeException;
import com.watchden.room.exception.RoomFullException;
import com.watchden.room.exception.RoomNotFoundException;
import com.watchden.room.repository.RoomParticipantRepository;
import com.watchden.room.repository.RoomRepository;

import jakarta.transaction.Transactional;

@Service
public class RoomServiceImplementation implements RoomService {

	private final RoomRepository roomRepository;
	private final RoomParticipantRepository roomParticipantRepository;

	// Constructor injection
	public RoomServiceImplementation(RoomRepository roomRepository,
			RoomParticipantRepository roomParticipantRepository) {

		this.roomRepository = roomRepository;
		this.roomParticipantRepository = roomParticipantRepository;
	}

	// ---------------Create Room-------------------
	@Override
	@Transactional
	public CreateRoomResponseDTO createRoom(CreateRoomRequestDTO request, Long hostUserId) {
		// TODO Auto-generated method stub

		// Generate unique room-code
		String roomCode = generateRoomCode();

		// Create the Room
		Room room = new Room(roomCode, hostUserId, request.getRoomName(), request.getIsPublic(), request.getMaxUsers());

		// Save the room
		Room savedRoom = roomRepository.save(room);

		// Auto-join Participant
		RoomParticipant hostParticipant = new RoomParticipant(savedRoom.getId(), hostUserId);

		roomParticipantRepository.save(hostParticipant);

		return new CreateRoomResponseDTO(
				savedRoom.getId(),
				savedRoom.getRoomCode(),
				savedRoom.getRoomName(),
				savedRoom.isPublic(),
				true,
				savedRoom.getMaxUsers());
	}

	// ---------------Join Room-------------------
	@Override
	@Transactional
	public void joinRoom(String roomCode, Long userId) {
		// TODO Auto-generated method stub

		if (roomCode == null || roomCode.isBlank()) {

			throw new InvalidRoomCodeException("Room code cannot be empty");
		}

		// Find room
		Room room = roomRepository.findByRoomCodeWithLock(roomCode)
				.orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

		// Check Room Capacity
		long currentParticipants = roomParticipantRepository.countByRoomId(room.getId());

		if (room.getMaxUsers() != null && currentParticipants >= room.getMaxUsers()) {

			throw new RoomFullException("Room is full. Max users: " + room.getMaxUsers());
		}

		// Prevent duplicate join
		if (roomParticipantRepository.existsByRoomIdAndUserId(room.getId(), userId)) {

			throw new AlreadyJoinedException("User already joined this room");
		}

		// Create participant
		RoomParticipant participant = new RoomParticipant(room.getId(), userId);

		// save participant
		roomParticipantRepository.save(participant);
	}

	// ---------------Leave Room-------------------
	@Override
	@Transactional
	public void leaveRoom(String roomCode, Long userId) {
		// Look up room by code
		Room room = roomRepository.findByRoomCodeWithLock(roomCode)
				.orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

		Long roomId = room.getId();

		// Check first if user is participant
		if (!roomParticipantRepository.existsByRoomIdAndUserId(roomId, userId)) {
			// Idempotent: If not in room, just return or warn.
			// Throwing exception might break frontend if state is out of sync.
			// But sticking to strict logic for now.
			throw new IllegalStateException("User is not a participant of this room");
		}

		// If host leaves -> close room immediately
		if (room.getHostUserId().equals(userId)) {

			roomRepository.deleteById(roomId);
			return;
		}

		// Normal Participant Leave
		roomParticipantRepository.deleteByRoomIdAndUserId(roomId, userId);

		// If no participant left (Delete room)
		long remaining = roomParticipantRepository.countByRoomId(roomId);

		if (remaining == 0) {

			roomRepository.deleteById(roomId);
		}
	}

	// ---------------Get Room Details-------------------
	@Override
	public RoomListResponseDTO getRoomDetails(String roomCode) {
		Room room = roomRepository.findByRoomCode(roomCode)
				.orElseThrow(() -> new RoomNotFoundException("Room not found with code: " + roomCode));

		long count = roomParticipantRepository.countByRoomId(room.getId());

		return new RoomListResponseDTO(
				room.getId(),
				room.getRoomCode(),
				room.getRoomName(),
				room.getHostUserId(),
				(int) count,
				room.isPublic(),
				room.getMaxUsers());
	}

	// ---------------List All Public Rooms-------------------
	@Override
	@Transactional
	public List<RoomListResponseDTO> getPublicRooms() {
		// TODO Auto-generated method stub

		return roomRepository.findPublicRooms()
				.stream()
				.map(room -> {

					long count = roomParticipantRepository.countByRoomId(room.getId());

					return new RoomListResponseDTO(
							room.getId(),
							room.getRoomCode(),
							room.getRoomName(),
							room.getHostUserId(),
							(int) count,
							room.isPublic(),
							room.getMaxUsers());
				})
				.collect(Collectors.toList());
	}
	
	@Override
	public Long getHostIdByRoomId(Long roomId) {
	    return roomRepository.findById(roomId)
	            .map(Room::getHostUserId)
	            .orElseThrow(() -> new RoomNotFoundException("Room not found with ID: " + roomId));
	}

	// Utility Function
	private String generateRoomCode() {

		String code;
		do {
			code = UUID.randomUUID()
					.toString()
					.replace("-", "")
					.substring(0, 8)
					.toUpperCase();
		} while (roomRepository.findByRoomCode(code).isPresent());

		return code;
	}

}
