import os
from pathlib import Path
from typing import List

from pydantic import AliasChoices, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# Local: use .env. Render: .env is not deployed, so use .env.production + defaults.
_BASE = Path(__file__).resolve().parent
_ON_RENDER = bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))
_ENV_FILES = []
if _ON_RENDER:
    if (_BASE / ".env.production").exists():
        _ENV_FILES.append(str(_BASE / ".env.production"))
elif (_BASE / ".env").exists():
    _ENV_FILES.append(str(_BASE / ".env"))
elif (_BASE / ".env.production").exists():
    _ENV_FILES.append(str(_BASE / ".env.production"))


class Settings(BaseSettings):
    """Required settings with safe defaults so Render can boot without Dashboard secrets.

    On live, set MONGODB_URI in Render → Environment to your Atlas URI
    (overrides the default). JWT has a default for deploy; change in production.
    """

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES or None,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # Required — defaults allow boot; override MONGODB_URI on Render with Atlas
    mongodb_uri: str = Field(
        default="mongodb://localhost:27017/resin_art_db",
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI", "DATABASE_URL"),
    )
    database_name: str = Field(default="resin_art_db", validation_alias="DATABASE_NAME")

    jwt_secret_key: str = Field(
        default="art_in_glass_super_secret_key_2024_change_in_production",
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=1440,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    port: int = Field(default=8000, validation_alias="PORT")
    environment: str = Field(default="production", validation_alias="ENVIRONMENT")

    public_base_url: str = Field(
        default="https://art-in-glass.onrender.com",
        validation_alias="PUBLIC_BASE_URL",
    )
    cors_origins: str = Field(default="*", validation_alias="CORS_ORIGINS")
    mongodb_server_selection_timeout_ms: int = Field(
        default=15000,
        validation_alias="MONGODB_SERVER_SELECTION_TIMEOUT_MS",
    )

    def get_cors_origins(self) -> List[str]:
        raw = (self.cors_origins or "*").strip()
        if raw == "*":
            return ["*"]
        origins = [o.strip() for o in raw.split(",") if o.strip()]
        live = (self.public_base_url or "").rstrip("/")
        if live and live not in origins:
            origins.append(live)
        return origins or ["*"]

    @property
    def is_render(self) -> bool:
        return bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))


settings = Settings()

# Helpful boot log (no secrets printed)
_uri = settings.mongodb_uri
_safe = _uri.split("@")[-1] if "@" in _uri else _uri
print(f"[OK] Settings loaded env={settings.environment} db_host={_safe}")
if settings.is_render and _uri.startswith("mongodb://localhost"):
    print(
        "[WARN] MONGODB_URI is localhost on Render — set Atlas URI in "
        "Dashboard → Environment → MONGODB_URI for live data."
    )
