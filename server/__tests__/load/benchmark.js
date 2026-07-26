const autocannon = require('autocannon');

const BASE_URL = process.env.BENCHMARK_URL || 'http://localhost:3000';
const DURATION = parseInt(process.env.BENCHMARK_DURATION, 10) || 30;

const scenarios = [
    { name: 'Health Check', url: '/api/health', method: 'GET' },
    { name: 'Login', url: '/api/auth/login', method: 'POST', body: JSON.stringify({ email: 'mentor@test.com', password: 'password123' }) },
];

async function runBenchmark(scenario) {
    const result = await autocannon({
        url: BASE_URL,
        ...scenario,
        duration: DURATION,
        connections: 100,
        pipelining: 1,
        headers: { 'Content-Type': 'application/json' },
        body: scenario.body,
    });

    console.log(`\n=== ${scenario.name} ===`);
    console.log(`  Requests/sec:     ${result.requests.average}`);
    console.log(`  Latency (avg):    ${result.latency.average} ms`);
    console.log(`  Latency (p99):    ${result.latency.p99} ms`);
    console.log(`  Throughput:       ${result.throughput.average} bytes/sec`);
    console.log(`  Errors:           ${result.errors}`);
    console.log(`  Timeouts:         ${result.timeouts}`);

    return result;
}

(async () => {
    console.log(`Benchmarking ${BASE_URL} for ${DURATION}s per scenario...`);
    const results = [];
    for (const scenario of scenarios) {
        try {
            const r = await runBenchmark(scenario);
            results.push(r);
        } catch (err) {
            console.error(`Failed to benchmark ${scenario.name}: ${err.message}`);
        }
    }
    console.log('\nDone.');
    process.exit(results.some(r => r.errors > 10) ? 1 : 0);
})();
