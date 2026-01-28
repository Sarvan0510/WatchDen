package com.watchden.auth.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.watchden.auth.entity.Users;

@Repository
public interface UserRepository extends JpaRepository<Users, Long> {
	
	Users findByUsername(String username);
	Boolean existsByUsername(String username);
	Boolean existsByEmail(String email);
}
