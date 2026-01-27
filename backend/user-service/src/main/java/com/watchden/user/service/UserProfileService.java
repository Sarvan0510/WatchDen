package com.watchden.user.service;

import java.io.File;
import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.watchden.user.dto.UserProfileResponse;
import com.watchden.user.dto.UserProfileUpdateRequest;
import com.watchden.user.entity.UserProfile;
import com.watchden.user.repository.UserProfileRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserProfileService {
	
	public final UserProfileRepository userProfileRepository;
	
	public UserProfileResponse getProfileByUserId(long userId) {
		UserProfile profile = userProfileRepository.findByUserId(userId)
				.orElseThrow(() -> new RuntimeException("User profile not found for ID : " + userId));
		
		return mapToResponse(profile);
	}
	
    public List<UserProfileResponse> getBatchProfiles(List<Long> userIds) {
        List<UserProfile> profiles = userProfileRepository.findByUserIdIn(userIds);
        
        return profiles.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }
    
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UserProfileUpdateRequest request) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found"));

        // Only update if the field is sent (not null)
        if (request.getDisplayName() != null && !request.getDisplayName().isEmpty()) {
            profile.setDisplayName(request.getDisplayName());
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isEmpty()) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);
        return mapToResponse(savedProfile);
    }
    
    @Transactional
    public UserProfileResponse uploadAvatar(Long userId, MultipartFile file) throws IOException {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a simple filename (e.g., "101_17000000.jpg") {timestamp for caching issues on browser}
        String fileName = userId + "_" + System.currentTimeMillis() + ".jpg";

        file.transferTo(new File("uploads/" + fileName));

        profile.setAvatarUrl("/uploads/" + fileName);
        return mapToResponse(userProfileRepository.save(profile));
    }
    
    @Transactional
    public UserProfileResponse createInitialProfile(Long userId, String userName) {

        if (userProfileRepository.findByUserId(userId).isPresent()) {
             throw new RuntimeException("Profile already exists for user " + userId);
        }

        UserProfile newProfile = new UserProfile();
        newProfile.setUserId(userId);
        newProfile.setUserName(userName);
        newProfile.setDisplayName(userName);
        
        return mapToResponse(userProfileRepository.save(newProfile));
    }

	private UserProfileResponse mapToResponse(UserProfile entity) {
		UserProfileResponse response = new UserProfileResponse();
	    BeanUtils.copyProperties(entity, response); 
	    return response;
	}
	
}
