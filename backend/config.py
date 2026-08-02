import os
import sys
from pathlib import Path
from typing import List, Optional
from urllib.parse import urlparse

from pydantic import AliasChoices, Field, ValidationError, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE = Path(__file__).resolve().parent
_ON_RENDER = bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))

# Local only: optional .env. Production/Render uses real process env (Dashboard).
# Never require .env to exist. Never load a committed file with localhost secrets.
_ENV_FILE: Optional[str] = None
if not _ON_RENDER and (_BASE / ".env").exists():
    _ENV_FILE = str(_BASE / ".env")


def _safe_mongo_host(uri: str) -> str:
    """Log-safe host (no username/password)."""
    if not uri:
        return "(empty)"
    try:
        # mongodb+srv://user:pass@host/... or mongodb://host:27017/...
        if "@" in uri:
            return uri.split("@", 1)[1].split("?", 1)[0].rstrip("/")
        parsed = urlparse(uri)
        if parsed.hostname:
            port = f":{parsed.port}" if parsed.port else ""
            return f"{parsed.hostname}{port}{parsed.path or ''}"
        return uri.split("://", 1)[-1].split("?", 1)[0]
    except Exception:
        return "(unparseable)"


def _is_localhost_mongo(uri: str) -> bool:
    u = (uri or "").lower()
    return (
        "localhost" in u
        or "127.0.0.1" in u
        or u.startswith("mongodb://0.0.0.0")
    )


class Settings(BaseSettings):
    """Settings from environment (Render) and optional local .env file."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILE,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        # Environment variables always win over env_file
        env_ignore_empty=True,
    )

    mongodb_uri: str = Field(
        ...,
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI", "DATABASE_URL"),
        description="MongoDB connection string (Atlas in production)",
    )
    database_name: str = Field(default="resin_art_db", validation_alias="DATABASE_NAME")

    jwt_secret_key: str = Field(
        ...,
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
        description="JWT signing secret",
    )
    jwt_algorithm: str = Field(default="HS256", validation_alias="JWT_ALGORITHM")
    access_token_expire_minutes: int = Field(
        default=1440,
        validation_alias="ACCESS_TOKEN_EXPIRE_MINUTES",
    )

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

    @field_validator("mongodb_uri", "jwt_secret_key")
    @classmethod
    def _non_empty(cls, v: str) -> str:
        if v is None or not str(v).strip():
            raise ValueError("must not be empty")
        return str(v).strip()

    @model_validator(mode="after")
    def _reject_localhost_in_production(self):
        """Never allow localhost MongoDB on Render / production."""
        env = (self.environment or "").strip().lower()
        prod_like = _ON_RENDER or env in {"production", "prod", "staging"}
        if prod_like and _is_localhost_mongo(self.mongodb_uri):
            raise ValueError(
                "MONGODB_URI points to localhost, which cannot work on Render. "
                "Set MONGODB_URI in Render Dashboard → Environment to your "
                "MongoDB Atlas URI (mongodb+srv://...)."
            )
        return self

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
        return _ON_RENDER

    @property
    def mongo_host_for_logs(self) -> str:
        return _safe_mongo_host(self.mongodb_uri)


def _load_settings() -> Settings:
    try:
        return Settings()
    except ValidationError as exc:
        missing_names = []
        other_msgs = []
        for err in exc.errors():
            loc = ".".join(str(x) for x in (err.get("loc") or ()))
            msg = err.get("msg") or ""
            # Map internal field names / aliases to env var names
            key = loc.upper().replace(".", "_")
            if "mongodb" in loc.lower() or "MONGODB" in key or "MONGO" in key:
                missing_names.append("MONGODB_URI")
            elif "jwt_secret" in loc.lower() or "JWT_SECRET" in key or "SECRET_KEY" in key:
                missing_names.append("JWT_SECRET_KEY")
            else:
                other_msgs.append(f"{loc}: {msg}")

        # Deduplicate while preserving order
        seen = set()
        ordered = []
        for n in missing_names:
            if n not in seen:
                seen.add(n)
                ordered.append(n)

        print("=" * 64, file=sys.stderr)
        print("[FATAL] Invalid or missing environment variables.", file=sys.stderr)
        if ordered:
            print("[FATAL] Required variable(s) missing or invalid:", file=sys.stderr)
            for name in ordered:
                print(f"  - {name}", file=sys.stderr)
        for m in other_msgs:
            print(f"  - {m}", file=sys.stderr)
        print("", file=sys.stderr)
        print("Set these in Render Dashboard → Environment (or local .env):", file=sys.stderr)
        print(
            "  MONGODB_URI=mongodb+srv://USER:PASS@CLUSTER/resin_art_db"
            "?retryWrites=true&w=majority",
            file=sys.stderr,
        )
        print("  JWT_SECRET_KEY=<long-random-secret>", file=sys.stderr)
        print("  DATABASE_NAME=resin_art_db", file=sys.stderr)
        print("  ENVIRONMENT=production", file=sys.stderr)
        print(
            "Atlas → Network Access: allow 0.0.0.0/0 so Render can connect.",
            file=sys.stderr,
        )
        print("=" * 64, file=sys.stderr)
        raise SystemExit(1) from exc


settings = _load_settings()

print(
    f"[OK] Settings loaded environment={settings.environment} "
    f"mongodb_host={settings.mongo_host_for_logs} "
    f"mongodb_uri_loaded=yes"
)
