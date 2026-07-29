package com.mapengine.service;

import lombok.extern.slf4j.Slf4j;

import java.util.Map;

@Slf4j
public class ConfigManager {
    public void validate(Map<String, Object> cfg) throws Exception {
        if (cfg == null) throw new IllegalArgumentException("Config cannot be null");
        // add schema validations as needed
        if (!cfg.containsKey("name")) log.debug("Config missing 'name' field, will use default");
    }
}
