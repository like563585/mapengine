package com.mapengine.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

public class TileManager {
    private static final Logger logger = LoggerFactory.getLogger(TileManager.class);

    private final TileManagerOptions options;
    private final Map<String, TileData> tileCache = new ConcurrentHashMap<>();
    private final Stats stats = new Stats();

    public TileManager(MapEngineOptions opts) {
        this.options = new TileManagerOptions(opts);
    }

    public void initialize() {
        logger.info("TileManager initialized");
    }

    public TileData getTile(int z, int x, int y) throws Exception {
        if (!isValidTile(z, x, y)) throw new IllegalArgumentException("Invalid tile coordinates: z="+z+" x="+x+" y="+y);
        String key = z + "/" + x + "/" + y;
        if (tileCache.containsKey(key)) {
            stats.cached++;
            return tileCache.get(key);
        }
        TileData tile = loadTile(z, x, y);
        if (options.isCacheTiles()) tileCache.put(key, tile);
        stats.loaded++;
        return tile;
    }

    private TileData loadTile(int z, int x, int y) {
        byte[] data = new byte[this.options.getTileSize() * this.options.getTileSize() * 4];
        return TileData.builder()
                .z(z).x(x).y(y)
                .data(data)
                .format("png")
                .timestamp(System.currentTimeMillis())
                .build();
    }

    private boolean isValidTile(int z, int x, int y) {
        if (z < options.getMinZoom() || z > options.getMaxZoom()) return false;
        int max = 1 << z;
        return x >= 0 && x < max && y >= 0 && y < max;
    }

    public Object getStats() {
        return new Object() {
            public final long loaded = stats.loaded;
            public final long failed = stats.failed;
            public final long cached = stats.cached;
            public final int cacheSize = tileCache.size();
        };
    }

    public void clearCache() { tileCache.clear(); logger.info("Tile cache cleared"); }

    public void shutdown() { clearCache(); logger.info("TileManager shutdown"); }

    private static class Stats { long loaded=0, failed=0, cached=0; }
}
