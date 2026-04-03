import { useMemo, useState } from 'react';
import type { Product, IndicationKey } from '@/core/types';
import { DEFAULT_VENDORS } from '@/core';
import { useData } from '@/store';

// ============================================
// Types
// ============================================

interface ScenarioAdjustment {
  id: number;
  productId: string;
  parameter: 'share' | 'pricing';
  originalValue: number;
  newValue: number;
  change: number;
}

interface SavedScenario {
  id: string;
  name: string;
  description: string;
  adjustments: ScenarioAdjustment[];
  isShared: boolean;
  createdAt: string;
}

interface ScenarioViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

const PREBUILT_SCENARIOS = [
  { name: 'Element Disrupts Mid-Throughput', desc: '+8% share from Illumina mid-range', items: [{ pid: 'element-aviti', param: 'share' as const, delta: 8 }] },
  { name: 'MGI US Market Entry', desc: '+6% share from competitive pricing', items: [{ pid: 'mgi-dnbseq-g99', param: 'share' as const, delta: 6 }] },
  { name: 'Roche Avenio CDx Approval', desc: '+5% liquid biopsy share', items: [{ pid: 'guardant-guardian360', param: 'share' as const, delta: 5 }] },
  { name: 'Long-Read Revolution', desc: 'PacBio + Oxford +10% combined', items: [{ pid: 'pacbio-revio', param: 'share' as const, delta: 5 }, { pid: 'oxford-promethion', param: 'share' as const, delta: 5 }] },
];

// ============================================
// Component
// ============================================

export function ScenarioView({ products, indicationFilter: _indicationFilter }: ScenarioViewProps) {
  const [scenarioName, setScenarioName] = useState('');
  const [scenarioDesc, setScenarioDesc] = useState('');
  const [adjustments, setAdjustments] = useState<ScenarioAdjustment[]>([]);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([]);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [selectedParam, setSelectedParam] = useState<'share' | 'pricing'>('share');
  const [adjustmentValue, setAdjustmentValue] = useState(0);
  const { vendors = DEFAULT_VENDORS } = useData();

  const applyPrebuilt = (preset: typeof PREBUILT_SCENARIOS[0]) => {
    const newAdj = preset.items.map((item) => {
      const p = products.find((pr) => pr.id === item.pid);
      if (!p) return null;
      const orig = item.param === 'share' ? p.share : p.pricing;
      return { id: Date.now() + Math.random(), productId: item.pid, parameter: item.param, originalValue: orig, newValue: orig + item.delta, change: item.delta } as ScenarioAdjustment;
    }).filter(Boolean) as ScenarioAdjustment[];
    setAdjustments((prev) => [...prev, ...newAdj]);
    if (!scenarioName) setScenarioName(preset.name);
  };

  const addCustom = () => {
    if (!selectedProduct || adjustmentValue === 0) return;
    const p = products.find((pr) => pr.id === selectedProduct);
    if (!p) return;
    const orig = selectedParam === 'share' ? p.share : p.pricing;
    setAdjustments((prev) => [...prev, { id: Date.now(), productId: selectedProduct, parameter: selectedParam, originalValue: orig, newValue: orig + adjustmentValue, change: adjustmentValue }]);
    setSelectedProduct(null);
    setAdjustmentValue(0);
  };

  const removeAdj = (id: number) => setAdjustments((prev) => prev.filter((a) => a.id !== id));

  const saveScenario = () => {
    if (!scenarioName || adjustments.length === 0) return;
    setSavedScenarios((prev) => [...prev, { id: crypto.randomUUID(), name: scenarioName, description: scenarioDesc, adjustments: [...adjustments], isShared: false, createdAt: new Date().toISOString() }]);
    setScenarioName('');
    setScenarioDesc('');
    setAdjustments([]);
  };

  const loadScenario = (s: SavedScenario) => { setScenarioName(s.name); setScenarioDesc(s.description); setAdjustments([...s.adjustments]); };
  const deleteScenario = (id: string) => { setSavedScenarios((prev) => prev.filter((s) => s.id !== id)); setCompareIds((prev) => prev.filter((c) => c !== id)); };
  const toggleCompare = (id: string) => setCompareIds((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : prev.length >= 3 ? prev : [...prev, id]);

  const scenariosToCompare = useMemo(() => savedScenarios.filter((s) => compareIds.includes(s.id)), [savedScenarios, compareIds]);

  const impactSummary = useMemo(() => {
    const map = new Map<string, { product: Product | undefined; shareChange: number; pricingChange: number }>();
    for (const a of adjustments) {
      const p = products.find((pr) => pr.id === a.productId);
      const e = map.get(a.productId) || { product: p, shareChange: 0, pricingChange: 0 };
      if (a.parameter === 'share') e.shareChange += a.change;
      if (a.parameter === 'pricing') e.pricingChange += a.change;
      map.set(a.productId, e);
    }
    return [...map.values()];
  }, [adjustments, products]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Scenario Modeling & What-If Analysis</h2>
          <p className="mt-1 text-sm text-gray-400">Build, save, and compare market scenarios</p>
        </div>
        {savedScenarios.length >= 2 && (
          <button onClick={() => setShowCompare(!showCompare)} className="px-4 py-2 bg-purple-600 text-white text-sm font-semibold rounded-lg hover:bg-purple-700 transition-colors">
            {showCompare ? 'Hide Comparison' : `Compare (${compareIds.length}/3)`}
          </button>
        )}
      </div>

      {/* Scenario Name */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Scenario Name</label>
          <input type="text" value={scenarioName} onChange={(e) => setScenarioName(e.target.value)} placeholder="e.g., Element Disruption 2027" className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Description</label>
          <input type="text" value={scenarioDesc} onChange={(e) => setScenarioDesc(e.target.value)} placeholder="Brief description..." className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>

      {/* Quick Templates */}
      <div>
        <h3 className="mb-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Quick Templates</h3>
        <div className="grid grid-cols-4 gap-3">
          {PREBUILT_SCENARIOS.map((s) => (
            <button key={s.name} onClick={() => applyPrebuilt(s)} className="p-3 bg-gray-800 border border-gray-700 rounded-lg hover:border-blue-500 transition-all text-left group">
              <h4 className="text-sm font-semibold text-white group-hover:text-blue-400 transition-colors">{s.name}</h4>
              <p className="text-xs text-gray-500 mt-1">{s.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Adjustment Builder */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Custom Adjustment</h3>
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-gray-400 mb-1">Product</label>
            <select value={selectedProduct || ''} onChange={(e) => setSelectedProduct(e.target.value || null)} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="">Choose product...</option>
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.vendor})</option>)}
            </select>
          </div>
          <div className="w-32">
            <label className="block text-xs text-gray-400 mb-1">Parameter</label>
            <select value={selectedParam} onChange={(e) => setSelectedParam(e.target.value as 'share' | 'pricing')} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm">
              <option value="share">Market Share</option>
              <option value="pricing">Pricing</option>
            </select>
          </div>
          <div className="w-40">
            <label className="block text-xs text-gray-400 mb-1">Change: <span className="text-blue-400">{adjustmentValue > 0 ? '+' : ''}{adjustmentValue}{selectedParam === 'share' ? '%' : '$'}</span></label>
            <input type="range" min={selectedParam === 'share' ? -20 : -500} max={selectedParam === 'share' ? 20 : 500} step={selectedParam === 'share' ? 0.5 : 10} value={adjustmentValue} onChange={(e) => setAdjustmentValue(parseFloat(e.target.value))} className="w-full" />
          </div>
          <button onClick={addCustom} disabled={!selectedProduct || adjustmentValue === 0} className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Add</button>
        </div>
      </div>

      {/* Active Adjustments */}
      {adjustments.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Active Adjustments ({adjustments.length})</h3>
            <button onClick={saveScenario} disabled={!scenarioName} className="px-4 py-1.5 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors">Save Scenario</button>
          </div>
          <div className="space-y-2">
            {adjustments.map((adj) => {
              const product = products.find((p) => p.id === adj.productId);
              const vendor = vendors.find((v) => v.key === product?.vendor);
              return (
                <div key={adj.id} className="flex items-center justify-between bg-gray-800 p-3 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: vendor?.color || '#6b7280' }} />
                    <div>
                      <p className="text-sm font-medium text-white">{product?.name || adj.productId}</p>
                      <p className="text-xs text-gray-500">{adj.parameter}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-baseline gap-2 text-sm">
                      <span className="text-gray-500 line-through">{adj.originalValue.toFixed(1)}</span>
                      <span className="text-white font-medium">{adj.newValue.toFixed(1)}</span>
                      <span className={`font-semibold ${adj.change > 0 ? 'text-green-400' : 'text-red-400'}`}>{adj.change > 0 ? '+' : ''}{adj.change.toFixed(1)}{adj.parameter === 'share' ? '%' : '$'}</span>
                    </div>
                    <button onClick={() => removeAdj(adj.id)} className="text-gray-500 hover:text-red-400 text-sm transition-colors">Remove</button>
                  </div>
                </div>
              );
            })}
          </div>
          {impactSummary.length > 0 && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-700/50 p-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Net Impact</h4>
              <div className="grid grid-cols-4 gap-3">
                {impactSummary.map((item) => (
                  <div key={item.product?.id} className="text-center">
                    <p className="text-xs text-gray-400 truncate">{item.product?.name}</p>
                    {item.shareChange !== 0 && <p className={`text-sm font-bold ${item.shareChange > 0 ? 'text-green-400' : 'text-red-400'}`}>{item.shareChange > 0 ? '+' : ''}{item.shareChange.toFixed(1)}% share</p>}
                    {item.pricingChange !== 0 && <p className={`text-sm font-bold ${item.pricingChange > 0 ? 'text-green-400' : 'text-red-400'}`}>{item.pricingChange > 0 ? '+$' : '-$'}{Math.abs(item.pricingChange).toFixed(0)}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Saved Scenarios ({savedScenarios.length})</h3>
          <div className="grid grid-cols-3 gap-3">
            {savedScenarios.map((sc) => (
              <div key={sc.id} className={`bg-gray-800 rounded-lg border p-4 ${compareIds.includes(sc.id) ? 'border-purple-500' : 'border-gray-700'}`}>
                <h4 className="text-sm font-semibold text-white">{sc.name}</h4>
                {sc.description && <p className="text-xs text-gray-500 mt-0.5">{sc.description}</p>}
                <p className="text-xs text-gray-600 mt-2 mb-3">{sc.adjustments.length} adjustment(s)</p>
                <div className="flex gap-2">
                  <button onClick={() => loadScenario(sc)} className="flex-1 px-2 py-1 bg-blue-600/20 text-blue-400 text-xs font-medium rounded hover:bg-blue-600/30 transition-colors">Load</button>
                  <button onClick={() => toggleCompare(sc.id)} className={`flex-1 px-2 py-1 text-xs font-medium rounded transition-colors ${compareIds.includes(sc.id) ? 'bg-purple-600/30 text-purple-300' : 'bg-gray-700/50 text-gray-400 hover:bg-gray-700'}`}>{compareIds.includes(sc.id) ? 'Comparing' : 'Compare'}</button>
                  <button onClick={() => deleteScenario(sc.id)} className="px-2 py-1 bg-red-900/20 text-red-400 text-xs font-medium rounded hover:bg-red-900/30 transition-colors">Del</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      {showCompare && scenariosToCompare.length >= 2 && (
        <div className="bg-gray-800 rounded-lg border border-purple-500/50 p-4">
          <h3 className="text-sm font-semibold text-purple-300 mb-4">Scenario Comparison</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 pb-2 pr-4">Product</th>
                {scenariosToCompare.map((s) => <th key={s.id} className="text-center text-gray-400 pb-2 px-4">{s.name}</th>)}
              </tr>
            </thead>
            <tbody>
              {(() => {
                const pids = new Set<string>();
                scenariosToCompare.forEach((s) => s.adjustments.forEach((a) => pids.add(a.productId)));
                return [...pids].map((pid) => {
                  const prod = products.find((p) => p.id === pid);
                  return (
                    <tr key={pid} className="border-b border-gray-700/50">
                      <td className="py-2 pr-4 text-white">{prod?.name || pid}</td>
                      {scenariosToCompare.map((s) => {
                        const total = s.adjustments.filter((a) => a.productId === pid).reduce((sum, a) => sum + a.change, 0);
                        return (
                          <td key={s.id} className="py-2 px-4 text-center">
                            {total !== 0 ? <span className={`font-semibold ${total > 0 ? 'text-green-400' : 'text-red-400'}`}>{total > 0 ? '+' : ''}{total.toFixed(1)}%</span> : <span className="text-gray-600">&mdash;</span>}
                          </td>
                        );
                      })}
                    </tr>
                  );
                });
              })()}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
