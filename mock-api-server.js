#!/usr/bin/env node

const http = require('http');
const url = require('url');

// Datos mock de la API
const detections = [
  {
    id: 1,
    mac_address: "60:60:1F:AA:BB:CC",
    manufacturer_id: 1,
    manufacturer_name: "DJI Technology Co., Ltd.",
    rssi: -50,
    sensor_location: "Edificio A - Planta 3",
    detected_at: "2024-12-04T10:30:00Z",
    created_at: "2024-12-04T10:30:05Z"
  },
  {
    id: 2,
    mac_address: "AA:BB:CC:DD:EE:FF",
    manufacturer_id: 1,
    manufacturer_name: "DJI Technology Co., Ltd.",
    rssi: -65,
    sensor_location: "Techo - Zona Perimetral",
    detected_at: "2024-12-04T10:35:00Z",
    created_at: "2024-12-04T10:35:05Z"
  },
  {
    id: 3,
    mac_address: "11:22:33:44:55:66",
    manufacturer_id: 2,
    manufacturer_name: "Parrot",
    rssi: -75,
    sensor_location: "Estacionamiento",
    detected_at: "2024-12-04T10:40:00Z",
    created_at: "2024-12-04T10:40:05Z"
  }
];

const manufacturers = [
  {
    id: 1,
    oui: "60:60:1F",
    name: "DJI Technology Co., Ltd.",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  },
  {
    id: 2,
    oui: "00:26:5F",
    name: "Parrot",
    created_at: "2024-01-15T10:00:00Z",
    updated_at: "2024-01-15T10:00:00Z"
  }
];

const stats = {
  total_detections: 3,
  unique_drones: 3,
  blocked_drones: 0,
  active_locations: 3,
  top_manufacturers: [
    {
      name: "DJI Technology Co., Ltd.",
      count: 2
    },
    {
      name: "Parrot",
      count: 1
    }
  ]
};

const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // GET /api/v1/manufacturers
  if (req.method === 'GET' && pathname === '/api/v1/manufacturers') {
    res.writeHead(200);
    res.end(JSON.stringify(manufacturers, null, 2));
    return;
  }

  // GET /api/v1/detections
  if (req.method === 'GET' && pathname === '/api/v1/detections') {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 10;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedData = detections.slice(start, end);

    const response = {
      status: 200,
      total: detections.length,
      page: page,
      limit: limit,
      pages: Math.ceil(detections.length / limit),
      data: paginatedData
    };

    res.writeHead(200);
    res.end(JSON.stringify(response, null, 2));
    return;
  }

  // GET /api/v1/detections/latest
  if (req.method === 'GET' && pathname === '/api/v1/detections/latest') {
    const latest = detections.slice(-5);
    res.writeHead(200);
    res.end(JSON.stringify(latest, null, 2));
    return;
  }

  // GET /api/v1/stats
  if (req.method === 'GET' && pathname === '/api/v1/stats') {
    res.writeHead(200);
    res.end(JSON.stringify(stats, null, 2));
    return;
  }

  // POST /api/v1/detections
  if (req.method === 'POST' && pathname === '/api/v1/detections') {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
      try {
        const payload = JSON.parse(body);
        const newDetection = {
          id: detections.length + 1,
          mac_address: payload.mac,
          manufacturer_id: 1,
          manufacturer_name: "DJI Technology Co., Ltd.",
          rssi: payload.rssi,
          sensor_location: payload.sensor_location,
          detected_at: payload.timestamp,
          created_at: new Date().toISOString()
        };
        detections.push(newDetection);
        stats.total_detections = detections.length;

        res.writeHead(201);
        res.end(JSON.stringify(newDetection, null, 2));
      } catch (e) {
        res.writeHead(400);
        res.end(JSON.stringify({ error: 'Invalid JSON' }));
      }
    });
    return;
  }

  // DELETE /api/v1/detections/{id}
  const deleteMatch = pathname.match(/^\/api\/v1\/detections\/(\d+)$/);
  if (req.method === 'DELETE' && deleteMatch) {
    const id = parseInt(deleteMatch[1]);
    const index = detections.findIndex(d => d.id === id);
    
    if (index === -1) {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'Detection not found' }));
      return;
    }
    
    const deleted = detections.splice(index, 1)[0];
    stats.total_detections = detections.length;
    
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 200,
      message: 'Detection deleted successfully',
      deleted: deleted
    }, null, 2));
    return;
  }

  // 404
  res.writeHead(404);
  res.end(JSON.stringify({ error: 'Not Found' }));
});

const PORT = 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`\n✅ Mock API Server corriendo en http://localhost:${PORT}`);
  console.log(`\nEndpoints disponibles:`);
  console.log(`  GET  http://localhost:8080/api/v1/manufacturers`);
  console.log(`  GET  http://localhost:8080/api/v1/detections`);
  console.log(`  GET  http://localhost:8080/api/v1/detections/latest`);
  console.log(`  GET  http://localhost:8080/api/v1/stats`);
  console.log(`  POST http://localhost:8080/api/v1/detections`);
  console.log(`\nPresiona CTRL+C para detener\n`);
});
