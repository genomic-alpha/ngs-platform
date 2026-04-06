import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { IntelSignal, Vendor, CompatibilityEntry, CompatibilityLayer } from '@/core/types';

interface IntelCompatibilityTabProps {
  intelSignals: IntelSignal[];
  setIntelSignals: (signals: IntelSignal[]) => void;
  vendors: Vendor[];
  compatibility: CompatibilityEntry[];
  setCompatibility: (entries: CompatibilityEntry[]) => void;
  compatibilityLayers: CompatibilityLayer[];
  compatLayerFilter: string;
  setCompatLayerFilter: (filter: string) => void;
  historyPage: number;
  setHistoryPage: (page: number) => void;
  activeSubTab: 'intel' | 'compatibility';
  setActiveSubTab: (tab: 'intel' | 'compatibility') => void;
}

export function IntelCompatibilityTab({
  intelSignals,
  setIntelSignals,
  vendors,
  compatibility,
  setCompatibility,
  compatibilityLayers,
  compatLayerFilter,
  setCompatLayerFilter,
  historyPage,
  setHistoryPage,
  activeSubTab,
  setActiveSubTab,
}: IntelCompatibilityTabProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Sub-tab selector */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveSubTab('intel')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'intel' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Intel Signals
        </button>
        <button
          onClick={() => setActiveSubTab('compatibility')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'compatibility' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Compatibility
        </button>
      </div>

      {activeSubTab === 'intel' && (
        <div className="space-y-4">
          <button
            onClick={() => {
              const newSignal: IntelSignal = {
                id: `signal-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                type: 'regulatory',
                vendor: vendors[0]?.key || 'unknown',
                title: 'New Signal',
                impact: 'medium',
                summary: '',
                source: '',
                products: [],
              };
              setIntelSignals([...intelSignals, newSignal]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus size={18} />
            Add Signal
          </button>

          <div className="space-y-2">
            {intelSignals.map((signal) => (
              <div key={signal.id} className="bg-gray-800 rounded p-4 grid grid-cols-5 gap-4">
                <input
                  type="text"
                  value={signal.title}
                  onChange={(e) => {
                    const updated = intelSignals.map((s) => (s.id === signal.id ? { ...s, title: e.target.value } : s));
                    setIntelSignals(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />
                <input
                  type="date"
                  value={signal.date}
                  onChange={(e) => {
                    const updated = intelSignals.map((s) => (s.id === signal.id ? { ...s, date: e.target.value } : s));
                    setIntelSignals(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />
                <select
                  value={signal.type}
                  onChange={(e) => {
                    const updated = intelSignals.map((s) => (s.id === signal.id ? { ...s, type: e.target.value as 'regulatory' | 'pricing' | 'product_launch' | 'partnership' } : s));
                    setIntelSignals(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="regulatory">Regulatory</option>
                  <option value="pricing">Pricing</option>
                  <option value="product_launch">Product Launch</option>
                  <option value="partnership">Partnership</option>
                </select>
                <select
                  value={signal.impact}
                  onChange={(e) => {
                    const updated = intelSignals.map((s) => (s.id === signal.id ? { ...s, impact: e.target.value as 'high' | 'medium' | 'low' } : s));
                    setIntelSignals(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <button
                  onClick={() => {
                    const updated = intelSignals.filter((s) => s.id !== signal.id);
                    setIntelSignals(updated);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'compatibility' && (
        <div className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 block mb-2">Filter by Layer</label>
            <select
              value={compatLayerFilter}
              onChange={(e) => {
                setCompatLayerFilter(e.target.value);
                setHistoryPage(0);
              }}
              className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
            >
              <option value="">All Layers</option>
              {compatibilityLayers.map((layer) => (
                <option key={layer.key} value={layer.key}>
                  {layer.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {(() => {
              const filtered = compatibility.filter((c) => (compatLayerFilter ? c.layer === compatLayerFilter : true));
              const pageSize = 50;
              const paginated = filtered.slice(historyPage * pageSize, (historyPage + 1) * pageSize);

              return paginated.map((entry) => (
                <div key={`${entry.source}-${entry.target}`} className="bg-gray-800 rounded p-4 grid grid-cols-5 gap-4">
                  <input
                    type="text"
                    value={entry.source}
                    onChange={(e) => {
                      const updated = compatibility.map((c) =>
                        c.source === entry.source && c.target === entry.target ? { ...c, source: e.target.value } : c
                      );
                      setCompatibility(updated);
                    }}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    placeholder="Source"
                  />
                  <input
                    type="text"
                    value={entry.target}
                    onChange={(e) => {
                      const updated = compatibility.map((c) =>
                        c.source === entry.source && c.target === entry.target ? { ...c, target: e.target.value } : c
                      );
                      setCompatibility(updated);
                    }}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                    placeholder="Target"
                  />
                  <select
                    value={entry.layer}
                    onChange={(e) => {
                      const updated = compatibility.map((c) =>
                        c.source === entry.source && c.target === entry.target ? { ...c, layer: e.target.value } : c
                      );
                      setCompatibility(updated);
                    }}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  >
                    {compatibilityLayers.map((layer) => (
                      <option key={layer.key} value={layer.key}>
                        {layer.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={entry.level}
                    onChange={(e) => {
                      const updated = compatibility.map((c) =>
                        c.source === entry.source && c.target === entry.target ? { ...c, level: e.target.value as 'validated' | 'compatible' | 'theoretical' } : c
                      );
                      setCompatibility(updated);
                    }}
                    className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  >
                    <option value="validated">Validated</option>
                    <option value="compatible">Compatible</option>
                    <option value="theoretical">Theoretical</option>
                  </select>
                  <button
                    onClick={() => {
                      const updated = compatibility.filter(
                        (c) => !(c.source === entry.source && c.target === entry.target)
                      );
                      setCompatibility(updated);
                    }}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ));
            })()}
          </div>

          {(() => {
            const filtered = compatibility.filter((c) => (compatLayerFilter ? c.layer === compatLayerFilter : true));
            const pageSize = 50;
            return (
              <div className="flex justify-center gap-2">
                <button
                  onClick={() => setHistoryPage(Math.max(0, historyPage - 1))}
                  disabled={historyPage === 0}
                  className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-gray-300 py-1">
                  Page {historyPage + 1} of {Math.ceil(filtered.length / pageSize)}
                </span>
                <button
                  onClick={() => setHistoryPage(Math.min(Math.ceil(filtered.length / pageSize) - 1, historyPage + 1))}
                  disabled={historyPage >= Math.ceil(filtered.length / pageSize) - 1}
                  className="px-3 py-1 bg-gray-800 text-white rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
