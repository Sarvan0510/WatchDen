package com.watchden.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.watchden.user.entity.UserProfile;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
	
	// Find by the Auth ID (used when a user logs in or updates their own profile)
    Optional<UserProfile> findByUserId(Long userId);

    // Batch fetch by Auth IDs (used by Chat Service to load avatars for a room)
    List<UserProfile> findByUserIdIn(List<Long> userIds);
}
