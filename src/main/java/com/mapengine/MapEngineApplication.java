package com.mapengine;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * MapEngine 应用主类
 */
@SpringBootApplication
@ComponentScan(basePackages = {"com.mapengine"})
@EnableScheduling
public class MapEngineApplication {

    public static void main(String[] args) {
        SpringApplication.run(MapEngineApplication.class, args);
    }
}
