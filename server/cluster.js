'use strict';

/**
 * Production Cluster Load Balancer
 * 
 * Master process that forks one Fastify worker per CPU core and provides:
 * - OS-level round-robin load balancing (Node.js cluster default)
 * - Worker health monitoring with 5-second heartbeat checks
 * - Adaptive restart with exponential backoff (1s → 30s max)
 * - Graceful shutdown with connection draining (30s timeout)
 * - IPC-based shared rate-limit coordination across workers
 * - Cluster health metrics API on a separate port
 * 
 * Usage: node cluster.js
 * Env:   CLUSTER_WORKERS=4  (override auto-detect)
 *        CLUSTER_HEALTH_PORT=3001  (health dashboard port)
 */

const cluster = require('cluster');
const os = require('os');
const http = require('http');
const path = require('path');

// ─── Configuration ────────────────────────────────────────────────────────────

const WORKER_COUNT = parseInt(process.env.CLUSTER_WORKERS, 10) || os.cpus().length;
const HEALTH_PORT = parseInt(process.env.CLUSTER_HEALTH_PORT, 10) || 3001;
const HEARTBEAT_INTERVAL_MS = 5000;
const HEARTBEAT_TIMEOUT_MS = 10000;
const GRACEFUL_SHUTDOWN_TIMEOUT_MS = 30000;
const MAX_RESTART_DELAY_MS = 30000;
const BASE_RESTART_DELAY_MS = 1000;

// ─── Master Process ───────────────────────────────────────────────────────────

if (cluster.isPrimary) {
    console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
    console.log(`║          PRODUCTION CLUSTER LOAD BALANCER                   ║`);
    console.log(`╠══════════════════════════════════════════════════════════════╣`);
    console.log(`║  Master PID  : ${process.pid.toString().padEnd(43)}║`);
    console.log(`║  CPU Cores   : ${os.cpus().length.toString().padEnd(43)}║`);
    console.log(`║  Workers     : ${WORKER_COUNT.toString().padEnd(43)}║`);
    console.log(`║  Algorithm   : Round-Robin (OS kernel)${' '.repeat(21)}║`);
    console.log(`║  Health Port : ${HEALTH_PORT.toString().padEnd(43)}║`);
    console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

    // ── Worker State Tracking ─────────────────────────────────────────────

    const workerMeta = new Map(); // workerId -> { pid, startedAt, lastHeartbeat, requestCount, memoryMB, status, restartCount, ... }
    const rateLimitStore = new Map(); // IP -> { count, resetAt }
    let totalRequests = 0;
    let isShuttingDown = false;
    const masterStartedAt = Date.now();

    // ── Fork Workers ──────────────────────────────────────────────────────

    for (let i = 0; i < WORKER_COUNT; i++) {
        forkWorker();
    }

    function forkWorker() {
        if (isShuttingDown) return null;

        const worker = cluster.fork();
        const id = worker.id;

        workerMeta.set(id, {
            pid: worker.process.pid,
            startedAt: Date.now(),
            lastHeartbeat: Date.now(),
            requestCount: 0,
            memoryMB: 0,
            status: 'starting',
            restartCount: 0,
            restartDelay: BASE_RESTART_DELAY_MS
        });

        console.log(`[CLUSTER] Worker #${id} forked (PID: ${worker.process.pid})`);

        // ── IPC Message Handler ───────────────────────────────────────────

        worker.on('message', (msg) => {
            const meta = workerMeta.get(id);
            if (!meta) return;

            switch (msg.type) {
                case 'heartbeat_response':
                    meta.lastHeartbeat = Date.now();
                    meta.memoryMB = msg.memoryMB || 0;
                    meta.status = 'online';
                    meta.requestCount = msg.requestCount || 0;
                    break;

                case 'request_tick':
                    meta.requestCount++;
                    totalRequests++;
                    break;

                case 'rate_limit_check': {
                    const now = Date.now();
                    const key = msg.ip;
                    let entry = rateLimitStore.get(key);

                    if (!entry || now > entry.resetAt) {
                        entry = { count: 0, resetAt: now + 60000 }; // 1 minute window
                        rateLimitStore.set(key, entry);
                    }

                    entry.count++;
                    const allowed = entry.count <= 1000; // global limit

                    worker.send({
                        type: 'rate_limit_result',
                        requestId: msg.requestId,
                        allowed,
                        remaining: Math.max(0, 1000 - entry.count),
                        resetAt: entry.resetAt
                    });
                    break;
                }

                case 'worker_ready':
                    meta.status = 'online';
                    console.log(`[CLUSTER] Worker #${id} is ONLINE and accepting connections`);
                    break;
            }
        });

        return worker;
    }

    // ── Worker Exit Handler (Auto-Restart with Backoff) ───────────────────

    cluster.on('exit', (worker, code, signal) => {
        const id = worker.id;
        const meta = workerMeta.get(id);
        const reason = signal || `exit code ${code}`;

        console.error(`[CLUSTER] Worker #${id} (PID: ${worker.process.pid}) died: ${reason}`);

        workerMeta.delete(id);

        if (isShuttingDown) {
            console.log(`[CLUSTER] Shutdown in progress — not restarting worker #${id}`);
            // If all workers are dead during shutdown, exit master
            if (Object.keys(cluster.workers).length === 0) {
                console.log('[CLUSTER] All workers stopped. Master exiting.');
                process.exit(0);
            }
            return;
        }

        // Exponential backoff restart
        const restartCount = (meta?.restartCount || 0) + 1;
        const delay = Math.min(BASE_RESTART_DELAY_MS * Math.pow(2, restartCount - 1), MAX_RESTART_DELAY_MS);

        console.log(`[CLUSTER] Restarting worker in ${delay}ms (restart #${restartCount})`);

        setTimeout(() => {
            const newWorker = forkWorker();
            if (newWorker) {
                const newMeta = workerMeta.get(newWorker.id);
                if (newMeta) {
                    newMeta.restartCount = restartCount;
                    newMeta.restartDelay = delay;
                }
            }
        }, delay);
    });

    // ── Heartbeat Monitor ─────────────────────────────────────────────────

    setInterval(() => {
        if (isShuttingDown) return;

        const now = Date.now();

        for (const [id, worker] of Object.entries(cluster.workers)) {
            if (!worker || worker.isDead()) continue;

            const meta = workerMeta.get(parseInt(id));

            // Send heartbeat ping
            try {
                worker.send({ type: 'heartbeat_ping' });
            } catch (e) {
                // Worker is not reachable
            }

            // Check if heartbeat timed out
            if (meta && (now - meta.lastHeartbeat) > HEARTBEAT_TIMEOUT_MS) {
                console.error(`[CLUSTER] Worker #${id} heartbeat timeout — killing`);
                meta.status = 'unresponsive';
                try {
                    worker.kill('SIGKILL');
                } catch (e) {
                    // Already dead
                }
            }
        }

        // Clean up expired rate limit entries
        for (const [key, entry] of rateLimitStore) {
            if (now > entry.resetAt) {
                rateLimitStore.delete(key);
            }
        }
    }, HEARTBEAT_INTERVAL_MS);

    // ── Graceful Shutdown ─────────────────────────────────────────────────

    function gracefulShutdown(signal) {
        if (isShuttingDown) return;
        isShuttingDown = true;

        console.log(`\n[CLUSTER] ${signal} received — initiating graceful shutdown...`);
        console.log(`[CLUSTER] Draining ${Object.keys(cluster.workers).length} workers (${GRACEFUL_SHUTDOWN_TIMEOUT_MS / 1000}s timeout)...`);

        // Notify all workers to stop accepting connections
        for (const [id, worker] of Object.entries(cluster.workers)) {
            if (!worker || worker.isDead()) continue;
            try {
                worker.send({ type: 'shutdown' });
            } catch (e) {
                // Worker already gone
            }
        }

        // Force kill after timeout
        const forceKillTimer = setTimeout(() => {
            console.error('[CLUSTER] Graceful shutdown timed out — force killing workers');
            for (const [id, worker] of Object.entries(cluster.workers)) {
                if (worker && !worker.isDead()) {
                    try { worker.kill('SIGKILL'); } catch (e) { /* noop */ }
                }
            }
            process.exit(1);
        }, GRACEFUL_SHUTDOWN_TIMEOUT_MS);

        forceKillTimer.unref(); // Don't keep process alive just for this timer
    }

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // ── Cluster Health Dashboard HTTP Server ──────────────────────────────

    const healthServer = http.createServer((req, res) => {
        if (req.url === '/health' && req.method === 'GET') {
            const workers = [];
            for (const [id, meta] of workerMeta) {
                workers.push({
                    id: parseInt(id),
                    pid: meta.pid,
                    status: meta.status,
                    memory_mb: Math.round(meta.memoryMB * 100) / 100,
                    requests: meta.requestCount,
                    uptime_seconds: Math.round((Date.now() - meta.startedAt) / 1000),
                    restart_count: meta.restartCount,
                    last_heartbeat_ms_ago: Date.now() - meta.lastHeartbeat
                });
            }

            const payload = {
                cluster: {
                    master_pid: process.pid,
                    worker_count: workers.length,
                    target_worker_count: WORKER_COUNT,
                    uptime_seconds: Math.round((Date.now() - masterStartedAt) / 1000),
                    total_requests: totalRequests,
                    is_shutting_down: isShuttingDown,
                    memory_mb: Math.round(process.memoryUsage().rss / 1024 / 1024 * 100) / 100,
                    load_average: os.loadavg(),
                    free_memory_mb: Math.round(os.freemem() / 1024 / 1024),
                    total_memory_mb: Math.round(os.totalmem() / 1024 / 1024)
                },
                workers,
                rate_limiter: {
                    active_ips: rateLimitStore.size,
                    global_limit: 1000,
                    window: '1 minute'
                }
            };

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(payload, null, 2));
        } else {
            res.writeHead(404);
            res.end('Not Found');
        }
    });

    healthServer.listen(HEALTH_PORT, () => {
        console.log(`[CLUSTER] Health dashboard: http://localhost:${HEALTH_PORT}/health`);
    });

} else {
    // ── Worker Process ────────────────────────────────────────────────────
    // Each worker runs the full Fastify server
    require('./server.js');
}
