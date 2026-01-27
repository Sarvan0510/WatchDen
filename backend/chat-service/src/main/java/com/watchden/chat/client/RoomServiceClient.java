package com.watchden.chat.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;

@FeignClient(name = "room-service") // Must match Room Service name in Eureka
public interface RoomServiceClient {

    // Ensure your Room Service has this endpoint!
    @GetMapping("/api/rooms/{roomId}/validate")
    boolean validateAccess(@PathVariable("roomId") String roomId, @RequestParam("userId") String userId);
}