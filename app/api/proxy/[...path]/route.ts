import { NextRequest } from "next/server";

const BACKEND_BASE =
  process.env.BACKEND_API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://127.0.0.1:8000";

function buildTargetUrl(req: NextRequest, path: string[]) {
  const base = BACKEND_BASE.replace(/\/$/, "");
  const url = new URL(`${base}/${path.join("/")}`);
  req.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.append(key, value);
  });
  return url;
}

async function proxy(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const targetUrl = buildTargetUrl(req, path);
  const body =
    req.method === "GET" || req.method === "HEAD" ? undefined : await req.text();

  const upstream = await fetch(targetUrl, {
    method: req.method,
    headers: {
      "Content-Type": req.headers.get("content-type") ?? "application/json",
    },
    body,
    cache: "no-store",
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
