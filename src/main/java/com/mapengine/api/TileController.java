package com.mapengine.api;

import com.mapengine.core.MapEngine;
import com.mapengine.core.TileData;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tiles")
public class TileController {
    private static final Logger logger = LoggerFactory.getLogger(TileController.class);

    private final MapEngine mapEngine;

    public TileController(MapEngine mapEngine) {
        this.mapEngine = mapEngine;
    }

    @GetMapping(value = "/{z}/{x}/{y}")
    public ResponseEntity<byte[]> getTile(@PathVariable int z, @PathVariable int x, @PathVariable int y) {
        try {
            TileData tile = mapEngine.getTile(z, x, y);
            if (tile == null || tile.getData() == null) {
                return ResponseEntity.status(HttpStatus.NO_CONTENT).build();
            }

            String format = tile.getFormat() != null ? tile.getFormat().toLowerCase() : "png";
            MediaType mediaType = "png".equals(format) ? MediaType.IMAGE_PNG : MediaType.APPLICATION_OCTET_STREAM;

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(mediaType);
            headers.setCacheControl("max-age=60, public");

            return new ResponseEntity<>(tile.getData(), headers, HttpStatus.OK);
        } catch (IllegalArgumentException iae) {
            logger.warn("Invalid tile request {}/{}/{}", z, x, y, iae);
            return ResponseEntity.badRequest().body(iae.getMessage().getBytes());
        } catch (Exception e) {
            logger.error("Error fetching tile {}/{}/{}", z, x, y, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(new byte[0]);
        }
    }
}
