from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.app.api.routes import router
from backend.app.config import demo_mode
from backend.app.netguard import install_demo_network_guard
from backend.app.services.engine import Engine

if demo_mode():
    install_demo_network_guard()

engine = Engine()

app = FastAPI(title="BenchBridge", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:3000",
        "http://localhost:3000",
        "http://127.0.0.1:3010",
        "http://localhost:3010",
    ],
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(router, prefix="/api")
