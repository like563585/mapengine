package com.mapengine.core;

import java.util.HashMap;
import java.util.Map;

public class CoordinateSystem {
    private final Map<String, Projection> projections = new HashMap<>();

    public CoordinateSystem() {
        initializeProjections();
    }

    private void initializeProjections() {
        projections.put("EPSG:4326", new Projection("WGS 84", new double[]{-180, -90, 180, 90}, "degrees"));
        projections.put("EPSG:3857", new Projection("Web Mercator", new double[]{-20037508.34, -20048966.1, 20037508.34, 20048966.1}, "meters"));
        projections.put("EPSG:2436", new Projection("China GK Zone 36", new double[]{500000,0,600000,9000000}, "meters"));
    }

    public double[] transform(double[] coords, String fromProj, String toProj) {
        if (fromProj.equals(toProj)) return coords;
        if ("EPSG:4326".equals(fromProj) && "EPSG:3857".equals(toProj)) return wgs84ToWebMercator(coords);
        if ("EPSG:3857".equals(fromProj) && "EPSG:4326".equals(toProj)) return webMercatorToWgs84(coords);
        return coords;
    }

    private double[] wgs84ToWebMercator(double[] coords) {
        double lon = coords[0], lat = coords[1];
        double x = (lon * 20037508.34) / 180;
        double y = Math.log(Math.tan((90 + lat) * Math.PI / 360)) * (20037508.34 / Math.PI);
        return new double[]{x,y};
    }

    private double[] webMercatorToWgs84(double[] coords) {
        double x = coords[0], y = coords[1];
        double lon = (x * 180) / 20037508.34;
        double lat = Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360 / Math.PI - 90;
        return new double[]{lon, lat};
    }

    private static class Projection {
        public final String name;
        public final double[] bounds;
        public final String units;

        public Projection(String name, double[] bounds, String units) {
            this.name = name; this.bounds = bounds; this.units = units;
        }
    }
}
