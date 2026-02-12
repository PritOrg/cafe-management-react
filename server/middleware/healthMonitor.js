const os = require('os');
const mongoose = require('mongoose');
const { logger, performanceLogger } = require('./logger');

/**
 * System Health Monitoring Middleware
 */

class HealthMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                averageResponseTime: 0
            },
            system: {
                uptime: 0,
                memory: {},
                cpu: {},
                load: []
            },
            database: {
                status: 'unknown',
                connections: 0,
                responseTime: 0
            }
        };
        
        this.responseTimes = [];
        this.maxResponseTimeHistory = 100; // Keep last 100 response times
        
        // Start monitoring
        this.startSystemMonitoring();
    }

    /**
     * Start system monitoring intervals
     */
    startSystemMonitoring() {
        // Monitor system metrics every 30 seconds
        setInterval(() => {
            this.updateSystemMetrics();
        }, 30000);

        // Monitor database every 60 seconds
        setInterval(() => {
            this.updateDatabaseMetrics();
        }, 60000);

        // Log health summary every 5 minutes
        setInterval(() => {
            this.logHealthSummary();
        }, 300000);
    }

    /**
     * Update system metrics
     */
    updateSystemMetrics() {
        const memoryUsage = process.memoryUsage();
        const systemMemory = {
            total: os.totalmem(),
            free: os.freemem(),
            used: os.totalmem() - os.freemem()
        };

        this.metrics.system = {
            uptime: process.uptime(),
            memory: {
                process: {
                    rss: memoryUsage.rss,
                    heapTotal: memoryUsage.heapTotal,
                    heapUsed: memoryUsage.heapUsed,
                    external: memoryUsage.external
                },
                system: systemMemory,
                usage: {
                    processPercent: (memoryUsage.rss / systemMemory.total) * 100,
                    systemPercent: (systemMemory.used / systemMemory.total) * 100
                }
            },
            cpu: {
                cores: os.cpus().length,
                model: os.cpus()[0]?.model || 'Unknown',
                architecture: os.arch()
            },
            load: os.loadavg(),
            platform: os.platform(),
            nodeVersion: process.version
        };

        // Check for high memory usage
        const memoryUsageMB = memoryUsage.rss / 1024 / 1024;
        performanceLogger.highMemoryUsage(memoryUsageMB, 200); // Alert if > 200MB
    }

    /**
     * Update database metrics
     */
    async updateDatabaseMetrics() {
        try {
            const startTime = Date.now();
            
            // Test database connection
            await mongoose.connection.db.admin().ping();
            
            const responseTime = Date.now() - startTime;
            
            this.metrics.database = {
                status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
                connections: mongoose.connection.db?.serverConfig?.connections?.length || 0,
                responseTime,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            };

            // Log slow database responses
            if (responseTime > 100) {
                performanceLogger.slowQuery({ operation: 'ping' }, responseTime, 100);
            }
        } catch (error) {
            this.metrics.database = {
                status: 'error',
                error: error.message,
                responseTime: -1
            };
            
            logger.error('Database health check failed', {
                error: error.message,
                type: 'HEALTH_CHECK'
            });
        }
    }

    /**
     * Track request metrics
     */
    trackRequest(req, res, responseTime) {
        this.metrics.requests.total++;
        
        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.success++;
        } else {
            this.metrics.requests.errors++;
        }

        // Update response time metrics
        this.responseTimes.push(responseTime);
        if (this.responseTimes.length > this.maxResponseTimeHistory) {
            this.responseTimes.shift();
        }

        // Calculate average response time
        this.metrics.requests.averageResponseTime = 
            this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    }

    /**
     * Get current health status
     */
    getHealthStatus() {
        const status = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || '1.0.0',
            environment: process.env.NODE_ENV || 'development',
            metrics: this.metrics
        };

        // Determine overall health status
        if (this.metrics.database.status !== 'connected') {
            status.status = 'unhealthy';
            status.issues = status.issues || [];
            status.issues.push('Database connection issue');
        }

        if (this.metrics.system.memory.usage.processPercent > 90) {
            status.status = status.status === 'healthy' ? 'degraded' : 'unhealthy';
            status.issues = status.issues || [];
            status.issues.push('High memory usage');
        }

        if (this.metrics.requests.averageResponseTime > 2000) {
            status.status = status.status === 'healthy' ? 'degraded' : 'unhealthy';
            status.issues = status.issues || [];
            status.issues.push('High response times');
        }

        const errorRate = this.metrics.requests.total > 0 
            ? (this.metrics.requests.errors / this.metrics.requests.total) * 100 
            : 0;
        
        if (errorRate > 10) {
            status.status = status.status === 'healthy' ? 'degraded' : 'unhealthy';
            status.issues = status.issues || [];
            status.issues.push('High error rate');
        }

        return status;
    }

    /**
     * Log health summary
     */
    logHealthSummary() {
        const health = this.getHealthStatus();
        
        logger.info('Health Summary', {
            status: health.status,
            uptime: `${Math.floor(this.metrics.system.uptime / 3600)}h ${Math.floor((this.metrics.system.uptime % 3600) / 60)}m`,
            requests: this.metrics.requests,
            memoryUsage: `${Math.round(this.metrics.system.memory.usage.processPercent)}%`,
            databaseStatus: this.metrics.database.status,
            issues: health.issues || [],
            type: 'HEALTH_SUMMARY'
        });
    }

    /**
     * Reset metrics
     */
    resetMetrics() {
        this.metrics.requests = {
            total: 0,
            success: 0,
            errors: 0,
            averageResponseTime: 0
        };
        this.responseTimes = [];
    }
}

// Create singleton instance
const healthMonitor = new HealthMonitor();

/**
 * Middleware to track request metrics
 */
const trackRequestMetrics = (req, res, next) => {
    const startTime = Date.now();
    
    // Override res.end to track completion
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        healthMonitor.trackRequest(req, res, responseTime);
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

/**
 * Health check endpoint handler
 */
const healthCheckHandler = (req, res) => {
    const health = healthMonitor.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'degraded' ? 200 : 503;
    
    res.status(statusCode).json(health);
};

/**
 * Detailed metrics endpoint handler
 */
const metricsHandler = (req, res) => {
    res.json({
        timestamp: new Date().toISOString(),
        metrics: healthMonitor.metrics,
        responseTimes: {
            recent: healthMonitor.responseTimes.slice(-10),
            average: healthMonitor.metrics.requests.averageResponseTime,
            min: Math.min(...healthMonitor.responseTimes),
            max: Math.max(...healthMonitor.responseTimes)
        }
    });
};

module.exports = {
    HealthMonitor,
    healthMonitor,
    trackRequestMetrics,
    healthCheckHandler,
    metricsHandler
};
