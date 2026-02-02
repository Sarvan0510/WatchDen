package com.watchden.stream.service;

import com.watchden.stream.client.RoomServiceClient;
import com.watchden.stream.domain.Stream;
import com.watchden.stream.domain.StreamType;
import com.watchden.stream.redis.StreamStateRepository;
import com.watchden.stream.repository.StreamRepository;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class StreamService {

	private final StreamRepository streamRepository;
	private final RoomServiceClient roomServiceClient;
	private final StreamStateRepository streamStateRepository;

	public StreamService(StreamRepository streamRepository, RoomServiceClient roomServiceClient,
			StreamStateRepository streamStateRepository) {
		this.streamRepository = streamRepository;
		this.roomServiceClient = roomServiceClient;
		this.streamStateRepository = streamStateRepository;
	}

    public Stream startStream(Long roomId, Long userId,
                              StreamType type, String source) {

        Long hostId = roomServiceClient.getHostUserId(roomId);
        if (!hostId.equals(userId)) {
            throw new IllegalStateException("Only host can start stream");
        }

        Stream stream = streamRepository
                .findByRoomId(roomId)
                .orElse(new Stream(roomId, hostId, type, source));

        stream.start();

        streamStateRepository.saveState(
                roomId,
                Map.of(
                        "status", stream.getStatus().name(),
                        "media", source,
                        "time", 0.0
                )
        );

        return streamRepository.save(stream);
    }

	public Stream pauseStream(Long roomId, Long userId, Double time) {

		Long hostId = roomServiceClient.getHostUserId(roomId);
		if (!hostId.equals(userId)) {
			throw new IllegalStateException("Only host can pause stream");
		}

		Stream stream = streamRepository.findByRoomId(roomId)
				.orElseThrow(() -> new IllegalStateException("Stream not found"));

		stream.pause(time);

		streamStateRepository.saveState(roomId, Map.of("status", stream.getStatus().name(), "time", time));

		return streamRepository.save(stream);
	}

	public void stopStream(Long roomId, Long userId) {

		Long hostId = roomServiceClient.getHostUserId(roomId);
		if (!hostId.equals(userId)) {
			throw new IllegalStateException("Only host can stop stream");
		}

		Stream stream = streamRepository.findByRoomId(roomId)
				.orElseThrow(() -> new IllegalStateException("Stream not found"));

		stream.stop();

		streamStateRepository.delete(roomId);
		streamRepository.save(stream);
	}
}
