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

@Service
public class UserProfileService {

    public final UserProfileRepository userProfileRepository;

    public UserProfileService(UserProfileRepository userProfileRepository) {
        this.userProfileRepository = userProfileRepository;
    }

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
        // 1. Fetch existing
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User profile not found for ID: " + userId));

        // 2. Update only provided fields
        if (request.getDisplayName() != null && !request.getDisplayName().isBlank()) {
            profile.setDisplayName(request.getDisplayName());
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().isBlank()) {
            profile.setAvatarUrl(request.getAvatarUrl());
        }

        UserProfile savedProfile = userProfileRepository.save(profile);

        return mapToResponse(savedProfile);
    }

    @Transactional
    public UserProfileResponse uploadAvatar(Long userId, MultipartFile file) throws IOException {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate a simple filename (e.g., "101_17000000.jpg")
        String fileName = userId + "_" + System.currentTimeMillis() + ".jpg";

        // Create directory if not exists (Absolute Path: backend/uploads)
        String currentDir = System.getProperty("user.dir");
        java.nio.file.Path backendDir = java.nio.file.Paths.get(currentDir).getParent(); // Moves up to 'backend'
        java.nio.file.Path uploadPath = backendDir.resolve("uploads");
        File uploadDir = uploadPath.toFile();

        if (!uploadDir.exists()) {
            boolean created = uploadDir.mkdirs();
            System.out.println("📂 Created SHARED upload dir: " + uploadDir.getAbsolutePath() + " (" + created + ")");
        }

        System.out.println("💾 Saving avatar to: " + new File(uploadDir, fileName).getAbsolutePath());
        file.transferTo(new File(uploadDir, fileName));

        profile.setAvatarUrl("/uploads/" + fileName);
        return mapToResponse(userProfileRepository.save(profile));
    }

    @Transactional
    public UserProfileResponse createInitialProfile(Long userId, String username) {

        if (userProfileRepository.findByUserId(userId).isPresent()) {
            throw new RuntimeException("Profile already exists for user " + userId);
        }

        UserProfile newProfile = new UserProfile();
        newProfile.setUserId(userId);
        newProfile.setUsername(username);
        newProfile.setDisplayName(username);

        return mapToResponse(userProfileRepository.save(newProfile));
    }

    private UserProfileResponse mapToResponse(UserProfile entity) {

        if (entity == null) {
            return null;
        }

        UserProfileResponse response = new UserProfileResponse();

        response.setUserId(entity.getUserId());
        response.setUsername(entity.getUsername()); // This maps entity.getUserName() to DTO.setUserName()
        response.setDisplayName(entity.getDisplayName());
        response.setAvatarUrl(entity.getAvatarUrl());

        return response;
    }

}
