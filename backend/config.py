import os
import sys
from typing import List

from pydantic import AliasChoices, Field, ValidationError
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """App settings from environment / .env (required on Render)."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # MongoDB — set MONGODB_URI on Render (Atlas connection string)
    mongodb_uri: str = Field(
        ...,
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI", "DATABASE_URL"),
    )
    database_name: str = Field(default="resin_art_db", validation_alias="DATABASE_NAME")

    # JWT — set JWT_SECRET_KEY on Render (any long random string)
    jwt_secret_key: str = Field(
        ...,
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=30,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

    # Server (Render injects PORT)
    port: int = Field(default=8000, validation_alias="PORT")
    environment: str = Field(default="development", validation_alias="ENVIRONMENT")

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


def _load_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:
        missing = []
        for err in exc.errors():
            loc = err.get("loc") or ()
            if loc:
                missing.append(str(loc[0]))

        print("=" * 60, file=sys.stderr)
        print("[FATAL] Missing required environment variables:", file=sys.stderr)
        if "mongodb_uri" in missing or not os.getenv("MONGODB_URI"):
            print("  - MONGODB_URI  (MongoDB Atlas connection string)", file=sys.stderr)
        if "jwt_secret_key" in missing or not os.getenv("JWT_SECRET_KEY"):
            print("  - JWT_SECRET_KEY  (any long random secret)", file=sys.stderr)
        print("", file=sys.stderr)
        print("On Render Dashboard → art-in-glass → Environment, add:", file=sys.stderr)
        print("  MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER/.../resin_art_db", file=sys.stderr)
        print("  JWT_SECRET_KEY=change_me_to_a_long_random_string", file=sys.stderr)
        print("  DATABASE_NAME=resin_art_db", file=sys.stderr)
        print("  ENVIRONMENT=production", file=sys.stderr)
        print("Then Manual Deploy → Deploy latest commit.", file=sys.stderr)
        print("=" * 60, file=sys.stderr)
        raise


settings = _load_settings()
