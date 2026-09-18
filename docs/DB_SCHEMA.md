# Database Schema

users
- id PK
- name
- email UNIQUE
- role
- password_hash

vehicles
- id PK
- vehicle_number UNIQUE
- driver_id FK -> users.id
- vehicle_type
- status

deliveries
- id PK
- vehicle_id FK -> vehicles.id
- cargo_type
- origin
- destination
- priority
- status
- eta

road_segments
- id PK
- name
- geometry
- condition
- status
- risk_score

incidents
- id PK
- type
- severity
- latitude
- longitude
- description
- photo_url
- reported_by FK -> users.id
- timestamp
- status

weather_data
- id PK
- location
- rainfall
- temperature
- wind_speed
- timestamp

vehicle_locations
- id PK
- vehicle_id FK -> vehicles.id
- latitude
- longitude
- speed
- timestamp

system_state
- id PK
- emergency_mode
