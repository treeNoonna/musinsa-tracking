#!/usr/bin/env python3
"""
Musinsa product price tracker powered by Playwright.

Commands:
  - add: register a product URL
  - list: list registered products
  - update: fetch current prices and append history
  - history: show price history for one product
  - report: show simple trend summary
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import re
import sqlite3
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable
from zoneinfo import ZoneInfo

from playwright.sync_api import TimeoutError as PlaywrightTimeoutError
from playwright.sync_api import sync_playwright

DEFAULT_DB_PATH = Path("data/prices.db")
KST = ZoneInfo("Asia/Seoul")


def now_iso() -> str:
    return dt.datetime.now(tz=dt.timezone.utc).isoformat()


def today_kst() -> str:
    return dt.datetime.now(tz=KST).date().isoformat()


def parse_krw(text: str) -> list[int]:
    results: list[int] = []
    for m in re.findall(r"(\d[\d,]{2,})\s*원", text):
        val = int(m.replace(",", ""))
        if 1000 <= val <= 100_000_000:
            results.append(val)
    return results


@dataclass
class ScrapeResult:
    price: int
    source: str
    title: str | None = None
    image_url: str | None = None


class MusinsaTracker:
    def __init__(self, db_path: Path):
        self.db_path = db_path
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self._init_db()

    def _init_db(self) -> None:
        cur = self.conn.cursor()
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS products (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                url TEXT NOT NULL UNIQUE,
                name TEXT,
                created_at TEXT NOT NULL,
                active INTEGER NOT NULL DEFAULT 1,
                last_price INTEGER,
                last_checked_at TEXT
            )
            """
        )
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS price_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                product_id INTEGER NOT NULL,
                price INTEGER NOT NULL,
                checked_at TEXT NOT NULL,
                checked_day TEXT,
                source TEXT NOT NULL,
                FOREIGN KEY(product_id) REFERENCES products(id)
            )
            """
        )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_price_history_product_time
            ON price_history(product_id, checked_at)
            """
        )
        columns = {
            row["name"] for row in self.conn.execute("PRAGMA table_info(products)").fetchall()
        }
        if "image_url" not in columns:
            cur.execute("ALTER TABLE products ADD COLUMN image_url TEXT")
        history_columns = {
            row["name"] for row in self.conn.execute("PRAGMA table_info(price_history)").fetchall()
        }
        if "checked_day" not in history_columns:
            cur.execute("ALTER TABLE price_history ADD COLUMN checked_day TEXT")
            rows = self.conn.execute("SELECT id, checked_at FROM price_history").fetchall()
            for row in rows:
                checked_day = (
                    dt.datetime.fromisoformat(row["checked_at"]).astimezone(KST).date().isoformat()
                )
                cur.execute(
                    "UPDATE price_history SET checked_day = ? WHERE id = ?",
                    (checked_day, row["id"]),
                )
        cur.execute(
            """
            CREATE INDEX IF NOT EXISTS idx_price_history_product_day
            ON price_history(product_id, checked_day)
            """
        )
        rows = self.conn.execute(
            """
            SELECT id, product_id, checked_day
            FROM price_history
            WHERE checked_day IS NOT NULL
            ORDER BY product_id, checked_day, checked_at DESC, id DESC
            """
        ).fetchall()
        seen_days: set[tuple[int, str]] = set()
        duplicate_ids: list[int] = []
        for row in rows:
            key = (row["product_id"], row["checked_day"])
            if key in seen_days:
                duplicate_ids.append(row["id"])
                continue
            seen_days.add(key)
        if duplicate_ids:
            cur.executemany("DELETE FROM price_history WHERE id = ?", [(pid,) for pid in duplicate_ids])
        self.conn.commit()

    @staticmethod
    def _row_to_product(row: sqlite3.Row) -> dict:
        keys = set(row.keys())
        return {
            "id": row["id"],
            "name": row["name"],
            "url": row["url"],
            "active": bool(row["active"]),
            "created_at": row["created_at"],
            "last_price": row["last_price"],
            "last_checked_at": row["last_checked_at"],
            "image_url": row["image_url"] if "image_url" in keys else None,
        }

    def add_product(self, url: str, name: str | None = None) -> dict:
        cur = self.conn.cursor()
        clean_url = url.strip()
        cur.execute(
            "INSERT OR IGNORE INTO products(url, name, created_at, active) VALUES(?, ?, ?, 1)",
            (clean_url, name, now_iso()),
        )
        self.conn.commit()

        row = self.conn.execute("SELECT * FROM products WHERE url = ?", (clean_url,)).fetchone()
        if row is None:
            raise RuntimeError("상품 저장 실패")

        created = cur.rowcount != 0

        return {
            "created": created,
            "product": self._row_to_product(row),
            "message": (
                "상품 등록 완료. 초기 가격은 백그라운드에서 확인 중입니다."
                if created
                else "이미 등록된 상품 URL입니다."
            ),
        }

    def refresh_product(self, product_id: int) -> dict:
        row = self.conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if row is None:
            raise ValueError(f"product id={product_id} 가 없습니다.")

        result = self.fetch_price(row["url"])
        new_name, checked_at = self._record_price(product_id, row["name"], result)
        return {
            "product_id": product_id,
            "name": new_name,
            "url": row["url"],
            "ok": True,
            "price": result.price,
            "source": result.source,
            "image_url": result.image_url,
            "checked_at": checked_at,
        }

    def delete_product(self, product_id: int) -> dict:
        row = self.conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if row is None:
            raise ValueError(f"product id={product_id} 가 없습니다.")

        self.conn.execute("DELETE FROM price_history WHERE product_id = ?", (product_id,))
        self.conn.execute("DELETE FROM products WHERE id = ?", (product_id,))
        self.conn.commit()
        return {"deleted": True, "product_id": product_id, "name": row["name"], "url": row["url"]}

    def list_products(self) -> list[dict]:
        rows = self.conn.execute(
            """
            SELECT id, name, url, active, created_at, last_price, last_checked_at, image_url
            FROM products
            ORDER BY id
            """
        ).fetchall()
        return [self._row_to_product(r) for r in rows]

    @staticmethod
    def _normalize_text(text: str | None) -> str:
        if not text:
            return ""
        return " ".join(text.split())

    @staticmethod
    def _clean_product_title(text: str | None) -> str | None:
        normalized = MusinsaTracker._normalize_text(text) or None
        if normalized is None:
            return None
        normalized = re.sub(r"\s*[-|]\s*사이즈\s*&\s*후기\s*\|\s*무신사\s*$", "", normalized)
        normalized = re.sub(r"\s*-\s*사이즈\s*&\s*후기\s*$", "", normalized)
        normalized = re.sub(r"\s*\|\s*무신사\s*$", "", normalized)
        return normalized.strip()

    def _extract_labeled_prices(self, body_text: str) -> list[int]:
        labeled_values: list[int] = []
        label_pattern = re.compile(r"(최대\s*혜택가|최종\s*혜택가|혜택가)", flags=re.IGNORECASE)

        for match in label_pattern.finditer(body_text):
            start, end = match.span()
            before = body_text[max(0, start - 40) : start]
            after = body_text[end : min(len(body_text), end + 40)]

            before_match = re.search(r"([0-9][0-9,]{2,})\s*원(?:\s*[^\d원]{0,12})?$", before)
            after_match = re.search(r"^(?:\s*[^\d원]{0,12})?([0-9][0-9,]{2,})\s*원", after)
            raw_value = before_match.group(1) if before_match else after_match.group(1) if after_match else None
            if raw_value is None:
                continue

            val = int(raw_value.replace(",", ""))
            if 1000 <= val <= 100_000_000:
                labeled_values.append(val)

        if labeled_values:
            return labeled_values

        for raw_value in re.findall(
            r"([0-9][0-9,]{2,})\s*원\s*최대\s*혜택가",
            body_text,
            flags=re.IGNORECASE,
        ):
            val = int(raw_value.replace(",", ""))
            if 1000 <= val <= 100_000_000:
                labeled_values.append(val)
        return labeled_values

    def _record_price(
        self,
        product_id: int,
        existing_name: str | None,
        result: ScrapeResult,
    ) -> tuple[str | None, str]:
        checked_at = now_iso()
        checked_day = today_kst()
        new_name = result.title or self._clean_product_title(existing_name)

        history_row = self.conn.execute(
            """
            SELECT id
            FROM price_history
            WHERE product_id = ? AND checked_day = ?
            ORDER BY checked_at DESC
            LIMIT 1
            """,
            (product_id, checked_day),
        ).fetchone()

        if history_row is None:
            self.conn.execute(
                """
                INSERT INTO price_history(product_id, price, checked_at, checked_day, source)
                VALUES(?, ?, ?, ?, ?)
                """,
                (product_id, result.price, checked_at, checked_day, result.source),
            )
        else:
            self.conn.execute(
                """
                UPDATE price_history
                SET price = ?, checked_at = ?, checked_day = ?, source = ?
                WHERE id = ?
                """,
                (result.price, checked_at, checked_day, result.source, history_row["id"]),
            )

        self.conn.execute(
            """
            UPDATE products
            SET name = COALESCE(?, name),
                image_url = COALESCE(?, image_url),
                last_price = ?,
                last_checked_at = ?
            WHERE id = ?
            """,
            (new_name, result.image_url, result.price, checked_at, product_id),
        )
        self.conn.commit()
        return new_name, checked_at

    def _get_page_snapshot(self, url: str) -> tuple[str | None, str | None, str, list[str]]:
        with sync_playwright() as playwright:
            launch_attempts = [
                {
                    "headless": True,
                    "args": [
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--disable-setuid-sandbox",
                        "--no-sandbox",
                    ],
                    "timeout": 30_000,
                },
                {
                    "headless": True,
                    "args": [
                        "--disable-dev-shm-usage",
                        "--disable-gpu",
                        "--no-sandbox",
                        "--no-zygote",
                    ],
                    "timeout": 30_000,
                },
            ]
            last_error: Exception | None = None

            for launch_options in launch_attempts:
                browser = None
                context = None
                try:
                    browser = playwright.chromium.launch(**launch_options)
                    context = browser.new_context(
                        locale="ko-KR",
                        user_agent=(
                            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                            "AppleWebKit/537.36 (KHTML, like Gecko) "
                            "Chrome/135.0.0.0 Safari/537.36"
                        ),
                        viewport={"width": 1440, "height": 1200},
                        ignore_https_errors=True,
                    )
                    page = context.new_page()
                    page.goto(url, wait_until="domcontentloaded", timeout=45_000)
                    try:
                        page.wait_for_load_state("networkidle", timeout=8_000)
                    except PlaywrightTimeoutError:
                        pass
                    page.wait_for_timeout(1_500)
                    snapshot = page.evaluate(
                        """
                        () => {
                          const clean = (value) => (value || "").replace(/\\s+/g, " ").trim();
                          const title = clean(
                            document.querySelector("h1")?.textContent ||
                            document.querySelector('meta[property="og:title"]')?.getAttribute("content") ||
                            document.title
                          ) || null;
                          const imageUrl =
                            document.querySelector('meta[property="og:image"]')?.getAttribute("content") ||
                            document.querySelector('meta[name="twitter:image"]')?.getAttribute("content") ||
                            document.querySelector("img[src]")?.getAttribute("src") ||
                            null;
                          const bodyText = clean(document.body?.innerText || "");
                          const matcher = /(최대\\s*혜택가|최종\\s*혜택가|혜택가)/i;
                          const contexts = [];
                          const seen = new Set();
                          for (const el of Array.from(document.querySelectorAll("body *"))) {
                            const text = clean(el.innerText);
                            if (!text || text.length > 220 || !matcher.test(text)) {
                              continue;
                            }
                            const contextText = clean(
                              el.closest("section, article, div, li")?.innerText ||
                              el.parentElement?.innerText ||
                              text
                            );
                            if (!contextText || contextText.length > 500 || seen.has(contextText)) {
                              continue;
                            }
                            seen.add(contextText);
                            contexts.push(contextText);
                          }
                          return { title, imageUrl, bodyText, contexts };
                        }
                        """
                    )
                    return snapshot["title"], snapshot["imageUrl"], snapshot["bodyText"], snapshot["contexts"]
                except Exception as exc:
                    last_error = exc
                finally:
                    if context is not None:
                        try:
                            context.close()
                        except Exception:
                            pass
                    if browser is not None:
                        try:
                            browser.close()
                        except Exception:
                            pass

            raise RuntimeError(f"브라우저 실행 실패: {last_error}")

    def _price_candidates(self, body_text: str, labeled_contexts: list[str]) -> tuple[list[int], list[int], list[int]]:
        labeled_values: list[int] = []
        for context in labeled_contexts:
            labeled_values.extend(self._extract_labeled_prices(context))

        if not labeled_values:
            labeled_values.extend(self._extract_labeled_prices(body_text))

        selector_values: list[int] = []
        for context in labeled_contexts:
            selector_values.extend(parse_krw(context))

        keyword_values: list[int] = []
        for pat in (
            r"(?:판매가|할인가|현재가|가격)\s*[:\-]?\s*([0-9][0-9,]{2,})\s*원",
            r"(?:sale|price)\s*[:\-]?\s*([0-9][0-9,]{2,})\s*원",
        ):
            for m in re.findall(pat, body_text, flags=re.IGNORECASE):
                val = int(m.replace(",", ""))
                if 1000 <= val <= 100_000_000:
                    keyword_values.append(val)

        fallback_values = parse_krw(body_text)
        return labeled_values, keyword_values or selector_values, fallback_values

    def fetch_price(self, url: str) -> ScrapeResult:
        title, image_url, body_text, labeled_contexts = self._get_page_snapshot(url)
        title = self._clean_product_title(title)
        image_url = self._normalize_text(image_url) or None
        labeled_values, keyword_values, all_values = self._price_candidates(body_text, labeled_contexts)

        for label, bucket in (
            ("max-benefit", labeled_values),
            ("keyword", keyword_values),
            ("fallback", all_values),
        ):
            filtered = [v for v in bucket if 5000 <= v <= 10_000_000]
            if filtered:
                return ScrapeResult(
                    price=filtered[0],
                    source=f"playwright:{label}",
                    title=title,
                    image_url=image_url,
                )

        raise RuntimeError("가격 후보를 찾지 못했습니다. 선택자 보정이 필요합니다.")

    def _iter_products(self, product_id: int | None) -> Iterable[sqlite3.Row]:
        if product_id is not None:
            row = self.conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
            if row is None:
                raise ValueError(f"product id={product_id} 가 없습니다.")
            return [row]
        return self.conn.execute("SELECT * FROM products WHERE active = 1 ORDER BY id").fetchall()

    def update_prices(self, product_id: int | None = None) -> list[dict]:
        rows = self._iter_products(product_id)
        results: list[dict] = []

        for r in rows:
            pid = r["id"]
            url = r["url"]
            try:
                update = self.refresh_product(pid)
            except Exception as exc:
                results.append(
                    {
                        "product_id": pid,
                        "name": r["name"],
                        "url": url,
                        "ok": False,
                        "error": str(exc),
                    }
                )
                continue

            results.append(update)

        return results

    def get_history(self, product_id: int, limit: int = 20) -> dict:
        product = self.conn.execute("SELECT * FROM products WHERE id = ?", (product_id,)).fetchone()
        if product is None:
            raise ValueError(f"product id={product_id} 가 없습니다.")

        rows = self.conn.execute(
            """
            SELECT checked_at, price, source
            FROM price_history
            WHERE product_id = ?
            ORDER BY checked_at DESC
            LIMIT ?
            """,
            (product_id, limit),
        ).fetchall()

        return {
            "product": self._row_to_product(product),
            "history": [
                {"checked_at": r["checked_at"], "price": r["price"], "source": r["source"]}
                for r in rows
            ],
        }


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Musinsa price tracker (Scrapling)")
    parser.add_argument("--db", type=Path, default=DEFAULT_DB_PATH, help="SQLite DB path")
    parser.add_argument("--json", action="store_true", help="JSON output")

    sub = parser.add_subparsers(dest="command", required=True)

    p_add = sub.add_parser("add", help="상품 URL 등록")
    p_add.add_argument("url", help="musinsa product URL")
    p_add.add_argument("--name", help="optional product name")

    sub.add_parser("list", help="등록된 상품 목록")

    p_update = sub.add_parser("update", help="가격 업데이트")
    p_update.add_argument("--id", type=int, help="특정 상품 ID만 업데이트")

    p_hist = sub.add_parser("history", help="가격 히스토리")
    p_hist.add_argument("id", type=int, help="product ID")
    p_hist.add_argument("--limit", type=int, default=20, help="표시 개수")

    p_report = sub.add_parser("report", help="가격 추이 요약")
    p_report.add_argument("id", type=int, help="product ID")
    p_report.add_argument("--days", type=int, default=30, help="조회 기간(일)")

    return parser


def print_human(command: str, payload: dict | list) -> None:
    if command == "add":
        print(payload["message"])
        return

    if command == "list":
        products = payload
        if not products:
            print("등록된 상품이 없습니다.")
            return

        for r in products:
            state = "active" if r["active"] else "inactive"
            last = f"{r['last_price']:,}원" if r["last_price"] is not None else "-"
            print(
                f"[{r['id']}] {r['name'] or '(이름없음)'} | {state} | "
                f"last={last} | checked={r['last_checked_at'] or '-'}"
            )
            print(f"    {r['url']}")
        return

    if command == "update":
        updated = 0
        for item in payload:
            if item["ok"]:
                updated += 1
                print(
                    f"[{item['product_id']}] {item['name'] or '(이름없음)'} -> "
                    f"{item['price']:,}원 ({item['source']})"
                )
            else:
                print(f"[{item['product_id']}] 실패: {item['error']}")
        if updated == 0:
            print("업데이트된 상품이 없습니다.")
        return

    if command == "history":
        product = payload["product"]
        history = payload["history"]
        print(f"[{product['id']}] {product['name'] or '(이름없음)'}")
        if not history:
            print("가격 이력이 없습니다.")
            return
        for h in history:
            print(f"{h['checked_at']} | {h['price']:,}원 | {h['source']}")
        return

    if command == "report":
        report = payload
        product = report["product"]
        if not report["enough_data"]:
            print(f"최근 {report['days']}일 데이터가 충분하지 않습니다. (최소 2개 필요)")
            return

        diff = report["change"]
        sign = "+" if diff >= 0 else ""
        print(f"[{product['id']}] {product['name'] or '(이름없음)'} | 최근 {report['days']}일")
        print(f"- 시작가: {report['start_price']:,}원")
        print(f"- 현재가: {report['current_price']:,}원")
        print(f"- 최저가: {report['min_price']:,}원")
        print(f"- 최고가: {report['max_price']:,}원")
        print(f"- 변동: {sign}{diff:,}원 ({report['change_percent']:+.2f}%)")


def main() -> int:
    parser = build_parser()
    args = parser.parse_args()
    tracker = MusinsaTracker(args.db)

    try:
        if args.command == "add":
            payload = tracker.add_product(args.url, args.name)
        elif args.command == "list":
            payload = tracker.list_products()
        elif args.command == "update":
            payload = tracker.update_prices(args.id)
        elif args.command == "history":
            payload = tracker.get_history(args.id, args.limit)
        elif args.command == "report":
            payload = tracker.get_report(args.id, args.days)
        else:
            parser.print_help()
            return 1

        if args.json:
            print(json.dumps(payload, ensure_ascii=False))
        else:
            print_human(args.command, payload)

    except Exception as exc:
        if args.json:
            print(json.dumps({"error": str(exc)}, ensure_ascii=False), file=sys.stderr)
        else:
            print(f"오류: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
