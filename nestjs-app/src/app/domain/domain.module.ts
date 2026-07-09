import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  makeCounterProvider,
  makeGaugeProvider,
  makeHistogramProvider,
  PrometheusModule,
} from '@willsoto/nestjs-prometheus';
import { CustomMetricsMiddleware } from '../matrix/matrix.middleware';
import { TodoModule } from './todo/todo.module';
import { TodoEntity } from './todo/todo.entity';

@Module({
  imports: [
    PrometheusModule.register({ path: '/metrics' }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      url: 'postgres://api:development_pass@postgres:5432/test-api',
      synchronize: true,
      entities: [TodoEntity],
    }),
    TodoModule,
  ],
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total number of HTTP requests',
      labelNames: ['method', 'origin'] as string[],
    }),
    makeGaugeProvider({
      name: 'http_requests_in_progress',
      help: 'Number of in-progress HTTP requests',
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'origin', 'status'] as string[],
      buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5, 10],
    }),
    makeCounterProvider({
      name: 'http_errors_total',
      help: 'Total number of HTTP error responses',
      labelNames: ['method', 'origin', 'status'] as string[],
    }),
  ],
})
export class DomainModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(CustomMetricsMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
    });
  }
}
