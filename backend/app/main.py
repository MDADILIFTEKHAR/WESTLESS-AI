import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Ensure project root is in python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

from backend.app.database import engine, Base, SessionLocal
from backend.app.services.seed_data import seed_demo_database
from backend.app.routers import (
    health,
    prediction,
    waste_logs,
    inventory,
    surplus,
    dashboard,
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create SQLite database tables if they do not exist
    Base.metadata.create_all(bind=engine)

    # Automatically seed initial realistic mess operational data if empty
    db = SessionLocal()
    try:
        seed_demo_database(db, force=False)
    finally:
        db.close()
    yield


app = FastAPI(
    title="WasteLess AI Platform API",
    description="Food-Waste Prevention and Recovery Platform for Institutional Kitchens",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration supporting localhost on any dev port and Vite proxy
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all endpoints under /api
app.include_router(health.router, prefix="/api")
app.include_router(prediction.router, prefix="/api")
app.include_router(waste_logs.router, prefix="/api")
app.include_router(inventory.router, prefix="/api")
app.include_router(surplus.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "WasteLess AI API is online",
        "docs_url": "/docs",
        "health_check": "/api/health",
    }
