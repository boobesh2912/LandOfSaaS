from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import Base, engine
from app.map_generator import seed_database
from app.routers import territories, webhooks

settings = get_settings()

app = FastAPI(title="LandOfSaaS API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)

app.include_router(territories.router)
app.include_router(webhooks.router)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    seed_database()  # no-op if territories already exist


@app.get("/api/health")
def health():
    return {"status": "ok"}
