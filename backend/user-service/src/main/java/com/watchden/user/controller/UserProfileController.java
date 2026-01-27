package com.watchden.user.controller;

import com.watchden.user.dto.UserProfileResponse;
import com.watchden.user.dto.UserProfileUpdateRequest;
import com.watchden.user.service.UserProfileService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserProfileController {

    private final UserProfileService userProfileService;

    @GetMapping("/{userId}")
    public ResponseEntity<UserProfileResponse> getUserProfile(@PathVariable Long userId) {
        return ResponseEntity.ok(userProfileService.getProfileByUserId(userId));
    }

    @PutMapping("/me")
    public ResponseEntity<UserProfileResponse> updateMyProfile(
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody UserProfileUpdateRequest request) {
        
        return ResponseEntity.ok(userProfileService.updateProfile(userId, request));
    }

    // URL: POST http://localhost:8082/users/batch
    // Body: [101, 102, 105] (for chat)
    @PostMapping("/batch")
    public ResponseEntity<List<UserProfileResponse>> getUsersBatch(@RequestBody List<Long> userIds) {
        return ResponseEntity.ok(userProfileService.getBatchProfiles(userIds));
    }
    
    @PostMapping("/upload-avatar")
    public ResponseEntity<UserProfileResponse> uploadAvatar(
            @RequestHeader("X-User-Id") Long userId,
            @RequestParam("file") MultipartFile file) {

        try {
            return ResponseEntity.ok(userProfileService.uploadAvatar(userId, file));
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    // 4. INTERNAL: Create Profile (Used by auth-service on signup)
    // URL: POST http://localhost:8082/users/internal/create?userId=101&username=dev
    @PostMapping("/internal/create")
    public ResponseEntity<UserProfileResponse> createProfile(
            @RequestParam Long userId,
            @RequestParam String username) {
        
        return ResponseEntity.ok(userProfileService.createInitialProfile(userId, username));
    }
}