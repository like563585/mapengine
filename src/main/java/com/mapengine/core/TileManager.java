package com.mapengine.core;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
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
        // 1. 尝试从 classpath/static/sample-tiles/{z}/{x}/{y}.png 加载
        String resourcePath = String.format("sample-tiles/%d/%d/%d.png", z, x, y);
        try (InputStream is = getClass().getClassLoader().getResourceAsStream(resourcePath)) {
            if (is != null) {
                byte[] bytes = is.readAllBytes();
                logger.debug("Loaded tile from classpath: {}", resourcePath);
                return TileData.builder().z(z).x(x).y(y).data(bytes).format("png").timestamp(System.currentTimeMillis()).build();
            }
        } catch (IOException e) {
            logger.warn("Failed to read tile from classpath {}", resourcePath, e);
        }

        // 2. 尝试从工作目录下的 data/sample-tiles/{z}/{x}/{y}.png 加载
        Path fsPath = Paths.get("data", "sample-tiles", String.valueOf(z), String.valueOf(x), y + ".png");
        if (Files.exists(fsPath)) {
            try {
                byte[] bytes = Files.readAllBytes(fsPath);
                logger.debug("Loaded tile from filesystem: {}", fsPath.toString());
                return TileData.builder().z(z).x(x).y(y).data(bytes).format("png").timestamp(System.currentTimeMillis()).build();
            } catch (IOException e) {
                logger.warn("Failed to read tile from filesystem {}", fsPath, e);
            }
        }

        // 3. 回退：生成一个空白 PNG（透明）作为示例瓦片
        try {
            int size = Math.max(1, options.getTileSize());
            BufferedImage img = new BufferedImage(size, size, BufferedImage.TYPE_INT_ARGB);
            Graphics2D g = img.createGraphics();
            try {
                g.setComposite(AlphaComposite.Clear);
                g.fillRect(0, 0, size, size);
                g.setComposite(AlphaComposite.SrcOver);
                // draw simple grid/marker to make tiles visually distinct
                g.setColor(new Color(0, 0, 0, 20));
                for (int i = 0; i < size; i += Math.max(8, size / 8)) {
                    g.drawLine(i, 0, i, size);
                    g.drawLine(0, i, size, i);
                }
                g.setColor(new Color(0, 0, 0, 128));
                g.drawString(String.format("%d/%d/%d", z, x, y), 8, 16);
            } finally {
                g.dispose();
            }

            try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
                ImageIO.write(img, "png", baos);
                byte[] bytes = baos.toByteArray();
                logger.debug("Generated placeholder tile for {}/{}/{}", z, x, y);
                return TileData.builder().z(z).x(x).y(y).data(bytes).format("png").timestamp(System.currentTimeMillis()).build();
            }
        } catch (Exception e) {
            // 最后回退到与旧实现兼容的简单字节数组
            logger.warn("Failed to generate PNG tile, returning empty byte buffer", e);
            byte[] data = new byte[this.options.getTileSize() * this.options.getTileSize() * 4];
            return TileData.builder().z(z).x(x).y(y).data(data).format("raw").timestamp(System.currentTimeMillis()).build();
        }
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
