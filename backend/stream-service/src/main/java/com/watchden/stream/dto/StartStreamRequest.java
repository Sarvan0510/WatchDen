package com.watchden.stream.dto;

import com.watchden.stream.domain.StreamType;

public record StartStreamRequest(
        Long roomId,
        Long userId,
        StreamType type,
        String source
) {}
