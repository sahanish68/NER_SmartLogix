# API List

Base URL: `/api`

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service health |
| GET | `/dashboard` | KPI summary |
| GET | `/incidents` | Incident list |
| POST | `/incidents` | Create geo-tagged incident |
| GET | `/vehicles` | Vehicle list |
| POST | `/vehicles/{id}/location` | GPS telemetry |
| GET | `/roads` | Road accessibility |
| GET | `/deliveries` | Delivery board |
| POST | `/deliveries` | Create delivery |
| POST | `/weather` | Ingest weather record |
| POST | `/ai/risk` | Predict disruption risk |
| POST | `/emergency/toggle` | Toggle emergency mode |

## Production API additions
- `POST /auth/login`
- `POST /incidents/{id}/photos`
- `PATCH /roads/{id}/status`
- `POST /routes/optimize`
- `GET /alerts`
- `POST /alerts/{id}/ack`
- `GET /analytics/districts`
- `GET /sync/pull`
- `POST /sync/push`
