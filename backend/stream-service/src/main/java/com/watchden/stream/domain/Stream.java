package com.watchden.stream.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

import java.time.Instant;

@Entity
@Table(name = "streams")
public class Stream {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "room_id", nullable = false)
    private Long roomId;

    @Column(name = "host_user_id", nullable = false)
    private Long hostUserId;

    @Enumerated(EnumType.STRING)
    @Column(name = "stream_type", nullable = false, length = 20)
    private StreamType streamType;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    private StreamStatus status;

    @Column(name = "media_source", columnDefinition = "TEXT")
    private String mediaSource;

    // ✅ FIXED: renamed from currentTime → playbackTime
    @Column(name = "playback_time")
    private Double playbackTime = 0.0;

    @Column(name = "started_at")
    private Instant startedAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    // ------------------------------------------------
    // Constructors
    // ------------------------------------------------

    protected Stream() {
        // JPA only
    }

    public Stream(Long roomId,
                  Long hostUserId,
                  StreamType streamType,
                  String mediaSource) {

        this.roomId = roomId;
        this.hostUserId = hostUserId;
        this.streamType = streamType;
        this.mediaSource = mediaSource;
        this.status = StreamStatus.IDLE;
        this.playbackTime = 0.0;
        this.updatedAt = Instant.now();
    }

    // ------------------------------------------------
    // Getters
    // ------------------------------------------------

    public Long getId() {
        return id;
    }

    public Long getRoomId() {
        return roomId;
    }

    public Long getHostUserId() {
        return hostUserId;
    }

    public StreamType getStreamType() {
        return streamType;
    }

    public StreamStatus getStatus() {
        return status;
    }

    public String getMediaSource() {
        return mediaSource;
    }

    public Double getPlaybackTime() {
        return playbackTime;
    }

    public Instant getStartedAt() {
        return startedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    // ------------------------------------------------
    // Domain Logic
    // ------------------------------------------------

    public void start() {
        this.status = StreamStatus.STARTED;
        this.startedAt = Instant.now();
        this.updatedAt = Instant.now();
    }

    public void pause(Double playbackTime) {
        this.status = StreamStatus.PAUSED;
        this.playbackTime = playbackTime;
        this.updatedAt = Instant.now();
    }

    public void resume(Double playbackTime) {
        this.status = StreamStatus.STARTED;
        this.playbackTime = playbackTime;
        this.updatedAt = Instant.now();
    }

    public void stop() {
        this.status = StreamStatus.STOPPED;
        this.updatedAt = Instant.now();
    }

    public boolean isActive() {
        return this.status == StreamStatus.STARTED
            || this.status == StreamStatus.PAUSED;
    }
}
