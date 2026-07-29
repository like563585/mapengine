package com.mapengine.core;

import lombok.Data;

@Data
public class Layer {
    private String id;
    private String name;
    private String type;
    private boolean visible;
    private double opacity;
    private int zIndex;
    private String source;
    private LayerConfig config;

    public Layer(String id, LayerConfig cfg) {
        this.id = id;
        this.name = cfg.getName() != null ? cfg.getName() : id;
        this.type = cfg.getType();
        this.visible = cfg.isVisible();
        this.opacity = cfg.getOpacity();
        this.zIndex = cfg.getZIndex();
        this.source = cfg.getSource();
        this.config = cfg;
    }
}
