const { mapRoutes } = require('./controllers');

/**
 * 设置所有API路由
 */
function setupRoutes(app, fusion, serviceManager, mapEngine, monitor) {
  const controllers = mapRoutes(fusion, serviceManager, mapEngine, monitor);
  
  // 地图服务API
  app.get('/api/map/tiles/:z/:x/:y', controllers.getTile);
  app.get('/api/map/info', controllers.getMapInfo);
  app.post('/api/map/query', controllers.spatialQuery);
  
  // 服务管理API
  app.get('/api/services', controllers.getServices);
  app.post('/api/services', controllers.createService);
  app.get('/api/services/:id', controllers.getService);
  app.put('/api/services/:id', controllers.updateService);
  app.delete('/api/services/:id', controllers.deleteService);
  app.post('/api/services/:id/start', controllers.startService);
  app.post('/api/services/:id/stop', controllers.stopService);
  app.post('/api/services/:id/restart', controllers.restartService);
  
  // 监控API
  app.get('/api/monitor/health', controllers.getHealth);
  app.get('/api/monitor/metrics', controllers.getMetrics);
  app.get('/api/monitor/report', controllers.getReport);
  app.get('/api/monitor/alerts', controllers.getAlerts);
  
  // 系统API
  app.get('/api/system/status', controllers.getSystemStatus);
  app.get('/api/system/info', controllers.getSystemInfo);
}

module.exports = { setupRoutes };
