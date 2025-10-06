import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import * as fs from 'fs/promises';
import * as path from 'path';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly logsDir = path.join(process.cwd(), 'logs');
  private readonly logFile = path.join(this.logsDir, 'requests.log.json');

  constructor() {
    this.initializeLogFile().then(() => {
      this.logger.log(
        `Logging initialized. Logs will be saved to ${this.logFile}`,
      );
    });
  }

  /**
   * Initialize logs directory and file
   */
  private async initializeLogFile() {
    try {
      await fs.mkdir(this.logsDir, { recursive: true });

      try {
        await fs.access(this.logFile);
      } catch {
        await fs.writeFile(this.logFile, '[]', 'utf-8');
        this.logger.log(`Created log file: ${this.logFile}`);
      }
    } catch (error) {
      this.logger.error('Failed to initialize log file:', error);
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const { method, url, body, query, params, ip, headers } = request;
    const userAgent = headers['user-agent'] || 'Unknown';
    const startTime = Date.now();

    const requestLog = {
      type: 'REQUEST',
      timestamp: new Date().toISOString(),
      method,
      url,
      body: this.sanitizeBody(body),
      query,
      params,
      ip,
      userAgent,
    };

    this.logger.log(requestLog);

    this.saveLogToFile(requestLog)
      .then((r) => this.logger.log(r))
      .catch((e) => this.logger.error(e));

    return next.handle().pipe(
      tap((data) => {
        const responseTime = Date.now() - startTime;
        const statusCode = response.statusCode;

        const responseLog = {
          type: 'RESPONSE',
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          data: this.sanitizeResponse(data),
        };

        this.logger.log(responseLog);

        this.saveLogToFile(responseLog)
          .then((r) => this.logger.log(r))
          .catch((e) => this.logger.error(e));
      }),
      catchError((error) => {
        const responseTime = Date.now() - startTime;
        const statusCode = error.status || 500;

        const errorLog = {
          type: 'ERROR_RESPONSE',
          timestamp: new Date().toISOString(),
          method,
          url,
          statusCode,
          responseTime: `${responseTime}ms`,
          error: {
            message: error.message,
            stack: error.stack,
          },
        };

        this.logger.error(errorLog);

        this.saveLogToFile(errorLog)
          .then((r) => this.logger.log(r))
          .catch((e) => this.logger.error(e));

        throw error;
      }),
    );
  }

  /**
   * Sanitize request body to hide sensitive data
   */
  private sanitizeBody(body: any): any {
    if (!body) return body;

    const sanitized = { ...body };
    const sensitiveFields = [
      'password',
      'token',
      'refreshToken',
      'accessToken',
    ];

    sensitiveFields.forEach((field) => {
      if (sanitized[field]) {
        sanitized[field] = '***REDACTED***';
      }
    });

    return sanitized;
  }

  /**
   * Sanitize response data to hide sensitive information
   */
  private sanitizeResponse(data: any): any {
    if (!data) return data;

    if (Array.isArray(data) && data.length > 10) {
      return `[Array with ${data.length} items]`;
    }

    return data;
  }

  /**
   * Save log entry to JSON file
   */
  private async saveLogToFile(logEntry: any): Promise<void> {
    try {
      const fileContent = await fs.readFile(this.logFile, 'utf-8');
      const logs = JSON.parse(fileContent);

      logs.push(logEntry);

      if (logs.length > 1000) {
        logs.shift(); // Remove oldest entry
      }
      await fs.writeFile(this.logFile, JSON.stringify(logs, null, 2), 'utf-8');
    } catch (error) {
      this.logger.error('Failed to save log to file:', error.message);
    }
  }
}
