package com.watchden.user.dto;

public class UserProfileUpdateRequest {
	private String displayName;
	private String avatarUrl;
	
	public UserProfileUpdateRequest() {
		super();
	}
	
	public UserProfileUpdateRequest(String displayName, String avatarUrl) {
		super();
		this.displayName = displayName;
		this.avatarUrl = avatarUrl;
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
