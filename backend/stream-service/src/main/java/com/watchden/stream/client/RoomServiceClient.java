package com.watchden.stream.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "room-service")
public interface RoomServiceClient {

    @GetMapping("/rooms/{roomId}/host")
    Long getHostUserId(@PathVariable Long roomId);
}
