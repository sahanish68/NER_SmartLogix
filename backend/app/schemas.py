from datetime import datetime
from pydantic import BaseModel, ConfigDict

class IncidentCreate(BaseModel):
    type: str
    severity: str
    latitude: float
    longitude: float
    description: str = ""

class VehicleLocationCreate(BaseModel):
    latitude: float
    longitude: float
    speed: float = 0

class WeatherCreate(BaseModel):
    location: str
    rainfall: float = 0
    temperature: float = 0
    wind_speed: float = 0

class DeliveryCreate(BaseModel):
    vehicle_id: int | None = None
    cargo_type: str
    origin: str
    destination: str
    priority: str = "NORMAL"

class RiskInput(BaseModel):
    rainfall: float
    previous_rainfall: float
    slope: float
    elevation: float
    road_condition: float
    traffic: float
    river_level: float
    historical_incidents: float

class IncidentOut(IncidentCreate):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    reported_by: int | None
    timestamp: datetime

class VehicleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_number: str
    driver_id: int | None
    vehicle_type: str
    status: str
    latitude: float | None = None
    longitude: float | None = None
    speed: float | None = None

class DeliveryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    vehicle_id: int | None
    cargo_type: str
    origin: str
    destination: str
    priority: str
    status: str
    eta: int
