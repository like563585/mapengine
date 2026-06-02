const Logger = require('../monitor/Logger');

/**
 * CoordinateSystem - 坐标系统
 * 负责不同坐标系统之间的转换
 */
class CoordinateSystem {
  constructor() {
    this.logger = new Logger();
    this.projections = new Map();
    this.initializeProjections();
  }
  
  /**
   * 初始化支持的坐标系统
   */
  initializeProjections() {
    // WGS84 地理坐标系 (经纬度)
    this.projections.set('EPSG:4326', {
      name: 'WGS 84',
      bounds: [-180, -90, 180, 90],
      units: 'degrees'
    });
    
    // Web Mercator 投影坐标系
    this.projections.set('EPSG:3857', {
      name: 'Web Mercator',
      bounds: [-20037508.34, -20048966.1, 20037508.34, 20048966.1],
      units: 'meters'
    });
    
    // 中国坐标系统
    this.projections.set('EPSG:2436', {
      name: 'China GK Zone 36',
      bounds: [500000, 0, 600000, 9000000],
      units: 'meters'
    });
  }
  
  /**
   * 坐标转换
   */
  transform(coords, fromProj, toProj) {
    if (fromProj === toProj) {
      return coords;
    }
    
    // 获取投影信息
    const from = this.projections.get(fromProj);
    const to = this.projections.get(toProj);
    
    if (!from || !to) {
      throw new Error(`Unsupported projection: ${!from ? fromProj : toProj}`);
    }
    
    // 执行转换
    if (fromProj === 'EPSG:4326' && toProj === 'EPSG:3857') {
      return this.wgs84ToWebMercator(coords);
    } else if (fromProj === 'EPSG:3857' && toProj === 'EPSG:4326') {
      return this.webMercatorToWgs84(coords);
    }
    
    return coords;
  }
  
  /**
   * WGS84 转 Web Mercator
   */
  wgs84ToWebMercator(coords) {
    const [lon, lat] = coords;
    const x = (lon * 20037508.34) / 180;
    const y = Math.log(Math.tan(((90 + lat) * Math.PI) / 360)) * (20037508.34 / Math.PI);
    return [x, y];
  }
  
  /**
   * Web Mercator 转 WGS84
   */
  webMercatorToWgs84(coords) {
    const [x, y] = coords;
    const lon = (x * 180) / 20037508.34;
    const lat = (Math.atan(Math.exp((y * Math.PI) / 20037508.34)) * 360) / Math.PI - 90;
    return [lon, lat];
  }
  
  /**
   * 获取支持的投影列表
   */
  getSupportedProjections() {
    return Array.from(this.projections.entries()).map(([code, info]) => ({
      code,
      ...info
    }));
  }
  
  /**
   * 获取投影边界
   */
  getProjectionBounds(projCode) {
    const proj = this.projections.get(projCode);
    if (!proj) {
      throw new Error(`Projection ${projCode} not found`);
    }
    return proj.bounds;
  }
}

module.exports = CoordinateSystem;
