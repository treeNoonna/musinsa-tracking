import { NextRequest } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";
const PROXY_TIMEOUT_MS = 90_000;

function buildTargetUrl(req: NextRequest, path: string[]) {
  const base = BACKEND_BASE.replace(/\/$/, "");
  const url = new URL(`${base}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url;
}

function getProxyErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "백엔드 응답 시간이 초과되었습니다.";
  }

  const cause =
    typeof error === "object" &&
    error !== null &&
    "cause" in error &&
    typeof (error as { cause?: unknown }).cause === "object" &&
    (error as { cause?: unknown }).cause !== null
      ? ((error as { cause: { code?: unknown } }).cause.code ?? null)
      : null;

  if (cause === "ECONNREFUSED" || cause === "ECONNRESET" || cause === "ENOTFOUND") {
    return `백엔드에 연결할 수 없습니다. 현재 대상: ${BACKEND_BASE}`;
  }

  return "백엔드 요청 중 오류가 발생했습니다.";
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(req, path);
  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  try {
    const upstream = await fetch(targetUrl, {
      method: req.method,
      headers: {
        "Content-Type": req.headers.get("content-type") ?? "application/json",
      },
      body,
      cache: "no-store",
      signal: controller.signal,
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json; charset=utf-8";
    const payload = await upstream.text();

    return new Response(payload, {
      status: upstream.status,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return Response.json({ error: getProxyErrorMessage(error) }, { status: 504 });
  } finally {
    clearTimeout(timer);
  }
}

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}

export async function OPTIONS(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return proxy(req, context);
}
