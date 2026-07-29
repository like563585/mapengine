package com.mapengine.core;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@ToString
public class MapEngineOptions {
    private int maxZoom = 20;
    private int minZoom = 0;
    private int tileSize = 256;
    private int cacheSize = 1000;

    public MapEngineOptions() {}
}
