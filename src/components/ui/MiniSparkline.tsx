import { useMemo } from 'react';
import { ResponsiveContainer, LineChart, Line } from 'recharts';
import { useData } from '@/store';
import { DEFAULT_HISTORICAL_SNAPSHOTS } from '@/core';

interface MiniSparklineProps {
  productId: string;
  metric?: 'share' | 'pricing';
  width?: number;
  height?: number;
}

export function MiniSparkline({ productId, metric = 'share', width = 80, height = 24 }: MiniSparklineProps) {
  const data = useData();
  const historicalSnapshots = data?.historicalSnapshots || DEFAULT_HISTORICAL_SNAPSHOTS;

  const history = useMemo(() => {
    return historicalSnapshots.map(s => ({
      q: s.quarter,
      value: s.data[productId]?.[metric] ?? null
    })).filter((d): d is { q: string; value: number } => d.value !== null);
  }, [productId, metric, historicalSnapshots]);

  if (history.length < 2) return null;
  const first = history[0].value;
  const last = history[history.length - 1].value;
  const color = last >= first ? '#10b981' : '#ef4444';
  return (
    <div className="inline-flex items-center gap-1" title={`${history[0].q}: ${first.toFixed(1)} → ${history[history.length - 1].q}: ${last.toFixed(1)}`}>
      <ResponsiveContainer width={width} height={height}>
        <LineChart data={history}>
          <Line type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
      <span className="text-xs font-semibold" style={{ color }}>{last > first ? '+' : ''}{(last - first).toFixed(1)}</span>
    </div>
  );
}
