# Monitoring

## Metrics Endpoint

`GET /api/metrics` returns Prometheus-format metrics.

### Available Metrics

| Metric | Type | Labels |
|--------|------|--------|
| `sndc_http_request_duration_seconds` | Histogram | method, route, status |
| `sndc_http_requests_total` | Counter | method, route, status |
| `sndc_process_*` | Default | - |

## Health Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/health` | Full health (memory, cache, queues) |
| `GET /api/ready` | Readiness (DB + Redis checks) |
| `GET /api/live` | Liveness (process alive) |

## Prometheus

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'sndc'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: /api/metrics
```

## Grafana

Dashboards are auto-provisioned via `grafana/datasources.yml` and `grafana/dashboard.json`.

### Dashboard Panels

- API Latency (p50/p95/p99)
- Requests per Second
- Error Rate (5xx)
- Memory Usage (RSS)
- Redis Connections
- Queue Depth
- DB Connections
- Cache Hit Ratio
