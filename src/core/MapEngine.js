const EventEmitter = require('events');
const CoordinateSystem = require('./CoordinateSystem');
const TileManager = require('./TileManager');
const CacheManager = require('./CacheManager');
const Logger = require('../monitor/Logger');

/**
 * MapEngine - 地图服务引擎核心
 * 负责地图渲染、瓦片管理、坐标转换等核心功能
 */
class MapEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.name = 'MapEngine';
    this.version = '1.0.0';
    this.logger = new Logger();
    
    this.options = {
      maxZoom: options.maxZoom || 20,
      minZoom: options.minZoom || 0,
      tileSize: options.tileSize || 256,
      cacheSize: options.cacheSize || 1000,
      projections: options.projections || ['EPSG:4326', 'EPSG:3857']
    };
    
    // 初始化子模块
    this.coordinateSystem = new CoordinateSystem();
    this.tileManager = new TileManager(this.options);
    this.cacheManager = new CacheManager(this.options.cacheSize);
    
    this.layers = new Map();
    this.styles = new Map();
    this.isInitialized = false;
  }
  
  /**
   * 初始化地图引擎
   */
  async initialize() {
    try {
      await this.tileManager.initialize();
      await this.cacheManager.initialize();
      this.isInitialized = true;
      this.logger.info({ message: 'MapEngine initialized' });
      this.emit('initialized');
      return true;
    } catch (error) {
      this.logger.error({ message: 'MapEngine initialization failed', error: error.message });
      throw error;
    }
  }
  
  /**
   * 添加图层
   */
  addLayer(layerId, layerConfig) {
    if (this.layers.has(layerId)) {
      throw new Error(`Layer ${layerId} already exists`);
    }
    
    const layer = {
      id: layerId,
      name: layerConfig.name || layerId,
      type: layerConfig.type || 'raster',
      visible: layerConfig.visible !== false,
      opacity: layerConfig.opacity || 1.0,
      zIndex: layerConfig.zIndex || 0,
      source: layerConfig.source,
      config: layerConfig
    };
    
    this.layers.set(layerId, layer);
    this.logger.info({ message: 'Layer added', layerId });
    this.emit('layer:added', layer);
    return layer;
  }
  
  /**
   * 移除图层
   */
  removeLayer(layerId) {
    if (!this.layers.has(layerId)) {
      throw new Error(`Layer ${layerId} not found`);
    }
    
    this.layers.delete(layerId);
    this.logger.info({ message: 'Layer removed', layerId });
    this.emit('layer:removed', { layerId });
  }
  
  /**
   * 获取瓦片
   */
  async getTile(z, x, y, options = {}) {
    const cacheKey = `tile:${z}:${x}:${y}`;
    
    // 检查缓存
    let tileData = this.cacheManager.get(cacheKey);
    if (tileData) {
      this.emit('tile:cached', { z, x, y });
      return tileData;
    }
    
    try {
      tileData = await this.tileManager.getTile(z, x, y, options);
      this.cacheManager.set(cacheKey, tileData);
      this.emit('tile:loaded', { z, x, y });
      return tileData;
    } catch (error) {
      this.logger.error({ message: 'Failed to get tile', z, x, y, error: error.message });
      throw error;
    }
  }
  
  /**
   * 坐标转换
   */
  transformCoordinates(coords, fromProj, toProj) {
    return this.coordinateSystem.transform(coords, fromProj, toProj);
  }
  
  /**
   * 获取地图信息
   */
  getMapInfo() {
    return {
      name: this.name,
      version: this.version,
      options: this.options,
      layers: Array.from(this.layers.values()),
      cacheStats: this.cacheManager.getStats(),
      isInitialized: this.isInitialized
    };
  }
  
  /**
   * 执行空间查询
   */
  async spatialQuery(bbox, options = {}) {
    const results = [];
    const layers = options.layers || Array.from(this.layers.keys());
    
    for (const layerId of layers) {
      const layer = this.layers.get(layerId);
      if (layer && layer.visible) {
        const layerResults = await this.tileManager.query(layerId, bbox);
        results.push({
          layerId,
          data: layerResults
        });
      }
    }
    
    return results;
  }
  
  /**
   * 清空缓存
   */
  clearCache() {
    this.cacheManager.clear();
    this.logger.info({ message: 'Cache cleared' });
    this.emit('cache:cleared');
  }
  
  /**
   * 获取性能指标
   */
  getMetrics() {
    return {
      cacheStats: this.cacheManager.getStats(),
      tileManagerStats: this.tileManager.getStats(),
      layersCount: this.layers.size
    };
  }
  
  /**
   * 关闭引擎
   */
  async shutdown() {
    await this.tileManager.shutdown();
    await this.cacheManager.shutdown();
    this.isInitialized = false;
    this.logger.info({ message: 'MapEngine shutdown' });
    this.emit('shutdown');
  }
}

module.exports = MapEngine;
