import autocannon from 'autocannon';
import { promisify } from 'util';

const BASE = process.env.BASE_URL || 'http://localhost:3000/api';
const DURATION = parseInt(process.env.DURATION || '30');
const CONNECTIONS = parseInt(process.env.CONNECTIONS || '100');

async function runBenchmark(name, url, opts = {}) {
    console.log(`\n=== ${name} ===`);
    const result = await autocannon({
        url,
        connections: CONNECTIONS,
        duration: DURATION,
        pipelining: 1,
        ...opts,
        headers: { 'Content-Type': 'application/json', ...opts.headers },
    });
    console.log(autocannon.printResult(result));
    return result;
}

async function main() {
    console.log(`Benchmark: ${CONNECTIONS} connections over ${DURATION}s`);
    console.log(`Target: ${BASE}`);

    const health = await runBenchmark('Health Check', `${BASE.replace('/api', '')}/api/health`);

    const auth = await runBenchmark('Auth Login', `${BASE}/auth/login`, {
        method: 'POST',
        body: JSON.stringify({ email: 'mentor@test.com', password: 'password123' }),
    });

    console.log('\n=== Summary ===');
    console.log(`Health - Avg Latency: ${health.latency.average}ms, P99: ${health.latency.p99}ms, Requests/sec: ${health.requests.average}`);
    console.log(`Auth   - Avg Latency: ${auth.latency.average}ms, P99: ${auth.latency.p99}ms, Requests/sec: ${auth.requests.average}`);
    console.log(`Total Requests: ${health.requests.total + auth.requests.total}`);
    console.log(`Total Errors: ${health.errors + auth.errors}`);
}

main().catch(console.error);
