package com.mapengine.core;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class MapInfo {
    private String name;
    private String version;
    private MapEngineOptions options;
    private java.util.List<Layer> layers;
    private Object cacheStats;
    private boolean isInitialized;
}
