package com.watchden.stream.dto;

public record StopStreamRequest(
        Long roomId,
        Long userId
) {}
