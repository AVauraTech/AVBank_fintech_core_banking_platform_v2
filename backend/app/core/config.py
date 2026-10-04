from pydantic_settings import BaseSettings
from typing import List

class Settings(BaseSettings):
    PROJECT_NAME: str = "AVBank"
    VERSION: str = "2.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production-min-32-chars"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Database
    DATABASE_URL: str = "postgresql+asyncpg://avbank_user:avbank_pass@localhost:5432/avbank"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379"
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:3001"]
    
    # Rate limiting
    RATE_LIMIT_PER_MINUTE: int = 60
    
    # Fraud detection thresholds
    FRAUD_LARGE_TRANSACTION_THRESHOLD: float = 100000.0
    FRAUD_VELOCITY_MAX_TRANSACTIONS: int = 10
    FRAUD_VELOCITY_WINDOW_SECONDS: int = 300

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
