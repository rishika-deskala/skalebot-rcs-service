// src/observability/logger.module.ts
import { Global, Module, Injectable, LoggerService as NestLogger } from '@nestjs/common';
import * as winston from 'winston';
import * as nrEnricherNS from '@newrelic/winston-enricher';
import { requestContext } from '../middleware/request-context';

// Resolve the CommonJS export safely (works with/without esModuleInterop)
const nrEnricherFactory: (w: typeof winston) => winston.Logform.FormatWrap =
  ((nrEnricherNS as any).default ?? (nrEnricherNS as any));
const newrelicWinstonFormatter = nrEnricherFactory(winston); // pass winston

@Injectable()
export class AppLogger implements NestLogger {
  private readonly logger: winston.Logger;

  constructor() {
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        // 1) Add NR linking metadata to each log line
        newrelicWinstonFormatter(),            // invoke the FormatWrap -> Format
        // 2) Inject our chainId/sessionId into the log record
        winston.format((info) => {
          const store = requestContext.getStore();
          info.headers = store;
          return info;
        })(),                                   // call custom format factory
        // 3) JSON output (best for log pipelines & NR)
        winston.format.timestamp(),
        winston.format.json()
      ),
      transports: [new winston.transports.Console()],
    });
  }

  log(message: any, context?: string) { this.logger.info(message, { context }); }
  error(message: any, trace?: string, context?: string) { this.logger.error(message, { trace, context }); }
  warn(message: any, context?: string) { this.logger.warn(message, { context }); }
  debug(message: any, context?: string) { this.logger.debug(message, { context }); }
  verbose(message: any, context?: string) { this.logger.verbose(message, { context }); }
}

@Global()
@Module({
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggerModule {}
