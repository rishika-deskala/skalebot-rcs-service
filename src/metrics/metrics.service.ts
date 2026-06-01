import { Injectable, OnModuleInit } from '@nestjs/common';
import {
  AggregatorRegistry,
  collectDefaultMetrics,
  Counter,
  Histogram,
  Gauge,
  Registry,
} from 'prom-client';

@Injectable()
export class MetricsService implements OnModuleInit {
  private readonly registry = new Registry();
  private readonly aggregatorRegistry = new AggregatorRegistry();

  // HTTP metrics
  public readonly httpRequestsTotal: Counter<string>;
  public readonly httpRequestDuration: Histogram<string>;

  // Custom gauges (we also enable default metrics that include CPU/memory/uptime)
  public readonly appUptimeSeconds: Gauge<string>;

  constructor() {
    // Create metrics
    this.httpRequestsTotal = new Counter({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'route', 'status'] as const,
      registers: [this.registry],
    });

    this.httpRequestDuration = new Histogram({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'route', 'status'] as const,
      // Tune buckets for your latency SLOs
      buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
      registers: [this.registry],
    });

    this.appUptimeSeconds = new Gauge({
      name: 'app_uptime_seconds',
      help: 'Application uptime in seconds',
      registers: [this.registry],
    });

    // Default node/process metrics (CPU, memory, event loop, heap, GC, process start time, etc.)
    collectDefaultMetrics({
      register: this.registry,
      // optional: prefix: 'node_',
      // timeout: 5000,
    });
  }

  onModuleInit() {
    // Update uptime gauge every 5 seconds
    setInterval(() => {
      this.appUptimeSeconds.set(process.uptime());
    }, 5000).unref();
  }

  getRegistry(): Registry {
    return this.registry;
  }

  // For clustering/future: expose aggregated metrics
  async getMetrics(): Promise<string> {
    return this.registry.metrics();
    // If using node cluster/workers, prefer: return this.aggregatorRegistry.metrics();
  }
}
