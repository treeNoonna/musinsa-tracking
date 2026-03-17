from __future__ import annotations

import datetime as dt
import os
import sys
from pathlib import Path
from typing import Any

from fastapi import Body, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, HttpUrl

ROOT_DIR = Path(__file__).resolve().parents[2]
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

from musinsa_tracker import MusinsaTracker  # noqa: E402

DEFAULT_DB_PATH = ROOT_DIR / "data" / "prices.db"
DB_PATH = Path(os.getenv("TRACKER_DB_PATH", str(DEFAULT_DB_PATH)))


def _allowed_origins() -> list[str]:
    raw = os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
    return [item.strip() for item in raw.split(",") if item.strip()]


def _allowed_origin_regex() -> str:
    return os.getenv(
        "CORS_ALLOWED_ORIGIN_REGEX",
        r"https://([a-z0-9-]+\.)*vercel\.app",
    )


app = FastAPI(title="Musinsa Price Tracker API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins(),
    allow_origin_regex=_allowed_origin_regex(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class AddProductRequest(BaseModel):
    url: HttpUrl


class UpdateRequest(BaseModel):
    id: int | None = None


class ScrapePriceRequest(BaseModel):
    url: HttpUrl


def _tracker() -> MusinsaTracker:
    return MusinsaTracker(DB_PATH)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/products")
def list_products() -> dict[str, list[dict[str, Any]]]:
    tracker = _tracker()
    try:
        return {"products": tracker.list_products()}
    finally:
        tracker.conn.close()


@app.post("/api/products")
def add_product(payload: AddProductRequest) -> dict[str, Any]:
    tracker = _tracker()
    try:
        return tracker.add_product(str(payload.url))
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()


@app.post("/api/products/update")
def update_all(payload: UpdateRequest = Body(default=UpdateRequest())) -> dict[str, Any]:
    tracker = _tracker()
    try:
        updates = tracker.update_prices(payload.id)
        return {"updates": updates}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()


@app.post("/api/products/{product_id}/update")
def update_one(product_id: int) -> dict[str, Any]:
    tracker = _tracker()
    try:
        updates = tracker.update_prices(product_id)
        return {"updates": updates}
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()


@app.delete("/api/products/{product_id}")
def delete_one(product_id: int) -> dict[str, Any]:
    tracker = _tracker()
    try:
        return tracker.delete_product(product_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()


@app.get("/api/products/{product_id}/history")
def history(product_id: int, limit: int = Query(default=30, ge=1, le=365)) -> dict[str, Any]:
    tracker = _tracker()
    try:
        return tracker.get_history(product_id, limit)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()


@app.post("/scrape/price")
def scrape_price(
    payload: ScrapePriceRequest | None = Body(default=None),
    url: HttpUrl | None = Query(default=None),
) -> dict[str, Any]:
    target_url = str(payload.url) if payload is not None else (str(url) if url is not None else None)
    if target_url is None:
        raise HTTPException(status_code=422, detail="url is required")

    tracker = _tracker()
    try:
        result = tracker.fetch_price(target_url)
        return {
            "price": result.price,
            "source": result.source,
            "title": result.title,
            "image_url": result.image_url,
            "checked_at": dt.datetime.now(tz=dt.timezone.utc).isoformat(),
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    finally:
        tracker.conn.close()
