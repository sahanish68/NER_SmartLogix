from app.db import Base, engine, SessionLocal
from app.models import User, Vehicle, RoadSegment, Incident, SystemState, WeatherRecord, VehicleLocation


def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if not db.query(User).first():
            db.add_all([
                User(name="NER Admin", email="admin@ner.local", role="admin", password_hash="demo-admin-hash"),
                User(name="Field Officer", email="field@ner.local", role="field_officer", password_hash="demo-field-hash"),
            ])
            db.flush()
        if not db.query(Vehicle).first():
            db.add_all([
                Vehicle(vehicle_number="NER-101", driver_id=1, vehicle_type="Medical Van", status="ON_ROUTE"),
                Vehicle(vehicle_number="NER-102", driver_id=2, vehicle_type="Supply Truck", status="IDLE"),
                Vehicle(vehicle_number="NER-103", driver_id=1, vehicle_type="Agriculture Truck", status="ON_ROUTE"),
            ])
            db.flush()
            db.add_all([
                VehicleLocation(vehicle_id=1, latitude=26.1445, longitude=91.7362, speed=42),
                VehicleLocation(vehicle_id=2, latitude=25.5788, longitude=91.8933, speed=0),
                VehicleLocation(vehicle_id=3, latitude=24.8170, longitude=93.9368, speed=35),
            ])
        if not db.query(RoadSegment).first():
            db.add_all([
                RoadSegment(name="NER Corridor A", geometry="26.1445,91.7362", condition="GOOD", status="OPEN", risk_score=22),
                RoadSegment(name="Mountain Corridor B", geometry="25.5788,91.8933", condition="POOR", status="HIGH_RISK", risk_score=72),
                RoadSegment(name="Imphal Corridor C", geometry="24.8170,93.9368", condition="FAIR", status="OPEN", risk_score=41),
                RoadSegment(name="Flood Corridor D", geometry="27.4728,94.9120", condition="POOR", status="BLOCKED", risk_score=91),
            ])
        if not db.query(Incident).first():
            db.add(Incident(type="LANDSLIDE", severity="HIGH", latitude=25.5788, longitude=91.8933, description="Sample landslide report near mountain corridor.", reported_by=2))
        if not db.query(WeatherRecord).first():
            db.add_all([
                WeatherRecord(location="Kamrup", rainfall=34, temperature=28, wind_speed=18),
                WeatherRecord(location="East Khasi Hills", rainfall=122, temperature=22, wind_speed=22),
                WeatherRecord(location="Dibrugarh", rainfall=176, temperature=26, wind_speed=14),
            ])
        if not db.query(SystemState).first():
            db.add(SystemState(emergency_mode=False))

        db.commit()
    finally:
        db.close()

    print("Seed complete")


if __name__ == "__main__":
    seed_database()
