"use client";

import type { PricePoint } from "@/lib/types";

type PriceChartProps = {
  points: PricePoint[];
};

const WIDTH = 680;
const HEIGHT = 250;
const PAD_X = 28;
const PAD_TOP = 28;
const PAD_BOTTOM = 44;

function toKrw(value: number): string {
  return `${value.toLocaleString("ko-KR")}원`;
}

function toDateLabel(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", {
    month: "numeric",
    day: "numeric",
  });
}

export function PriceChart({ points }: PriceChartProps) {
  if (points.length === 0) {
    return <p className="empty">가격 이력이 없어 차트를 그릴 수 없습니다.</p>;
  }

  const sorted = [...points].reverse();
  const prices = sorted.map((p) => p.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const range = max - min || 1;

  const xStep = sorted.length > 1 ? (WIDTH - PAD_X * 2) / (sorted.length - 1) : 0;

  const coords = sorted.map((p, i) => {
    const x = PAD_X + xStep * i;
    const y = HEIGHT - PAD_BOTTOM - ((p.price - min) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
    return { x, y, price: p.price, checkedAt: p.checked_at };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const tickIndexes = Array.from(new Set([0, Math.floor((coords.length - 1) / 2), coords.length - 1]));

  return (
    <div className="chartWrap" aria-label="price trend chart" role="img">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%">
        <defs>
          <linearGradient id="line-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        <line x1={PAD_X} y1={PAD_TOP} x2={PAD_X} y2={HEIGHT - PAD_BOTTOM} stroke="#cbd5e1" />
        <line
          x1={PAD_X}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_X}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="#cbd5e1"
        />

        <polyline
          points={line}
          fill="none"
          stroke="url(#line-grad)"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c, idx) => (
          <g key={`${c.x}-${c.y}-${idx}`}>
            <circle cx={c.x} cy={c.y} r="4.5" fill="#1e40af" />
            {idx === coords.length - 1 ? (
              <text x={c.x - 8} y={c.y - 12} fontSize="11" fill="#1e40af" textAnchor="end">
                {toKrw(c.price)}
              </text>
            ) : null}
          </g>
        ))}

        {tickIndexes.map((idx) => {
          const point = coords[idx];
          return (
            <text
              key={`tick-${idx}`}
              x={point.x}
              y={HEIGHT - 12}
              fontSize="11"
              fill="#64748b"
              textAnchor={idx === 0 ? "start" : idx === coords.length - 1 ? "end" : "middle"}
            >
              {toDateLabel(point.checkedAt)}
            </text>
          );
        })}
      </svg>
    </div>
  );
}
