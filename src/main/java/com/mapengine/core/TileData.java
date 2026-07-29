package com.mapengine.core;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TileData {
    private int z;
    private int x;
    private int y;
    private byte[] data;
    private String format;
    private long timestamp;
}
