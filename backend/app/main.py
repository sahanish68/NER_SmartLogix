from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from seed import seed_database
from .db import Base, engine
from .routes import router
from .supabase import is_configured

app = FastAPI(title="NER SmartLogix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_database()

if is_configured():
    print("Supabase sync enabled: online persistence is active.")
else:
    print("Supabase not configured: app is running in local SQLite mode. Set SUPABASE_URL and SUPABASE_ANON_KEY to enable online sync.")

app.include_router(router, prefix="/api")
