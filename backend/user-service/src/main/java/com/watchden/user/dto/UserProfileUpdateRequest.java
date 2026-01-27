package com.watchden.user.dto;

import lombok.Data;

@Data
public class UserProfileUpdateRequest {
	private String displayName;
	private String avatarUrl;
}
