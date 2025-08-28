import express from 'express';
import client from 'prom-client';

client.collectDefaultMetrics();

export const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'code'],
});

export const wsConnections = new client.Gauge({
  name: 'websocket_connections',
  help: 'Number of active WebSocket connections',
});

export const dbQueryDuration = new client.Histogram({
  name: 'db_query_duration_seconds',
  help: 'Duration of database queries in seconds',
  labelNames: ['operation'],
});

export async function metricsEndpoint(_req: express.Request, res: express.Response) {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
}
