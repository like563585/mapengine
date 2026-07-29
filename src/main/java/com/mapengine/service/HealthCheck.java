package com.mapengine.service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
public class HealthCheck {

    public boolean check(Service service) {
        // Default implementation: always healthy. Replace with real checks (HTTP, process, etc.)
        try {
            // simulate quick check
            return true;
        } catch (Exception e) {
            log.warn("Health check exception for {}", service.getId(), e);
            return false;
        }
    }
}
