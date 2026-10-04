from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.core.config import settings
from app.core.database import engine, Base
from app.core.redis_client import get_redis, close_redis
from app.api.v1 import auth, accounts, transactions, cards, loans, feedback, analytics, websocket
import app.models  # noqa: F401 - ensure models are registered

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure tables created & connect redis
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await get_redis()
    except Exception as e:
        print(f"Warning: Redis connection failed on startup ({e}). Continuing with graceful fallback.")
    yield
    # Shutdown
    try:
        await close_redis()
    except Exception:
        pass
    await engine.dispose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AVBank — Production-Grade FinTech Banking Platform API",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

api_prefix = settings.API_V1_STR
app.include_router(auth.router, prefix=api_prefix)
app.include_router(accounts.router, prefix=api_prefix)
app.include_router(transactions.router, prefix=api_prefix)
app.include_router(cards.router, prefix=api_prefix)
app.include_router(loans.router, prefix=api_prefix)
app.include_router(feedback.router, prefix=api_prefix)
app.include_router(analytics.router, prefix=api_prefix)
app.include_router(websocket.router)

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": settings.VERSION,
        "service": settings.PROJECT_NAME,
        "environment": "production-ready"
    }
