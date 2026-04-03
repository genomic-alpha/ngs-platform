import React from 'react';
import { CATEGORIES } from '@/core';
import type { Dispatch, SetStateAction } from 'react';
import type { Product, MarketSize, HistoricalSnapshot, CostComponent } from '@/core/types';

interface MarketDataTabProps {
  marketSize: MarketSize;
  setMarketSize: (size: MarketSize) => void;
  historicalSnapshots: HistoricalSnapshot[];
  setHistoricalSnapshots: (snapshots: HistoricalSnapshot[]) => void;
  currentQuarter: string;
  setCurrentQuarter: (quarter: string) => void;
  products: Product[];
  costComponents: Record<string, CostComponent>;
  setCostComponents: Dispatch<SetStateAction<Record<string, CostComponent>>>;
  activeSubTab: 'sizing' | 'historical' | 'costs';
  setActiveSubTab: (tab: 'sizing' | 'historical' | 'costs') => void;
}

export function MarketDataTab({
  marketSize,
  setMarketSize,
  historicalSnapshots,
  setHistoricalSnapshots,
  currentQuarter,
  setCurrentQuarter,
  products,
  costComponents,
  setCostComponents,
  activeSubTab,
  setActiveSubTab,
}: MarketDataTabProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Sub-tab selector */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveSubTab('sizing')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'sizing' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Market Sizing
        </button>
        <button
          onClick={() => setActiveSubTab('historical')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'historical' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Historical Data
        </button>
        <button
          onClick={() => setActiveSubTab('costs')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'costs' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Cost Components
        </button>
      </div>

      {activeSubTab === 'sizing' && (
        <div className="space-y-4 bg-gray-800 rounded p-6">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Total NGS Market Size</label>
            <input
              type="number"
              step="0.01"
              value={marketSize.totalNGS}
              onChange={(e) => {
                setMarketSize({ ...marketSize, totalNGS: parseFloat(e.target.value) });
              }}
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">CAGR</label>
            <input
              type="number"
              step="0.1"
              value={marketSize.cagr}
              onChange={(e) => {
                setMarketSize({ ...marketSize, cagr: parseFloat(e.target.value) });
              }}
              className="w-full bg-gray-700 text-white rounded px-3 py-2"
            />
          </div>

          <div>
            <label className="text-sm text-gray-300 block mb-2">By Category</label>
            <div className="space-y-2">
              {CATEGORIES.map((cat) => (
                <div key={cat} className="flex items-center gap-2">
                  <label className="w-32 text-sm text-gray-400">{cat}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={marketSize.byCategory[cat] ?? 0}
                    onChange={(e) => {
                      setMarketSize({
                        ...marketSize,
                        byCategory: { ...marketSize.byCategory, [cat]: parseFloat(e.target.value) },
                      });
                    }}
                    className="flex-1 bg-gray-700 text-white rounded px-2 py-1"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'historical' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Select Quarter</label>
            <select
              value={currentQuarter}
              onChange={(e) => setCurrentQuarter(e.target.value)}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
            >
              {historicalSnapshots.map((snap) => (
                <option key={snap.quarter} value={snap.quarter}>
                  {snap.quarter}
                </option>
              ))}
            </select>
          </div>

          {historicalSnapshots.find((s) => s.quarter === currentQuarter) && (
            <div className="space-y-3">
              {products.slice(0, 10).map((product) => {
                const snapshot = historicalSnapshots.find((s) => s.quarter === currentQuarter);
                const data = snapshot?.data[product.id] || { share: 0, pricing: 0 };
                return (
                  <div key={product.id} className="bg-gray-800 rounded p-4 grid grid-cols-3 gap-4">
                    <span className="text-white text-sm">{product.name}</span>
                    <input
                      type="number"
                      step="0.1"
                      value={data.share}
                      onChange={(e) => {
                        const updated = historicalSnapshots.map((s) =>
                          s.quarter === currentQuarter
                            ? {
                                ...s,
                                data: { ...s.data, [product.id]: { ...data, share: parseFloat(e.target.value) } },
                              }
                            : s
                        );
                        setHistoricalSnapshots(updated);
                      }}
                      className="bg-gray-700 text-white rounded px-2 py-1"
                      placeholder="Share"
                    />
                    <input
                      type="number"
                      step="0.1"
                      value={data.pricing}
                      onChange={(e) => {
                        const updated = historicalSnapshots.map((s) =>
                          s.quarter === currentQuarter
                            ? {
                                ...s,
                                data: { ...s.data, [product.id]: { ...data, pricing: parseFloat(e.target.value) } },
                              }
                            : s
                        );
                        setHistoricalSnapshots(updated);
                      }}
                      className="bg-gray-700 text-white rounded px-2 py-1"
                      placeholder="Pricing"
                    />
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSubTab === 'costs' && (
        <div className="space-y-3">
          {products.slice(0, 15).map((product) => {
            const costs = costComponents[product.id] || {
              reagents: 0,
              instrument_amortized: 0,
              labor: 0,
              qc: 0,
              total: 0,
            };

            return (
              <div key={product.id} className="bg-gray-800 rounded p-4 grid grid-cols-6 gap-2">
                <span className="text-white text-sm col-span-1">{product.name.substring(0, 20)}</span>
                <input
                  type="number"
                  step="0.01"
                  value={costs.reagents}
                  onChange={(e) => {
                    const updated = { ...costComponents, [product.id]: { ...costs, reagents: parseFloat(e.target.value) } };
                    setCostComponents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Reagents"
                />
                <input
                  type="number"
                  step="0.01"
                  value={costs.instrument_amortized}
                  onChange={(e) => {
                    const updated = { ...costComponents, [product.id]: { ...costs, instrument_amortized: parseFloat(e.target.value) } };
                    setCostComponents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Instrument"
                />
                <input
                  type="number"
                  step="0.01"
                  value={costs.labor}
                  onChange={(e) => {
                    const updated = { ...costComponents, [product.id]: { ...costs, labor: parseFloat(e.target.value) } };
                    setCostComponents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Labor"
                />
                <input
                  type="number"
                  step="0.01"
                  value={costs.qc}
                  onChange={(e) => {
                    const updated = { ...costComponents, [product.id]: { ...costs, qc: parseFloat(e.target.value) } };
                    setCostComponents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="QC"
                />
                <span className="text-yellow-400 text-sm font-medium">{costs.total.toFixed(2)}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
