package com.watchden.room.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.watchden.room.entity.Room;

import jakarta.persistence.LockModeType;

public interface RoomRepository extends JpaRepository<Room, Long>{
	
	//Used when joining a room using roomCode
	Optional<Room> findByRoomCode(String roomCode);
	
	//If two people hit the "Check" at the exact same millisecond
	//when the room is almost full, they might both get in (exceeding the limit by 1). 
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT r FROM Room r WHERE r.roomCode =  :roomCode")
	Optional<Room> findByRoomCodeWithLock(@Param("roomCode") String roomCode);
	
	
	//Used to check room owner
	boolean existsByIdAndHostUserId(Long roomId, Long hostUserId);
	
	//List all public rooms
	@Query("SELECT r FROM Room r WHERE r.isPublic = true")
	List<Room> findPublicRooms();
	
}
