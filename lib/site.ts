export const SITE_NAME = "Musinsa Tracking";
export const SITE_TITLE = "Musinsa Tracking | 무신사 가격 추적 대시보드";
export const SITE_DESCRIPTION =
  "무신사 상품 URL을 등록하고 가격 변동 이력과 최신 가격을 한눈에 추적하는 Musinsa Tracking 대시보드입니다.";
export const SITE_OG_IMAGE_PATH = "/opengraph-image";
export const SITE_KEYWORDS = [
  "Musinsa Tracking",
  "무신사 가격 추적",
  "무신사 가격 알림",
  "무신사 상품 추적",
  "Musinsa price tracker",
  "가격 이력 대시보드",
  "상품 가격 비교",
  "패션 가격 모니터링",
] as const;

const DEFAULT_SITE_URL = "https://musinsa-tracking.vercel.app";

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteUrl(): string {
  const candidate = process.env.NEXT_PUBLIC_SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!candidate) {
    return DEFAULT_SITE_URL;
  }
  return normalizeUrl(candidate);
}

export function getAbsoluteUrl(path = "/"): string {
  return new URL(path, `${getSiteUrl()}/`).toString();
}
