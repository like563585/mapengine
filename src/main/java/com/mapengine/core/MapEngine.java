package com.mapengine.core;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.CompletableFuture;

public class MapEngine {
    private static final Logger logger = LoggerFactory.getLogger(MapEngine.class);

    private final String name = "MapEngine";
    private final String version = "1.0.0";

    private final MapEngineOptions options;
    private final CoordinateSystem coordinateSystem;
    private final TileManager tileManager;
    private final CacheManager cacheManager;
    private final Map<String, Layer> layers = new LinkedHashMap<>();
    private volatile boolean initialized = false;

    public MapEngine() {
        this(new MapEngineOptions());
    }

    public MapEngine(MapEngineOptions options) {
        this.options = options != null ? options : new MapEngineOptions();
        this.coordinateSystem = new CoordinateSystem();
        this.tileManager = new TileManager(this.options);
        this.cacheManager = new CacheManager(this.options.getCacheSize());
    }

    public CompletableFuture<Void> initialize() {
        return CompletableFuture.runAsync(() -> {
            try {
                tileManager.initialize();
                cacheManager.initialize();
                initialized = true;
                logger.info("MapEngine initialized");
            } catch (Exception e) {
                logger.error("MapEngine initialization failed", e);
                throw new RuntimeException(e);
            }
        });
    }

    public synchronized Layer addLayer(String layerId, LayerConfig config) {
        if (layers.containsKey(layerId)) {
            throw new IllegalArgumentException("Layer " + layerId + " already exists");
        }
        Layer layer = new Layer(layerId, config);
        layers.put(layerId, layer);
        logger.info("Layer added: {}", layerId);
        return layer;
    }

    public synchronized void removeLayer(String layerId) {
        if (!layers.containsKey(layerId)) throw new NoSuchElementException("Layer not found: " + layerId);
        layers.remove(layerId);
        logger.info("Layer removed: {}", layerId);
    }

    public TileData getTile(int z, int x, int y) throws Exception {
        String cacheKey = String.format("tile:%d:%d:%d", z, x, y);
        TileData cached = cacheManager.get(cacheKey);
        if (cached != null) {
            return cached;
        }
        TileData tile = tileManager.getTile(z, x, y);
        cacheManager.set(cacheKey, tile);
        return tile;
    }

    public double[] transformCoordinates(double[] coords, String fromProj, String toProj) {
        return coordinateSystem.transform(coords, fromProj, toProj);
    }

    public MapInfo getMapInfo() {
        return new MapInfo(name, version, options, new ArrayList<>(layers.values()), cacheManager.getStats(), initialized);
    }

    public void clearCache() {
        cacheManager.clear();
        logger.info("Cache cleared");
    }

    public Metrics getMetrics() {
        return new Metrics(cacheManager.getStats(), tileManager.getStats(), layers.size());
    }

    public void shutdown() {
        try {
            tileManager.shutdown();
        } catch (Exception e) {
            logger.warn("Error shutting down tileManager", e);
        }
        try {
            cacheManager.shutdown();
        } catch (Exception e) {
            logger.warn("Error shutting down cacheManager", e);
        }
        initialized = false;
        logger.info("MapEngine shutdown");
    }

    // small DTOs
    @Getter
    @RequiredArgsConstructor
    public static class Metrics {
        private final Object cacheStats;
        private final Object tileManagerStats;
        private final int layersCount;
    }
}
