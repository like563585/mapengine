package com.mapengine.core;

public class TileManagerOptions {
    private final int maxZoom;
    private final int minZoom;
    private final int tileSize;
    private final boolean cacheTiles;

    public TileManagerOptions(MapEngineOptions opts) {
        this.maxZoom = opts.getMaxZoom();
        this.minZoom = opts.getMinZoom();
        this.tileSize = opts.getTileSize();
        this.cacheTiles = true;
    }

    public int getMaxZoom() { return maxZoom; }
    public int getMinZoom() { return minZoom; }
    public int getTileSize() { return tileSize; }
    public boolean isCacheTiles() { return cacheTiles; }
}
