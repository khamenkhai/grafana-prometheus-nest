import { Injectable, NestMiddleware } from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Counter, Gauge, Histogram } from 'prom-client';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CustomMetricsMiddleware implements NestMiddleware {
  constructor(
    @InjectMetric('http_requests_total')
    private readonly requestCounter: Counter<string>,
    @InjectMetric('http_requests_in_progress')
    private readonly inProgressGauge: Gauge<string>,
    @InjectMetric('http_request_duration_seconds')
    private readonly durationHistogram: Histogram<string>,
    @InjectMetric('http_errors_total')
    private readonly errorCounter: Counter<string>,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.inProgressGauge.inc();
    this.requestCounter.labels(req.method, req.originalUrl).inc();

    const end = this.durationHistogram.startTimer();

    res.on('finish', () => {
      end({
        method: req.method,
        origin: req.originalUrl,
        status: res.statusCode.toString(),
      });
      this.inProgressGauge.dec();

      if (res.statusCode >= 400) {
        this.errorCounter
          .labels(req.method, req.originalUrl, res.statusCode.toString())
          .inc();
      }
    });

    next();
  }
}
