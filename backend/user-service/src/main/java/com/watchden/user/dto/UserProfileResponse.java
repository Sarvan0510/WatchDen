package com.watchden.user.dto;

public class UserProfileResponse {

	private Long userId;
	private String userName;
	private String displayName;
	private String avatarUrl;
	
	public UserProfileResponse() {
		super();
	}
	
	public UserProfileResponse(Long userId, String userName, String displayName, String avatarUrl) {
		super();
		this.userId = userId;
		this.userName = userName;
		this.displayName = displayName;
		this.avatarUrl = avatarUrl;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getDisplayName() {
		return displayName;
	}

	public void setDisplayName(String displayName) {
		this.displayName = displayName;
	}

	public String getAvatarUrl() {
		return avatarUrl;
	}

	public void setAvatarUrl(String avatarUrl) {
		this.avatarUrl = avatarUrl;
	}
	
	
	
}
