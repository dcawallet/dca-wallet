from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    MONGO_URI: str = "mongodb://localhost:27018/"
    DATABASE_NAME: str = "dcawallet_db"
    JWT_SECRET_KEY: str = "supersecretjwtkey"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

@lru_cache
def get_settings():
    return Settings()

settings = get_settings()
