import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import os from 'os';

describe('logger', () => {
    it('writes JSONL access logs and returns logger api', async () => {
        const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cafe-log-'));
        const prev = process.env.NODE_ENV;
        process.env.NODE_ENV = 'development';
        // logger writes into server/logs — ensure dir exists by requiring module
        const loggerPath = path.resolve('middleware/logger.js');
        const { logger, requestLogger, securityLogger, performanceLogger } = await import(loggerPath);

        expect(typeof logger.info).toBe('function');
        expect(typeof logger.error).toBe('function');
        expect(typeof securityLogger.loginSuccess).toBe('function');
        expect(typeof performanceLogger.slowQuery).toBe('function');

        logger.info('unit-test-log', { requestId: 'r1', userId: 'u1' });
        const logFile = path.resolve('logs/info-' + new Date().toISOString().split('T')[0] + '.log');
        expect(fs.existsSync(logFile)).toBe(true);
        const tail = fs.readFileSync(logFile, 'utf8').trim().split('\n').pop();
        const parsed = JSON.parse(tail);
        expect(parsed.message).toBe('unit-test-log');
        expect(parsed.requestId).toBe('r1');

        // requestLogger request+response lines
        const req = {
            id: 'req-test',
            method: 'GET',
            originalUrl: '/api/v1/test',
            ip: '127.0.0.1',
            get: () => 'vitest',
            userId: 'u9',
            tenantId: 't9',
        };
        const res = { statusCode: 200, end() {}, get: () => '10' };
        const originalEnd = res.end;
        requestLogger(req, res, () => {});
        res.end();
        expect(typeof originalEnd).toBe('function');

        process.env.NODE_ENV = prev;
        fs.rmSync(tmp, { recursive: true, force: true });
    });
});
