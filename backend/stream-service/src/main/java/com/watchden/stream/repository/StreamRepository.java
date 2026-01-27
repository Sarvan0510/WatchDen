package com.watchden.stream.repository;

import com.watchden.stream.domain.Stream;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface StreamRepository extends JpaRepository<Stream, Long> {

    Optional<Stream> findByRoomId(Long roomId);
}
