import type { RegionalShareMap } from '@/core/types';

interface RegionalShareBarProps {
  regionalShare?: RegionalShareMap | null;
}

export function RegionalShareBar({ regionalShare }: RegionalShareBarProps) {
  if (!regionalShare) return null;
  const regions = [
    { key: 'na' as const, label: 'NA', color: '#ef4444' },
    { key: 'we' as const, label: 'WE', color: '#10b981' },
    { key: 'hg' as const, label: 'HG', color: '#f59e0b' },
    { key: 'od' as const, label: 'OD', color: '#8b5cf6' },
  ];
  return (
    <div className="flex items-center gap-1 mt-1">
      {regions.map(r => (
        <div key={r.key} className="flex items-center gap-0.5" title={`${r.label}: ${regionalShare[r.key] || 0}%`}>
          <div className="w-8 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: `${Math.min(100, (regionalShare[r.key] || 0) * 2.5)}%`, backgroundColor: r.color }} />
          </div>
          <span className="text-[10px] text-gray-500">{regionalShare[r.key] || 0}</span>
        </div>
      ))}
    </div>
  );
}
