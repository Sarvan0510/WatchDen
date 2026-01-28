package com.watchden.stream.dto;

public record PauseStreamRequest(
        Long roomId,
        Long userId,
        Double time
) {}
