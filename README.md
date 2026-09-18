# NER SmartLogix
AI-powered logistics accessibility intelligence platform for the North Eastern Region (NER).

## Hackathon MVP
- React + Vite + Leaflet GIS dashboard
- FastAPI backend
- PostgreSQL + PostGIS-ready schema (geometry stored as lat/lng for easy local setup)
- Incident reporting
- Vehicle tracking
- Delivery management
- Dynamic route-risk scoring
- ML disruption-risk endpoint
- Weather input endpoint
- Emergency mode
- Docker Compose

## Run
1. Copy `.env.example` to `.env`.
2. Run:
   `docker compose up --build`
3. Open:
   - Frontend: http://localhost:5173
   - API docs: http://localhost:8000/docs

The prototype uses seeded NER sample data. Replace sample weather/road data with authorized real feeds for production.

## Demo flow
1. Open dashboard.
2. Create an incident from the Incidents page.
3. Create/select a delivery and vehicle.
4. Open Route Planner and calculate routes.
5. Change rainfall in the AI Risk page and run prediction.
6. Activate Emergency Mode to demonstrate high-priority monitoring.

## Production upgrades
- PostGIS geometry/geospatial indexes
- OAuth2/SSO/RBAC
- Redis + WebSockets for live updates
- Celery/Temporal for ingestion jobs
- signed GPS telemetry
- object storage for photos
- audit logs
- real weather/traffic/road feeds
- trained regional ML model from validated historical data
