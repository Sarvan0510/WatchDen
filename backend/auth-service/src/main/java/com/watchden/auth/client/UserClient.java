package com.watchden.auth.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "user-service") // Finds the service via Eureka
public interface UserClient {

    // Calls the endpoint in User Service
    @PostMapping("/api/users/internal/create")
    void createUserProfile(@RequestParam("userId") Long userId, @RequestParam("username") String username);
}
