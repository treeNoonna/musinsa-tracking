"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { PriceChart } from "@/components/price-chart";
import type { HistoryResponse, Product, UpdateResult } from "@/lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://127.0.0.1:8000";
const READ_TIMEOUT_MS = 15_000;
const WRITE_TIMEOUT_MS = 120_000;

type ApiErrorShape = {
  error?: string;
  detail?: string;
};

async function apiFetchJson<T>(input: string, init?: RequestInit, timeoutMs = READ_TIMEOUT_MS): Promise<T> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
    const data = (await res.json()) as T & ApiErrorShape;

    if (!res.ok) {
      throw new Error(data.error ?? data.detail ?? `request failed (${res.status})`);
    }

    return data;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("요청 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.");
    }
    throw error;
  } finally {
    window.clearTimeout(timer);
  }
}

function krw(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "-";
  }
  return `${value.toLocaleString("ko-KR")}원`;
}

function shortDateTime(value: string | null): string {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("ko-KR", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function cleanProductLabel(value: string | null | undefined): string {
  if (!value) {
    return "Selected product";
  }
  return value
    .replace(/\s*[-|]\s*사이즈\s*&\s*후기\s*\|\s*무신사\s*$/u, "")
    .replace(/\s*-\s*사이즈\s*&\s*후기\s*$/u, "")
    .replace(/\s*\|\s*무신사\s*$/u, "")
    .trim();
}

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<number | "all" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? null,
    [products, selectedId],
  );
  const priceSummary = useMemo(() => {
    const points = history?.history ?? [];
    if (points.length === 0) {
      return { max: null, min: null };
    }

    const prices = points.map((point) => point.price);
    return { max: Math.max(...prices), min: Math.min(...prices) };
  }, [history]);
  const isBusy = loading || syncing;

  async function loadProducts() {
    const data = await apiFetchJson<{ products?: Product[] }>(`${API_BASE}/api/products`);
    const nextProducts = data.products ?? [];
    setProducts(nextProducts);

    if (nextProducts.length > 0 && selectedId === null) {
      setSelectedId(nextProducts[0].id);
    }
  }

  async function loadProductDetails(productId: number) {
    const hData = await apiFetchJson<HistoryResponse>(`${API_BASE}/api/products/${productId}/history?limit=40`);
    setHistory(hData);
  }

  useEffect(() => {
    setLoading(true);
    setBusyMessage("등록된 상품을 불러오는 중...");
    loadProducts()
      .catch((e) => setError(e instanceof Error ? e.message : "failed to load"))
      .finally(() => {
        setLoading(false);
        setBusyMessage(null);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) {
      return;
    }
    setLoading(true);
    setBusyMessage("가격 이력과 요약 정보를 불러오는 중...");
    loadProductDetails(selectedId)
      .catch((e) => setError(e instanceof Error ? e.message : "failed to load details"))
      .finally(() => {
        setLoading(false);
        setBusyMessage(null);
      });
  }, [selectedId]);

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!url.trim()) {
      return;
    }

    setLoading(true);
    setBusyMessage("상품을 등록하는 중...");
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetchJson<{ message?: string; product?: Product }>(`${API_BASE}/api/products`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      }, WRITE_TIMEOUT_MS);

      setMessage(data.message ?? "Product added.");
      setUrl("");

      await loadProducts();
      if (data.product?.id) {
        setSelectedId(data.product.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to add product");
    } finally {
      setLoading(false);
      setBusyMessage(null);
    }
  }

  async function updateAll() {
    setSyncing(true);
    setSyncingId("all");
    setBusyMessage("전체 상품 가격을 확인하는 중...");
    setMessage(null);
    setError(null);
    try {
      const data = await apiFetchJson<{ updates?: UpdateResult[] }>(`${API_BASE}/api/products/update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }, WRITE_TIMEOUT_MS);

      const okCount = (data.updates ?? []).filter((u) => u.ok).length;
      setMessage(`${okCount} products updated`);
      await loadProducts();
      if (selectedId) {
        await loadProductDetails(selectedId);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to update all products");
    } finally {
      setSyncing(false);
      setSyncingId(null);
      setBusyMessage(null);
    }
  }

  async function updateOne(id: number) {
    const target = products.find((product) => product.id === id);
    const label = cleanProductLabel(target?.name);
    setSyncing(true);
    setSyncingId(id);
    setBusyMessage(`${label} 가격 정보 업데이트중...`);
    setMessage(null);
    setError(null);

    try {
      const data = await apiFetchJson<{ updates?: UpdateResult[] }>(
        `${API_BASE}/api/products/${id}/update`,
        { method: "POST" },
        WRITE_TIMEOUT_MS,
      );

      const one = data.updates?.[0];
      if (one?.ok) {
        setMessage(`${label}\nPrice updated: ${krw(one.price)}`);
      } else {
        setError(one?.error ?? `${label} price update failed`);
      }

      await loadProducts();
      if (selectedId === id) {
        await loadProductDetails(id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to update product");
    } finally {
      setSyncing(false);
      setSyncingId(null);
      setBusyMessage(null);
    }
  }

  async function deleteOne(id: number) {
    const target = products.find((product) => product.id === id);
    const label = cleanProductLabel(target?.name);
    setSyncing(true);
    setSyncingId(id);
    setBusyMessage(`${label} 상품을 삭제하는 중...`);
    setMessage(null);
    setError(null);

    try {
      await apiFetchJson<{ deleted?: boolean }>(`${API_BASE}/api/products/${id}`, { method: "DELETE" }, WRITE_TIMEOUT_MS);

      setMessage(`${label}\nProduct deleted`);
      await loadProducts();
      setHistory(null);
      setSelectedId((current) => {
        if (current !== id) {
          return current;
        }
        const next = products.find((p) => p.id !== id);
        return next?.id ?? null;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to delete product");
    } finally {
      setSyncing(false);
      setSyncingId(null);
      setBusyMessage(null);
    }
  }

  return (
    <main className="shell" aria-busy={isBusy}>
      {isBusy ? (
        <div className="loadingOverlay" role="status" aria-live="polite">
          <div className="loadingCard">
            <span className="spinner spinnerLg" aria-hidden="true" />
            <div>
              <strong>{syncing ? "가격 정보를 가져오는 중..." : "로딩 중"}</strong>
              <p>{busyMessage ?? "잠시만 기다려주세요."}</p>
            </div>
          </div>
        </div>
      ) : null}
      <section className="pageFrame">
        <header className="topbar">
          <div>
            <span className="eyebrow">MUSINSA ARCHIVE</span>
            <h1>Musinsa Price Tracker</h1>
            <p>무신사 상품 가격 트래킹</p>
          </div>
          <div className="controls">
            <button
              className="btn btnAccent"
              onClick={updateAll}
              disabled={syncing || loading}
              type="button"
            >
              {syncingId === "all" ? <span className="spinner" aria-hidden="true" /> : null}
              전체 가격 갱신
            </button>
            <span className="badge">{products.length} products</span>
          </div>
        </header>

        <section className="layout">
          <div className="left">
          <article className="card">
            <h2>Add Product</h2>
            <form className="controls" onSubmit={handleAdd}>
              <input
                className="input inputGrow"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.musinsa.com/products/..."
                required
                aria-label="상품 URL"
              />
              <button className="btn btnPrimary" type="submit" disabled={loading || syncing}>
                {loading ? <span className="spinner" aria-hidden="true" /> : null}
                등록
              </button>
            </form>
            {message ? <p className="good">{message}</p> : null}
            {error ? <p className="error">{error}</p> : null}
          </article>

          <article className="card">
            <h2>Tracked Products</h2>
            {products.length === 0 ? (
              <p className="empty">등록된 상품이 없습니다.</p>
            ) : (
              <div className="tableWrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Products</th>
                      <th className="colPrice">Current</th>
                      <th className="colChecked">Updated</th>
                      <th className="colActions">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr
                        key={p.id}
                        onClick={() => setSelectedId(p.id)}
                        style={{ cursor: "pointer" }}
                        aria-selected={selectedId === p.id}
                      >
                        <td>
                          <div className="productCell">
                            {p.image_url ? (
                              <img className="thumb" src={p.image_url} alt={p.name ?? "상품 이미지"} />
                            ) : (
                              <div className="thumb thumbFallback" aria-hidden="true" />
                            )}
                            <div>
                              <div>{p.name ?? "(이름없음)"}</div>
                              <button
                                className="productLink empty mono"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(p.url, "_blank", "noopener,noreferrer");
                                }}
                              >
                                {p.url}
                              </button>
                            </div>
                          </div>
                        </td>
                        <td className="mono colPrice">{krw(p.last_price)}</td>
                        <td className="colChecked">{shortDateTime(p.last_checked_at)}</td>
                        <td className="colActions">
                          <div className="rowActions">
                            <button
                              className="rowBtn"
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                void updateOne(p.id);
                              }}
                            >
                              {syncingId === p.id ? (
                                <span className="spinner spinnerInline" aria-hidden="true" />
                              ) : null}
                              갱신
                            </button>
                            <button
                              className="rowBtn rowBtnDanger"
                              type="button"
                              disabled={isBusy}
                              onClick={(e) => {
                                e.stopPropagation();
                                void deleteOne(p.id);
                              }}
                            >
                              삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
          </div>

          <aside className="right">
            <article className="card">
              <h2>Summary</h2>
              {!selected ? (
                <p className="empty">상품을 선택하세요.</p>
              ) : (
                <>
                  <div className="productHero">
                    {selected.image_url ? (
                      <img className="heroImage" src={selected.image_url} alt={selected.name ?? "상품 이미지"} />
                    ) : (
                      <div className="heroImage heroFallback" aria-hidden="true" />
                    )}
                    <div className="heroMeta">
                      <strong>{selected.name ?? "(이름없음)"}</strong>
                      <div className="empty mono urlText">{selected.url}</div>
                    </div>
                  </div>
                  <div className="grid">
                    <div className="kpi">
                      <div className="label">현재가</div>
                      <div className="value">{krw(selected.last_price)}</div>
                    </div>
                  </div>
                  <div className="subGrid">
                    <div className="kpi kpiCompact">
                      <div className="label">최고가</div>
                      <div className="value mono">{krw(priceSummary.max)}</div>
                    </div>
                    <div className="kpi kpiCompact">
                      <div className="label">최저가</div>
                      <div className="value mono">{krw(priceSummary.min)}</div>
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="card">
              <h2>가격 추이</h2>
              <PriceChart points={history?.history ?? []} />
            </article>
          </aside>
        </section>
      </section>
    </main>
  );
}
