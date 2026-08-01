from pydantic_settings import BaseSettings
from typing import Optional, List


class Settings(BaseSettings):
    # MongoDB Configuration
    mongodb_uri: str
    database_name: str = "resin_art_db"
    
    # JWT Configuration
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    
    # Server Configuration (Render injects PORT)
    port: int = 8000
    environment: str = "development"

    # Public live URL (used for CORS / docs)
    public_base_url: str = "https://art-in-glass.onrender.com"

    # Comma-separated extra CORS origins (optional)
    cors_origins: str = "*"

    # Mongo connect timeout (ms) — fail fast on Render instead of hanging
    mongodb_server_selection_timeout_ms: int = 15000
    
    class Config:
        env_file = ".env"
        case_sensitive = False

    def get_cors_origins(self) -> List[str]:
        raw = (self.cors_origins or "*").strip()
        if raw == "*":
            return ["*"]
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        live = (self.public_base_url or "").rstrip("/")
        if live and live not in origins:
            origins.append(live)
        return origins or ["*"]


settings = Settings()