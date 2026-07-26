import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const errorRate = new Rate('errors');
const latencyTrend = new Trend('latency');

export const options = {
    stages: [
        { duration: '30s', target: 20 },
        { duration: '1m', target: 50 },
        { duration: '30s', target: 100 },
        { duration: '1m', target: 100 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        errors: ['rate<0.05'],
        http_req_duration: ['p(95)<2000'],
    },
};

export default function () {
    const res = http.get(`${BASE_URL}/api/health`);
    const passed = check(res, {
        'status is 200': (r) => r.status === 200,
        'response has status ok': (r) => r.json().status === 'ok',
    });
    errorRate.add(!passed);
    latencyTrend.add(res.timings.duration);
    sleep(1);
}
