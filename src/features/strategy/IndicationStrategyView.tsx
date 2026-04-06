'use client';

import { useMemo, useState } from 'react';
import type { Product, IndicationKey } from '@/core/types';
import { INDICATIONS, DEFAULT_MARKET_SIZE, DEFAULT_VENDORS, CATEGORIES } from '@/core';
import { useData } from '@/store';

interface IndicationStrategyViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function IndicationStrategyView({ products, indicationFilter }: IndicationStrategyViewProps) {
  const [selectedIndication, setSelectedIndication] = useState<IndicationKey>('solid_tumor');
  const { marketSize = DEFAULT_MARKET_SIZE, vendors = DEFAULT_VENDORS } = useData();

  const indication = INDICATIONS.find((ind) => ind.key === selectedIndication);
  const indicationProducts = products.filter((p) => p.indications.includes(selectedIndication));

  const indicationTAM = marketSize.byIndication[selectedIndication] || 5000;

  const topVendorsInIndication = useMemo(() => {
    const vendorMap = new Map<string, number>();

    indicationProducts.forEach((product) => {
      const currentShare = vendorMap.get(product.vendor) || 0;
      vendorMap.set(product.vendor, currentShare + product.share);
    });

    return Array.from(vendorMap.entries())
      .map(([vendorKey, share]) => {
        const vendor = vendors.find((v) => v.key === vendorKey);
        return {
          vendor: vendor?.label || vendorKey,
          color: vendor?.color || '#9ca3af',
          share,
        };
      })
      .sort((a, b) => b.share - a.share)
      .slice(0, 5);
  }, [indicationProducts, vendors]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Indication-Specific Strategy</h2>
        <p className="mt-1 text-sm text-gray-400">Analyze market dynamics and competitive positioning by indication</p>
      </div>

      {/* Indication Buttons Grid (4x2) */}
      <div className="grid grid-cols-4 gap-3">
        {INDICATIONS.map((ind) => (
          <button
            key={ind.key}
            onClick={() => setSelectedIndication(ind.key)}
            className={`p-4 rounded-lg border-2 transition-all ${
              selectedIndication === ind.key
                ? 'border-blue-500 bg-blue-900/30'
                : 'border-gray-700 bg-gray-900 hover:border-gray-600'
            }`}
          >
            <div className="text-2xl mb-2">{ind.icon}</div>
            <div className="text-sm font-semibold text-gray-200">{ind.label}</div>
          </button>
        ))}
      </div>

      {/* TAM and Top Vendors Grid (2-col) */}
      <div className="grid grid-cols-2 gap-6">
        {/* TAM Card */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Total Addressable Market</h3>
          <div className="mt-4">
            <div className="text-4xl font-bold text-gray-100">${indicationTAM}M</div>
            <p className="mt-2 text-sm text-gray-400">{indication?.label} market size</p>
          </div>

          {/* Regional Breakdown */}
          <div className="mt-6 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Regional Distribution</p>
            {Object.entries(marketSize.byRegion).map(([region, percentage]) => (
              <div key={region} className="flex items-center justify-between">
                <span className="text-sm text-gray-300 capitalize">{region}</span>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${percentage * 100}%` }} />
                  </div>
                  <span className="text-xs font-semibold text-gray-400">{(percentage * 100).toFixed(0)}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Vendors List */}
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide">Top Vendors</h3>
          <div className="mt-6 space-y-3">
            {topVendorsInIndication.length > 0 ? (
              topVendorsInIndication.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-sm font-medium text-gray-200">{item.vendor}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-300">{item.share.toFixed(1)}%</span>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No products in this indication</p>
            )}
          </div>
        </div>
      </div>

      {/* Products Grid (3-col, max 9) */}
      <div>
        <h3 className="mb-4 text-sm font-semibold text-gray-400 uppercase tracking-wide">
          Products ({indicationProducts.length})
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {indicationProducts.slice(0, 9).map((product) => {
            const vendor = vendors.find((v) => v.key === product.vendor);
            return (
              <div key={product.id} className="bg-gray-900 rounded-lg border border-gray-700 p-4">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-200 line-clamp-2">{product.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{product.vendor}</p>
                  </div>
                  <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: vendor?.color || '#9ca3af' }} />
                </div>

                <div className="space-y-2 mt-4 pt-4 border-t border-gray-700">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Market Share</span>
                    <span className="text-xs font-semibold text-gray-200">{product.share.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-400">Regulatory</span>
                    <span className="text-xs font-semibold text-gray-200">{product.regulatory}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
