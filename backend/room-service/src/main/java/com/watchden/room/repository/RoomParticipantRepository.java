package com.watchden.room.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.watchden.room.entity.RoomParticipant;

public interface RoomParticipantRepository extends JpaRepository<RoomParticipant, Long> {

	//To prevent duplicate joins
	boolean existsByRoomIdAndUserId(Long roomId, Long userId);
	
	//Used when leaving room
	void deleteByRoomIdAndUserId(Long roomId, Long userId);
	
	//Used to check if room is empty
	long  countByRoomId(Long roomId);
	
	//Show participant count
	List<RoomParticipant> findByRoomId(Long roomId);
}
