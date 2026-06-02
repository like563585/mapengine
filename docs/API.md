# MapEngine API 文档

## 概述

这个文档描述了 MapEngine 提供的所有 RESTful API 端点。

## 基础URL

```
http://localhost:3000/api
```

## 地图服务API

### 获取瓦片

**请求**
```
GET /map/tiles/:z/:x/:y
```

**参数**
- `z` (number): 缩放级别 (0-20)
- `x` (number): 瓦片X坐标
- `y` (number): 瓦片Y坐标

**响应**
```
二进制PNG数据
```

### 获取地图信息

**请求**
```
GET /map/info
```

**响应**
```json
{
  "name": "MapEngine",
  "version": "1.0.0",
  "options": {...},
  "layers": [...],
  "cacheStats": {...},
  "isInitialized": true
}
```

### 空间查询

**请求**
```
POST /map/query
Content-Type: application/json

{
  "bbox": [-180, -90, 180, 90],
  "layers": ["layer1", "layer2"]
}
```

**响应**
```json
[
  {
    "layerId": "layer1",
    "data": [...]
  }
]
```

## 服务管理API

### 获取所有服务

**请求**
```
GET /services
```

**响应**
```json
[
  {
    "id": "service-uuid",
    "name": "Service Name",
    "type": "map",
    "status": "running",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### 创建服务

**请求**
```
POST /services
Content-Type: application/json

{
  "name": "New Service",
  "type": "map",
  "config": {...}
}
```

### 获取服务

**请求**
```
GET /services/:id
```

### 更新服务

**请求**
```
PUT /services/:id
Content-Type: application/json

{
  "config": {...}
}
```

### 删除服务

**请求**
```
DELETE /services/:id
```

### 启动服务

**请求**
```
POST /services/:id/start
```

### 停止服务

**请求**
```
POST /services/:id/stop
```

### 重启服务

**请求**
```
POST /services/:id/restart
```

## 监控API

### 健康检查

**请求**
```
GET /monitor/health
```

**响应**
```json
{
  "status": "healthy",
  "details": {...}
}
```

### 获取指标

**请求**
```
GET /monitor/metrics
```

### 获取报告

**请求**
```
GET /monitor/report?timeRange=3600000
```

### 获取告警

**请求**
```
GET /monitor/alerts?limit=100
```

## 系统API

### 获取系统状态

**请求**
```
GET /system/status
```

### 获取系统信息

**请求**
```
GET /system/info
```
