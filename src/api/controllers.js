/**
 * API 控制器
 */

function mapRoutes(fusion, serviceManager, mapEngine, monitor) {
  return {
    // 地图服务API
    async getTile(req, res) {
      try {
        const { z, x, y } = req.params;
        const tile = await fusion.getTile(parseInt(z), parseInt(x), parseInt(y));
        res.set('Content-Type', 'image/png');
        res.send(tile.data);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getMapInfo(req, res) {
      try {
        const info = fusion.getMapInfo();
        res.json(info);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async spatialQuery(req, res) {
      try {
        const { bbox } = req.body;
        const results = await fusion.spatialQuery(bbox);
        res.json(results);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    // 服务管理API
    async getServices(req, res) {
      try {
        const services = fusion.getServices();
        res.json(services);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async createService(req, res) {
      try {
        const service = await serviceManager.createService(req.body);
        res.status(201).json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getService(req, res) {
      try {
        const service = fusion.getService(req.params.id);
        if (!service) {
          return res.status(404).json({ error: 'Service not found' });
        }
        res.json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async updateService(req, res) {
      try {
        const service = await serviceManager.updateServiceConfig(req.params.id, req.body);
        res.json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async deleteService(req, res) {
      try {
        await serviceManager.deleteService(req.params.id);
        res.json({ success: true });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async startService(req, res) {
      try {
        const service = await fusion.startService(req.params.id);
        res.json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async stopService(req, res) {
      try {
        const service = await fusion.stopService(req.params.id);
        res.json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async restartService(req, res) {
      try {
        const service = await fusion.restartService(req.params.id);
        res.json(service);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    // 监控API
    async getHealth(req, res) {
      try {
        const status = fusion.getStatus();
        res.json({
          status: status.isStarted ? 'healthy' : 'unhealthy',
          details: status
        });
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getMetrics(req, res) {
      try {
        const metrics = fusion.getMetrics();
        res.json(metrics);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getReport(req, res) {
      try {
        const timeRange = req.query.timeRange ? parseInt(req.query.timeRange) : 3600000;
        const report = monitor.getReport(timeRange);
        res.json(report);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getAlerts(req, res) {
      try {
        const limit = req.query.limit ? parseInt(req.query.limit) : 100;
        const alerts = monitor.getAlerts(limit);
        res.json(alerts);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    // 系统API
    async getSystemStatus(req, res) {
      try {
        const status = fusion.getStatus();
        res.json(status);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    },
    
    async getSystemInfo(req, res) {
      try {
        const info = {
          version: '1.0.0',
          name: 'MapEngine with Service Management',
          timestamp: new Date().toISOString(),
          status: fusion.getStatus()
        };
        res.json(info);
      } catch (error) {
        res.status(400).json({ error: error.message });
      }
    }
  };
}

module.exports = { mapRoutes };
