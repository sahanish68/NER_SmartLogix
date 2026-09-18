from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select, func
from .db import get_db
from .models import Incident, Vehicle, VehicleLocation, RoadSegment, WeatherRecord, Delivery, SystemState
from .schemas import IncidentCreate, VehicleLocationCreate, WeatherCreate, DeliveryCreate, RiskInput, IncidentOut, VehicleOut, DeliveryOut
from .ml import predict_risk
from .supabase import push_record

router = APIRouter()

@router.get("/health")
def health():
    return {"status": "ok", "service": "NER SmartLogix"}

@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    incidents = db.scalar(select(func.count(Incident.id)).where(Incident.status == "OPEN")) or 0
    vehicles = db.scalar(select(func.count(Vehicle.id)).where(Vehicle.status == "ON_ROUTE")) or 0
    blocked = db.scalar(select(func.count(RoadSegment.id)).where(RoadSegment.status == "BLOCKED")) or 0
    highrisk = db.scalar(select(func.count(RoadSegment.id)).where(RoadSegment.risk_score >= 65)) or 0
    state = db.scalar(select(SystemState).limit(1))
    return {
        "open_incidents": incidents,
        "vehicles_on_route": vehicles,
        "blocked_roads": blocked,
        "high_risk_corridors": highrisk,
        "emergency_mode": bool(state.emergency_mode) if state else False
    }

@router.get("/incidents", response_model=list[IncidentOut])
def list_incidents(db: Session = Depends(get_db)):
    return list(db.scalars(select(Incident).order_by(Incident.timestamp.desc())))

@router.post("/incidents", response_model=IncidentOut)
def create_incident(payload: IncidentCreate, db: Session = Depends(get_db)):
    obj = Incident(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    push_record("incidents", {
        "type": obj.type,
        "severity": obj.severity,
        "latitude": obj.latitude,
        "longitude": obj.longitude,
        "description": obj.description,
        "photo_url": obj.photo_url,
        "status": obj.status,
        "timestamp": obj.timestamp.isoformat()
    })
    return obj

@router.get("/vehicles", response_model=list[VehicleOut])
def list_vehicles(db: Session = Depends(get_db)):
    vehicles = list(db.scalars(select(Vehicle).order_by(Vehicle.id)))
    return [{
        "id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "driver_id": vehicle.driver_id,
        "vehicle_type": vehicle.vehicle_type,
        "status": vehicle.status,
        "latitude": location.latitude if (location := db.scalar(select(VehicleLocation).where(VehicleLocation.vehicle_id == vehicle.id).order_by(VehicleLocation.timestamp.desc()))) else None,
        "longitude": location.longitude if location else None,
        "speed": location.speed if location else None,
    } for vehicle in vehicles]

@router.post("/vehicles/{vehicle_id}/location")
def update_location(vehicle_id: int, payload: VehicleLocationCreate, db: Session = Depends(get_db)):
    vehicle = db.get(Vehicle, vehicle_id)
    if not vehicle:
        raise HTTPException(404, "Vehicle not found")
    vehicle.status = "ON_ROUTE"
    db.add(VehicleLocation(vehicle_id=vehicle_id, **payload.model_dump()))
    db.commit()
    push_record("vehicle_locations", {
        "vehicle_id": vehicle_id,
        "latitude": payload.latitude,
        "longitude": payload.longitude,
        "speed": payload.speed,
        "timestamp": __import__("datetime").datetime.utcnow().isoformat()
    })
    return {"message": "location updated", "vehicle_id": vehicle_id}

@router.get("/roads")
def list_roads(db: Session = Depends(get_db)):
    roads = list(db.scalars(select(RoadSegment).order_by(RoadSegment.id)))
    return [{
        "id": road.id,
        "name": road.name,
        "geometry": road.geometry,
        "latitude": float(road.geometry.split(",", 1)[0]),
        "longitude": float(road.geometry.split(",", 1)[1]),
        "condition": road.condition,
        "status": road.status,
        "risk_score": road.risk_score,
    } for road in roads]

@router.get("/deliveries", response_model=list[DeliveryOut])
def list_deliveries(db: Session = Depends(get_db)):
    return list(db.scalars(select(Delivery).order_by(Delivery.id.desc())))

@router.post("/deliveries", response_model=DeliveryOut)
def create_delivery(payload: DeliveryCreate, db: Session = Depends(get_db)):
    obj = Delivery(**payload.model_dump())
    obj.eta = 360 if payload.priority != "CRITICAL" else 300
    db.add(obj); db.commit(); db.refresh(obj)
    push_record("deliveries", {
        "vehicle_id": obj.vehicle_id,
        "cargo_type": obj.cargo_type,
        "origin": obj.origin,
        "destination": obj.destination,
        "priority": obj.priority,
        "status": obj.status,
        "eta": obj.eta,
    })
    return obj

@router.post("/weather")
def add_weather(payload: WeatherCreate, db: Session = Depends(get_db)):
    obj = WeatherRecord(**payload.model_dump())
    db.add(obj); db.commit(); db.refresh(obj)
    push_record("weather_data", {
        "location": obj.location,
        "rainfall": obj.rainfall,
        "temperature": obj.temperature,
        "wind_speed": obj.wind_speed,
        "timestamp": obj.timestamp.isoformat()
    })
    return {"id": obj.id, "message": "weather recorded"}

@router.post("/ai/risk")
def ai_risk(payload: RiskInput):
    features = [
        payload.rainfall, payload.previous_rainfall, payload.slope,
        payload.elevation, payload.road_condition, payload.traffic,
        payload.river_level, payload.historical_incidents
    ]
    return predict_risk(features)

@router.post("/emergency/toggle")
def toggle_emergency(db: Session = Depends(get_db)):
    state = db.scalar(select(SystemState).limit(1))
    if not state:
        state = SystemState(emergency_mode=True)
        db.add(state)
    else:
        state.emergency_mode = not state.emergency_mode
    db.commit()
    push_record("system_state", {"emergency_mode": state.emergency_mode})
    return {"emergency_mode": state.emergency_mode}
