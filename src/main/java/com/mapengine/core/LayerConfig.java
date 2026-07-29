package com.mapengine.core;

import lombok.Data;

@Data
public class LayerConfig {
    private String name;
    private String type = "raster";
    private boolean visible = true;
    private double opacity = 1.0;
    private int zIndex = 0;
    private String source;
}
