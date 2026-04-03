import { useMemo } from 'react';
import type { Product, IndicationKey } from '@/core/types';
import { INDICATIONS } from '@/core/constants';
import { DEFAULT_VENDORS } from '@/core/data/vendors';

interface Props {
  products: Product[];
}

export function IndicationHeatmap({ products }: Props) {
  const heatmapData = useMemo(() => {
    const vendorIndicationCounts: Record<string, Partial<Record<IndicationKey, number>>> = {};

    products.forEach(p => {
      if (!vendorIndicationCounts[p.vendor]) {
        vendorIndicationCounts[p.vendor] = {};
        INDICATIONS.forEach(ind => {
          (vendorIndicationCounts[p.vendor] as Record<IndicationKey, number>)[ind.key] = 0;
        });
      }

      p.indications?.forEach(ind => {
        const vendorData = vendorIndicationCounts[p.vendor] as Record<IndicationKey, number>;
        vendorData[ind]++;
      });
    });

    const vendorCounts = Object.entries(vendorIndicationCounts)
      .map(([key, counts]) => ({
        key,
        label: DEFAULT_VENDORS.find(v => v.key === key)?.label || key,
        color: DEFAULT_VENDORS.find(v => v.key === key)?.color || '#9ca3af',
        total: Object.values(counts).reduce((a, b) => a + b, 0),
        indications: counts,
      }))
      .filter(v => v.total > 0)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    return vendorCounts;
  }, [products]);

  const maxCount = useMemo(() => {
    let max = 0;
    heatmapData.forEach(vendor => {
      INDICATIONS.forEach(ind => {
        max = Math.max(max, vendor.indications[ind.key] || 0);
      });
    });
    return max || 1;
  }, [heatmapData]);

  const getHeatmapColor = (count: number): string => {
    if (count === 0) return '#1f2937';
    const intensity = count / maxCount;
    if (intensity < 0.2) return '#374151';
    if (intensity < 0.4) return '#4b5563';
    if (intensity < 0.6) return '#6366f1';
    if (intensity < 0.8) return '#3b82f6';
    return '#0ea5e9';
  };

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">Indication Coverage Heatmap</h2>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <div className="grid gap-0" style={{ gridTemplateColumns: `140px repeat(${INDICATIONS.length}, 1fr)` }}>
            {/* Header */}
            <div className="sticky left-0 z-10 bg-gray-800 border-b border-gray-700" />
            {INDICATIONS.map(ind => (
              <div
                key={ind.key}
                className="text-center px-2 py-3 text-xs font-semibold text-gray-300 border-b border-gray-700 bg-gray-750"
                title={ind.label}
              >
                <div className="truncate">{ind.icon}</div>
                <div className="truncate text-[10px]">{ind.label}</div>
              </div>
            ))}

            {/* Rows */}
            {heatmapData.map(vendor => (
              <div key={vendor.key} style={{ gridColumn: '1 / -1', display: 'contents' }}>
                <div className="sticky left-0 z-10 bg-gray-800 border-b border-gray-700 px-3 py-2 text-xs font-semibold text-white truncate">
                  {vendor.label}
                </div>
                {INDICATIONS.map(ind => {
                  const count = vendor.indications[ind.key] || 0;
                  return (
                    <div
                      key={`${vendor.key}-${ind.key}`}
                      className="border border-gray-700 py-3 px-2 text-center text-sm font-medium transition-colors hover:opacity-80"
                      style={{ backgroundColor: getHeatmapColor(count) }}
                      title={`${vendor.label} - ${ind.label}: ${count} products`}
                    >
                      {count > 0 && <span className="text-gray-100">{count}</span>}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="mt-6 flex items-center gap-4">
        <span className="text-xs font-semibold text-gray-400">Intensity:</span>
        <div className="flex gap-2">
          {[0, maxCount * 0.25, maxCount * 0.5, maxCount * 0.75, maxCount].map((val, i) => (
            <div key={i} className="flex items-center gap-1">
              <div
                className="w-4 h-4 rounded border border-gray-600"
                style={{ backgroundColor: getHeatmapColor(val) }}
              />
              <span className="text-xs text-gray-400">{Math.round(val)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
