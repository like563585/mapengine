package com.mapengine.config;

import com.mapengine.core.MapEngine;
import com.mapengine.core.MapEngineOptions;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class AppConfig {

    @Bean
    public MapEngine mapEngine() {
        MapEngineOptions opts = new MapEngineOptions();
        MapEngine engine = new MapEngine(opts);
        // Initialize synchronously so the bean is ready for controllers
        engine.initialize().join();
        return engine;
    }
}
