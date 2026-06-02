const express = require('express');
const MapEngine = require('./core/MapEngine');
const ServiceManager = require('./service/ServiceManager');
const MapServiceFusion = require('./fusion/MapServiceFusion');
const Monitor = require('./monitor/Monitor');
const { setupRoutes } = require('./api/routes');
const Logger = require('./monitor/Logger');

const app = express();
const logger = new Logger();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 初始化核心模块
const mapEngine = new MapEngine();
const serviceManager = new ServiceManager();
const fusion = new MapServiceFusion(mapEngine, serviceManager);
const monitor = new Monitor(fusion);

// 设置路由
setupRoutes(app, fusion, serviceManager, mapEngine, monitor);

// 错误处理中间件
app.use((err, req, res, next) => {
  logger.error({
    message: 'Request error',
    error: err.message,
    path: req.path,
    method: req.method
  });
  res.status(err.status || 500).json({
    success: false,
    error: err.message
  });
});

// 启动服务
const PORT = process.env.PORT || 3000;

async function start() {
  try {
    await fusion.start();
    logger.info('MapServiceFusion started');
    
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      console.log(`🚀 MapEngine started at http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error({ message: 'Failed to start', error: error.message });
    process.exit(1);
  }
}

// 优雅关闭
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await fusion.stop();
  process.exit(0);
});

start();

module.exports = app;
