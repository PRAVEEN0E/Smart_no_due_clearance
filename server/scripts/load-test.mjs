import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000/api';

const errorRate = new Rate('errors');
const authDuration = new Trend('auth_duration');
const dashboardDuration = new Trend('dashboard_duration');
const healthDuration = new Trend('health_duration');
const successCount = new Counter('successful_requests');

export const options = {
    stages: [
        { duration: '30s', target: 100 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 1000 },
        { duration: '30s', target: 500 },
        { duration: '30s', target: 0 },
    ],
    thresholds: {
        errors: ['rate<0.05'],
        http_req_duration: ['p(95)<2000'],
        auth_duration: ['p(95)<1500'],
        dashboard_duration: ['p(95)<3000'],
    },
};

const CREDENTIALS = [
    { email: 'mentor@test.com', password: 'password123', role: 'MENTOR' },
    { email: 'staff@test.com', password: 'password123', role: 'STAFF' },
    { email: 'student@test.com', password: 'password123', role: 'STUDENT' },
];

export default function () {
    group('Health Check', () => {
        const res = http.get(`${BASE_URL.replace('/api', '')}/api/health`);
        healthDuration.add(res.timings.duration);
        check(res, { 'health status is 200': (r) => r.status === 200 });
        successCount.add(res.status === 200 ? 1 : 0);
        errorRate.add(res.status !== 200);
    });

    group('Authentication', () => {
        const cred = CREDENTIALS[Math.floor(Math.random() * CREDENTIALS.length)];
        const payload = JSON.stringify({ email: cred.email, password: cred.password });
        const res = http.post(`${BASE_URL}/auth/login`, payload, {
            headers: { 'Content-Type': 'application/json' },
        });
        authDuration.add(res.timings.duration);
        const success = check(res, {
            'auth status is 200': (r) => r.status === 200,
            'auth has token': (r) => r.json('token') !== undefined,
        });
        successCount.add(success ? 1 : 0);
        errorRate.add(!success);

        if (success) {
            const token = res.json('token');

            group('Dashboard', () => {
                let endpoint = '';
                if (cred.role === 'MENTOR') endpoint = '/mentor/analytics';
                else if (cred.role === 'STAFF') endpoint = '/staff/subjects';
                else if (cred.role === 'STUDENT') endpoint = '/student/status';

                const dashRes = http.get(`${BASE_URL}${endpoint}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                dashboardDuration.add(dashRes.timings.duration);
                const dashOk = check(dashRes, {
                    'dashboard status is 200': (r) => r.status === 200,
                });
                successCount.add(dashOk ? 1 : 0);
                errorRate.add(!dashOk);
            });
        }
    });

    sleep(1);
}
