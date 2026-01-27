package com.watchden.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

	private Long userId;
	private String userName;
	private String displayName;
	private String avatarUrl;
	
}
