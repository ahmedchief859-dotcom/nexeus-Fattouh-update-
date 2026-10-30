import { useMemo, useState } from 'react';

// ---------------- Sparkline ----------------
export function Sparkline({ data, color, width = 120, height = 40 }: { data: number[]; color: string; width?: number; height?: number }) {
  const { linePath, areaPath, points } = useMemo(() => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const step = width / (data.length - 1);
    const pts = data.map((v, i) => ({
      x: i * step,
      y: height - ((v - min) / range) * (height - 8) - 4,
    }));
    const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const area = `${line} L ${width} ${height} L 0 ${height} Z`;
    return { linePath: line, areaPath: area, points: pts };
  }, [data, width, height]);

  const id = useMemo(() => `spark-${color.replace('#', '')}`, [color]);

  return (
    <svg width={width} height={height} className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill={`url(#${id})`} />
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-draw" />
      <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r="3" fill={color}>
        <animate attributeName="r" values="3;5;3" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  );
}

// ---------------- Spline Area Chart ----------------
function catmullRom(p0: number[], p1: number[], p2: number[], p3: number[], tension = 0.5): string {
  const t = tension;
  const c1x = p1[0] + ((p2[0] - p0[0]) / 6) * t * 2;
  const c1y = p1[1] + ((p2[1] - p0[1]) / 6) * t * 2;
  const c2x = p2[0] - ((p3[0] - p1[0]) / 6) * t * 2;
  const c2y = p2[1] - ((p3[1] - p0[1]) / 6) * t * 2;
  return `C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2[0]} ${p2[1]}`;
}

export function SplineAreaChart({ data, forecast = [], height = 280 }: {
  data: { day: string; sales: number; target: number }[];
  forecast?: number[];
  height?: number;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const hasForecast = forecast.length > 0;
  const totalPts = data.length + (hasForecast ? forecast.length : 0);
  const width = 760;
  const padX = 40;
  const padY = 30;
  const allSales = [...data.map((d) => d.sales), ...forecast, ...data.map((d) => d.target)];
  const safeSales = allSales.map((value) => Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : 0);
  const max = Math.max(1, ...safeSales) * 1.15;
  const step = (width - padX * 2) / Math.max(1, totalPts - 1);

  const salesPts = data.map((d, i) => ({
    x: padX + i * step,
    y: padY + (1 - d.sales / max) * (height - padY * 2),
    ...d,
  }));
  const targetPts = data.map((d, i) => ({
    x: padX + i * step,
    y: padY + (1 - d.target / max) * (height - padY * 2),
  }));
  const forecastStartX = salesPts[salesPts.length - 1].x;
  const forecastPts = hasForecast
    ? [salesPts[salesPts.length - 1], ...forecast.map((f, i) => ({
        x: forecastStartX + (i + 1) * step,
        y: padY + (1 - f / max) * (height - padY * 2),
      }))]
    : [];

  const buildSpline = (pts: { x: number; y: number }[]) => {
    let path = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = i > 0 ? [pts[i - 1].x, pts[i - 1].y] : [pts[i].x, pts[i].y];
      const p1 = [pts[i].x, pts[i].y];
      const p2 = [pts[i + 1].x, pts[i + 1].y];
      const p3 = i < pts.length - 2 ? [pts[i + 2].x, pts[i + 2].y] : [pts[i + 1].x, pts[i + 1].y];
      path += ' ' + catmullRom(p0, p1, p2, p3);
    }
    return path;
  };

  const salesLine = buildSpline(salesPts);
  const targetLine = buildSpline(targetPts);
  const salesArea = `${salesLine} L ${salesPts[salesPts.length - 1].x} ${height - padY} L ${salesPts[0].x} ${height - padY} Z`;
  const forecastLine = hasForecast ? buildSpline(forecastPts) : '';
  const forecastArea = hasForecast
    ? `${forecastLine} L ${forecastPts[forecastPts.length - 1].x} ${height - padY} L ${forecastPts[0].x} ${height - padY} Z`
    : '';

  const gridLines = [0, 0.25, 0.5, 0.75, 1];

  return (
    <div className="w-full overflow-x-auto">
      <svg role="img" aria-label="Sales performance with actual, target, and forecast values" viewBox={`0 0 ${width} ${height}`} className="w-full min-w-[520px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="salesAreaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7ee8e8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#7ee8e8" stopOpacity="0" />
          </linearGradient>
          {hasForecast && (
            <linearGradient id="forecastAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#a78bfa" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#a78bfa" stopOpacity="0" />
            </linearGradient>
          )}
        </defs>

        {gridLines.map((g, i) => (
          <g key={i}>
            <line x1={padX} y1={padY + g * (height - padY * 2)} x2={width - padX} y2={padY + g * (height - padY * 2)} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
            <text x={padX - 8} y={padY + g * (height - padY * 2) + 4} fill="rgba(255,255,255,0.35)" fontSize="10" textAnchor="end" className="font-body">
              {Math.round((1 - g) * max / 1000)}k
            </text>
          </g>
        ))}

        {salesPts.map((p, i) => (
          <text key={i} x={p.x} y={height - 8} fill="rgba(255,255,255,0.45)" fontSize="11" textAnchor="middle" className="font-body">
            {p.day}
          </text>
        ))}

        <path d={salesArea} fill="url(#salesAreaGrad)" className="animate-fade-in" />
        <path d={targetLine} fill="none" stroke="rgba(167,139,250,0.5)" strokeWidth="1.5" strokeDasharray="6 6" className="animate-draw" />
        <path d={salesLine} fill="none" stroke="#7ee8e8" strokeWidth="2.5" strokeLinecap="round" className="animate-draw" />

        {hasForecast && (
          <>
            <path d={forecastArea} fill="url(#forecastAreaGrad)" opacity="0.5" />
            <path d={forecastLine} fill="none" stroke="#a78bfa" strokeWidth="2" strokeDasharray="3 5" strokeLinecap="round" opacity="0.8" className="animate-draw" style={{ filter: 'drop-shadow(0 0 4px rgba(167,139,250,0.6))' }} />
            <line x1={forecastStartX} y1={padY} x2={forecastStartX} y2={height - padY} stroke="rgba(167,139,250,0.25)" strokeWidth="1" strokeDasharray="2 4" />
            {forecastPts.slice(1).map((p, i) => (
              <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#a78bfa" opacity="0.7">
                {i === 0 && <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />}
              </circle>
            ))}
            <text x={forecastStartX + 4} y={padY + 10} fill="#a78bfa" fontSize="9" className="font-body opacity-70">FORECAST →</text>
          </>
        )}

        {salesPts.map((p, i) => (
          <g key={i}>
            {hover === i && (
              <>
                <line x1={p.x} y1={padY} x2={p.x} y2={height - padY} stroke="rgba(126,232,232,0.3)" strokeWidth="1" />
                <circle cx={p.x} cy={p.y} r="6" fill="#0b0c10" stroke="#7ee8e8" strokeWidth="2" />
                <g transform={`translate(${p.x}, ${p.y - 16})`}>
                  <rect x="-44" y="-24" width="88" height="22" rx="6" fill="rgba(11,12,16,0.95)" stroke="rgba(126,232,232,0.3)" />
                  <text x="0" y="-9" fill="#7ee8e8" fontSize="11" textAnchor="middle" className="font-body font-medium">
                    ${(p.sales / 1000).toFixed(1)}k
                  </text>
                </g>
              </>
            )}
            <rect
              x={p.x - 30}
              y={0}
              width={60}
              height={height}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              className="cursor-pointer"
            />
          </g>
        ))}
      </svg>
    </div>
  );
}

// ---------------- Donut Chart ----------------
export function DonutChart({ data, size = 240 }: { data: { label: string; value: number; color: string }[]; size?: number }) {
  const [hover, setHover] = useState<number | null>(null);
  const safeData = data.map((item) => ({ ...item, value: Number.isFinite(Number(item.value)) ? Math.max(0, Number(item.value)) : 0 }));
  const total = safeData.reduce((s, d) => s + d.value, 0) || 1;
  const radius = size / 2 - 12;
  const innerRadius = radius * 0.62;
  const cx = size / 2;
  const cy = size / 2;

  const segments = useMemo(() => {
    let angle = -Math.PI / 2;
    return safeData.map((d) => {
      const slice = (d.value / total) * Math.PI * 2;
      const start = angle;
      const end = angle + slice;
      angle = end;
      const x1 = cx + Math.cos(start) * radius;
      const y1 = cy + Math.sin(start) * radius;
      const x2 = cx + Math.cos(end) * radius;
      const y2 = cy + Math.sin(end) * radius;
      const x3 = cx + Math.cos(end) * innerRadius;
      const y3 = cy + Math.sin(end) * innerRadius;
      const x4 = cx + Math.cos(start) * innerRadius;
      const y4 = cy + Math.sin(start) * innerRadius;
      const largeArc = slice > Math.PI ? 1 : 0;
      const path = `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
      const midAngle = (start + end) / 2;
      const labelX = cx + Math.cos(midAngle) * (radius + innerRadius) / 2;
      const labelY = cy + Math.sin(midAngle) * (radius + innerRadius) / 2;
      return { path, color: d.color, label: d.label, value: d.value, labelX, labelY, midAngle };
    });
  }, [data, total, cx, cy, radius, innerRadius]);

  const hovered = hover !== null ? data[hover] : null;

  return (
    <div className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="overflow-visible">
          {segments.map((seg, i) => (
            <path
              key={i}
              d={seg.path}
              fill={seg.color}
              opacity={hover === null || hover === i ? 1 : 0.3}
              className="cursor-pointer transition-all duration-300"
              style={{
                transformOrigin: `${cx}px ${cy}px`,
                transform: hover === i ? 'scale(1.05)' : 'scale(1)',
                filter: hover === i ? `drop-shadow(0 0 8px ${seg.color})` : 'none',
              }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-3xl font-display font-bold text-white">
            {hovered ? `${hovered.value}%` : `${total}%`}
          </span>
          <span className="text-xs text-white/50 mt-1">
            {hovered ? hovered.label : 'Total'}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-2.5 w-full">
        {data.map((d, i) => (
          <div
            key={d.label}
            className="flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer"
            style={{ background: hover === i ? 'rgba(255,255,255,0.05)' : 'transparent' }}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
          >
            <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: d.color, boxShadow: `0 0 8px ${d.color}66` }} />
            <span className="text-sm text-white/80 flex-1 truncate">{d.label}</span>
            <span className="text-sm font-display font-semibold text-white">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
