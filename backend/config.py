import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple
from urllib.parse import urlparse

from dotenv import dotenv_values
from pydantic import AliasChoices, Field, ValidationError, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

_BASE = Path(__file__).resolve().parent
_ON_RENDER = bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))


def _is_localhost_mongo(uri: str) -> bool:
    u = (uri or "").lower()
    return (
        "localhost" in u
        or "127.0.0.1" in u
        or u.startswith("mongodb://0.0.0.0")
    )


def _read_live_env() -> Dict[str, str]:
    path = _BASE / "live.env"
    if not path.exists():
        return {}
    raw = dotenv_values(path)
    return {k: str(v) for k, v in raw.items() if v is not None and str(v).strip()}


def _bootstrap_process_env() -> None:
    """Ensure Atlas credentials exist in os.environ before Settings loads.

    - Prefer committed live.env over empty/missing vars
    - On Render/production: override localhost MongoDB if Dashboard still has it
    """
    live = _read_live_env()
    if not live:
        return

    current_mongo = (os.environ.get("MONGODB_URI") or os.environ.get("MONGO_URI") or "").strip()
    live_mongo = (live.get("MONGODB_URI") or "").strip()

    if live_mongo and (
        not current_mongo
        or (_ON_RENDER and _is_localhost_mongo(current_mongo))
        or (
            (os.environ.get("ENVIRONMENT") or "").lower() in {"production", "prod"}
            and _is_localhost_mongo(current_mongo)
        )
    ):
        os.environ["MONGODB_URI"] = live_mongo

    for key in (
        "JWT_SECRET_KEY",
        "DATABASE_NAME",
        "ENVIRONMENT",
        "PUBLIC_BASE_URL",
        "CORS_ORIGINS",
        "JWT_ALGORITHM",
        "ACCESS_TOKEN_EXPIRE_MINUTES",
    ):
        if key in live and not (os.environ.get(key) or "").strip():
            os.environ[key] = live[key]

    # If JWT is present in live.env and we're overriding localhost mongo, keep JWT aligned
    if live.get("JWT_SECRET_KEY") and _ON_RENDER and not (os.environ.get("JWT_SECRET_KEY") or "").strip():
        os.environ["JWT_SECRET_KEY"] = live["JWT_SECRET_KEY"]


_bootstrap_process_env()


def _env_files() -> Tuple[str, ...]:
    files: List[str] = []
    for name in (".env", "live.env"):
        path = _BASE / name
        if path.exists():
            files.append(str(path))
    return tuple(files)


_ENV_FILES = _env_files()


def _safe_mongo_host(uri: str) -> str:
    if not uri:
        return "(empty)"
    try:
        if "@" in uri:
            return uri.split("@", 1)[1].split("?", 1)[0].rstrip("/")
        parsed = urlparse(uri)
        if parsed.hostname:
            port = f":{parsed.port}" if parsed.port else ""
            return f"{parsed.hostname}{port}{parsed.path or ''}"
        return uri.split("://", 1)[-1].split("?", 1)[0]
    except Exception:
        return "(unparseable)"


class Settings(BaseSettings):
    """Settings from process env, then .env / live.env files."""

    model_config = SettingsConfigDict(
        env_file=_ENV_FILES if _ENV_FILES else None,
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
        env_ignore_empty=True,
    )

    mongodb_uri: str = Field(
        ...,
        validation_alias=AliasChoices("MONGODB_URI", "MONGO_URI", "DATABASE_URL"),
    )
    database_name: str = Field(default="resin_art_db", validation_alias="DATABASE_NAME")

    jwt_secret_key: str = Field(
        ...,
        validation_alias=AliasChoices("JWT_SECRET_KEY", "SECRET_KEY"),
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
        env = (self.environment or "").strip().lower()
        prod_like = _ON_RENDER or env in {"production", "prod", "staging"}
        if prod_like and _is_localhost_mongo(self.mongodb_uri):
            raise ValueError(
                "MONGODB_URI points to localhost, which cannot work on Render. "
                "Use Atlas mongodb+srv:// in live.env or Render Environment."
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
            key = loc.upper().replace(".", "_")
            if "mongodb" in loc.lower() or "MONGODB" in key or "MONGO" in key:
                missing_names.append("MONGODB_URI")
            elif "jwt_secret" in loc.lower() or "JWT_SECRET" in key or "SECRET_KEY" in key:
                missing_names.append("JWT_SECRET_KEY")
            else:
                other_msgs.append(f"{loc}: {msg}")

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
        print("Ensure backend/live.env is deployed.", file=sys.stderr)
        print("=" * 64, file=sys.stderr)
        raise SystemExit(1) from exc


settings = _load_settings()

print(
    f"[OK] Settings loaded environment={settings.environment} "
    f"mongodb_host={settings.mongo_host_for_logs} "
    f"mongodb_uri_loaded=yes "
    f"on_render={_ON_RENDER} env_files={len(_ENV_FILES)}"
)
