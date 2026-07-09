# Grafana Dashboard Guide for NestJS Prometheus App

## Prerequisites

- Grafana running at `http://localhost:3000`
- Prometheus running at `http://localhost:9090`
- NestJS app running at `http://localhost:4000`

---

## Step 1: Add Prometheus Data Source

1. Open Grafana at `http://localhost:3000`
2. Go to **Connections > Data Sources**
3. Click **Add data source**
4. Select **Prometheus**
5. Set URL to `http://prometheus:9090` (use Docker service name)
6. Click **Save & Test**

---

## Step 2: Create Dashboard

1. Click **+ > New Dashboard**
2. Click **Add visualization**

---

## Step 3: Available Metrics

| Metric | Type | Labels | Description |
|--------|------|--------|-------------|
| `http_requests_total` | Counter | `method`, `origin` | Total HTTP requests |
| `http_requests_in_progress` | Gauge | — | In-progress requests |
| `http_request_duration_seconds` | Histogram | `method`, `origin`, `status` | Request duration |
| `http_errors_total` | Counter | `method`, `origin`, `status` | Total error responses |

---

## Step 4: Recommended Panels

### Panel 1: Request Rate (QPS)

```
Title: Request Rate
Type: Time series
Query: rate(http_requests_total[5m])
Legend: {{method}} {{origin}}
```

### Panel 2: Requests In Progress

```
Title: Requests In Progress
Type: Gauge
Query: http_requests_in_progress
```

### Panel 3: Request Latency (P95)

```
Title: P95 Request Latency
Type: Time series
Query: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))
Legend: {{method}} {{origin}}
Unit: seconds
```

### Panel 4: Request Latency (P50 / Median)

```
Title: P50 Request Latency
Type: Time series
Query: histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))
Legend: {{method}} {{origin}}
Unit: seconds
```

### Panel 5: Error Rate

```
Title: Error Rate
Type: Time series
Query: rate(http_errors_total[5m])
Legend: {{method}} {{origin}} - {{status}}
```

### Panel 6: Error Ratio

```
Title: Error Ratio (%)
Type: Stat
Query: |
  sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100
Unit: percent
```

### Panel 7: Status Code Distribution

```
Title: Status Code Distribution
Type: Pie chart
Query: sum by (status) (increase(http_requests_total[5m]))
Legend: {{status}}
```

### Panel 8: Request Duration Heatmap

```
Title: Request Duration Heatmap
Type: Heatmap
Query: sum(increase(http_request_duration_seconds_bucket[5m])) by (le)
Format: heatmap
```

---

## Step 5: Dashboard JSON (Copy-Paste)

1. Click **Save dashboard**
2. Click **JSON Model** in the settings
3. Paste the following:

```json
{
  "title": "NestJS App Dashboard",
  "tags": ["nestjs", "prometheus"],
  "panels": [
    {
      "title": "Request Rate (QPS)",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 0 },
      "targets": [
        {
          "expr": "rate(http_requests_total[5m])",
          "legendFormat": "{{method}} {{origin}}"
        }
      ]
    },
    {
      "title": "Requests In Progress",
      "type": "stat",
      "gridPos": { "h": 8, "w": 6, "x": 12, "y": 0 },
      "targets": [
        {
          "expr": "http_requests_in_progress"
        }
      ]
    },
    {
      "title": "Error Ratio (%)",
      "type": "stat",
      "gridPos": { "h": 8, "w": 6, "x": 18, "y": 0 },
      "targets": [
        {
          "expr": "sum(rate(http_errors_total[5m])) / sum(rate(http_requests_total[5m])) * 100"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "percent"
        }
      }
    },
    {
      "title": "P95 Request Latency",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{method}} {{origin}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    },
    {
      "title": "P50 Request Latency",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 8 },
      "targets": [
        {
          "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))",
          "legendFormat": "{{method}} {{origin}}"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s"
        }
      }
    },
    {
      "title": "Error Rate",
      "type": "timeseries",
      "gridPos": { "h": 8, "w": 12, "x": 0, "y": 16 },
      "targets": [
        {
          "expr": "rate(http_errors_total[5m])",
          "legendFormat": "{{method}} {{origin}} - {{status}}"
        }
      ]
    },
    {
      "title": "Status Code Distribution",
      "type": "piechart",
      "gridPos": { "h": 8, "w": 12, "x": 12, "y": 16 },
      "targets": [
        {
          "expr": "sum by (status) (increase(http_requests_total[5m]))",
          "legendFormat": "{{status}}"
        }
      ]
    }
  ],
  "time": {
    "from": "now-1h",
    "to": "now"
  },
  "refresh": "10s"
}
```

---

## Quick Test

After creating the dashboard, generate some traffic:

```bash
# Create todos
curl -X POST http://localhost:4000/todos -H "Content-Type: application/json" -d '{"title":"Test 1"}'
curl -X POST http://localhost:4000/todos -H "Content-Type: application/json" -d '{"title":"Test 2"}'

# Get all todos
curl http://localhost:4000/todos

# Trigger an error (404)
curl http://localhost:4000/todos/999
```

Open Grafana at `http://localhost:3000` and verify the panels show data.
