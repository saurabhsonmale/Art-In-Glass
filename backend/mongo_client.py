"""Shared MongoDB client factory with TLS CA bundle (required on Render/slim images)."""
from typing import Any, Dict

import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo import MongoClient


def mongo_client_kwargs(timeout_ms: int = 15000) -> Dict[str, Any]:
    return {
        "tls": True,
        "tlsCAFile": certifi.where(),
        "serverSelectionTimeoutMS": timeout_ms,
        "connectTimeoutMS": timeout_ms,
        "socketTimeoutMS": timeout_ms,
    }


def create_motor_client(uri: str, timeout_ms: int = 15000) -> AsyncIOMotorClient:
    return AsyncIOMotorClient(uri, **mongo_client_kwargs(timeout_ms))


def create_sync_client(uri: str, timeout_ms: int = 15000) -> MongoClient:
    return MongoClient(uri, **mongo_client_kwargs(timeout_ms))
