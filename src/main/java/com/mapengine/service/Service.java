package com.mapengine.service;

import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.Map;

@Data
@NoArgsConstructor
public class Service {
    private String id;
    private String name;
    private String type;
    private String status; // created, starting, running, stopping, stopped, failed
    private Map<String, Object> config;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant startedAt;
    private Instant stoppedAt;

    public Service(String id, String name, String type, Map<String, Object> config) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.config = config;
        this.status = "created";
        this.createdAt = Instant.now();
        this.updatedAt = Instant.now();
    }
}
