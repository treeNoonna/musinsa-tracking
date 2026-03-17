"use client";

import type { PricePoint } from "@/lib/types";

type PriceChartProps = {
  points: PricePoint[];
};

const WIDTH = 680;
const HEIGHT = 320;
const PAD_LEFT = 72;
const PAD_RIGHT = 24;
const PAD_TOP = 28;
const PAD_BOTTOM = 56;

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

  const xStep = sorted.length > 1 ? (WIDTH - PAD_LEFT - PAD_RIGHT) / (sorted.length - 1) : 0;

  const coords = sorted.map((p, i) => {
    const x = PAD_LEFT + xStep * i;
    const y = HEIGHT - PAD_BOTTOM - ((p.price - min) / range) * (HEIGHT - PAD_TOP - PAD_BOTTOM);
    return { x, y, price: p.price, checkedAt: p.checked_at };
  });

  const line = coords.map((c) => `${c.x},${c.y}`).join(" ");
  const tickIndexes = Array.from(new Set([0, Math.floor((coords.length - 1) / 2), coords.length - 1]));
  const yTicks = Array.from({ length: 4 }, (_, idx) => {
    const ratio = idx / 3;
    const value = Math.round(max - (max - min) * ratio);
    const y = PAD_TOP + (HEIGHT - PAD_TOP - PAD_BOTTOM) * ratio;
    return { value, y };
  });

  return (
    <div className="chartWrap" aria-label="price trend chart" role="img">
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height="100%">
        <defs>
          <linearGradient id="line-grad" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="#2563EB" />
            <stop offset="100%" stopColor="#F97316" />
          </linearGradient>
        </defs>
        {yTicks.map((tick) => (
          <g key={`y-${tick.value}-${tick.y}`}>
            <line
              x1={PAD_LEFT}
              y1={tick.y}
              x2={WIDTH - PAD_RIGHT}
              y2={tick.y}
              stroke="rgba(255,255,255,0.08)"
              strokeDasharray="4 6"
            />
            <text
              x={PAD_LEFT - 10}
              y={tick.y + 4}
              fontSize="12"
              fill="#b8bcc6"
              textAnchor="end"
            >
              {toKrw(tick.value)}
            </text>
          </g>
        ))}

        <line x1={PAD_LEFT} y1={PAD_TOP} x2={PAD_LEFT} y2={HEIGHT - PAD_BOTTOM} stroke="#53555b" />
        <line
          x1={PAD_LEFT}
          y1={HEIGHT - PAD_BOTTOM}
          x2={WIDTH - PAD_RIGHT}
          y2={HEIGHT - PAD_BOTTOM}
          stroke="#53555b"
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
            <circle cx={c.x} cy={c.y} r="5" fill="#f5f5f5" stroke="#1e40af" strokeWidth="2.5" />
            {idx === coords.length - 1 ? (
              <text x={c.x - 8} y={c.y - 14} fontSize="12" fill="#f5f5f5" textAnchor="end">
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
              y={HEIGHT - 16}
              fontSize="12"
              fill="#b8bcc6"
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
