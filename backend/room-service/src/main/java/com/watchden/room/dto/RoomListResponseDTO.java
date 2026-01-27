package com.watchden.room.dto;

public class RoomListResponseDTO {
	
	private Long roomId;
	private String roomName;
	private int participantCount;
	private boolean isPublic;
	private Integer maxUsers;
	
	public RoomListResponseDTO(Long roomId, String roomName, int participantCount, boolean isPublic, Integer maxUsers) {
		
		this.roomId = roomId;
		this.roomName = roomName;
		this.participantCount = participantCount;
		this.isPublic = isPublic;
		this.maxUsers = maxUsers;
	}

	public Long getRoomId() {
		return roomId;
	}

	public String getRoomName() {
		return roomName;
	}

	public int getParticipantCount() {
		return participantCount;
	}

	public boolean isPublic() {
		return isPublic;
	}
	
	public Integer getMaxUsers() {
		return maxUsers;
	}
}
