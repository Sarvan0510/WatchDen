package com.watchden.stream.controller;

import com.watchden.stream.domain.Stream;
//import com.watchden.stream.domain.StreamType;
import com.watchden.stream.dto.PauseStreamRequest;
import com.watchden.stream.dto.StartStreamRequest;
import com.watchden.stream.dto.StopStreamRequest;
import com.watchden.stream.service.StreamService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@CrossOrigin(origins = "http://localhost:3000")
@RestController
@RequestMapping("/api/streams")
public class StreamController {

    private final StreamService streamService;

    public StreamController(StreamService streamService) {
        this.streamService = streamService;
    }

    @PostMapping("/start")
    @ResponseStatus(HttpStatus.CREATED)
    public Stream startStream(@RequestBody StartStreamRequest request) {
        return streamService.startStream(
                request.roomId(),
                request.userId(),
                request.type(),
                request.source()
        );
    }

    @PostMapping("/pause")
    public Stream pauseStream(@RequestBody PauseStreamRequest request) {
        return streamService.pauseStream(
                request.roomId(),
                request.userId(),
                request.time()
        );
    }

    @PostMapping("/stop")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void stopStream(@RequestBody StopStreamRequest request) {
        streamService.stopStream(
                request.roomId(),
                request.userId()
        );
    }
}
