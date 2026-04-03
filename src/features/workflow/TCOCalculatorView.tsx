'use client';

import type { IndicationKey, Product } from '@/core/types';
import { CATEGORIES } from '@/core/config';
import { DEFAULT_COST_COMPONENTS } from '@/core/data/costs';
import { DEFAULT_COMPATIBILITY, DEFAULT_COMPATIBILITY_LAYERS } from '@/core/data/compatibility';
import { useData } from '@/store';
import { useState, useMemo } from 'react';
import {
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Save, Trash2 } from 'lucide-react';

interface TCOCalculatorViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

interface SavedWorkflow {
  id: string;
  name: string;
  workflow: Record<string, string | null>;
  totalCost: number;
  costPerSample: number;
  timestamp: number;
}

export function TCOCalculatorView({ products, indicationFilter }: TCOCalculatorViewProps) {
  const { compatibility: contextCompat, compatibilityLayers: contextLayers, costComponents: contextCosts } = useData();
  const compatibility = contextCompat.length > 0 ? contextCompat : DEFAULT_COMPATIBILITY;
  const compatibilityLayers = contextLayers.length > 0 ? contextLayers : DEFAULT_COMPATIBILITY_LAYERS;
  const costComponents = Object.keys(contextCosts).length > 0 ? contextCosts : DEFAULT_COST_COMPONENTS;

  const [workflow, setWorkflow] = useState<Record<string, string | null>>({
    extraction: null,
    libprep: null,
    automation: null,
    sequencing: null,
    analysis: null,
    reporting: null,
  });
  const [throughput, setThroughput] = useState<number>(1);
  const [annualVolume, setAnnualVolume] = useState<number>(1000);
  const [savedWorkflows, setSavedWorkflows] = useState<SavedWorkflow[]>([]);

  const steps = useMemo(
    () => [
      { key: 'extraction', label: 'Extraction', category: 'Extraction' },
      { key: 'libprep', label: 'Library Prep', category: 'Library Prep' },
      { key: 'automation', label: 'Automation', category: 'Automation' },
      { key: 'sequencing', label: 'Sequencing', category: 'Sequencing' },
      { key: 'analysis', label: 'Analysis', category: 'Analysis' },
      { key: 'reporting', label: 'Reporting', category: 'Reporting' },
    ],
    []
  );

  const getCompatibleProducts = (stepIndex: number): Product[] => {
    const step = steps[stepIndex];
    let filtered = products.filter((p) => p.category === step.category);

    if (stepIndex > 0) {
      const prevStep = steps[stepIndex - 1];
      const prevSelection = workflow[prevStep.key];
      if (!prevSelection) return filtered;

      const layer = compatibilityLayers.find((l) => l.source === prevStep.category && l.target === step.category);
      if (!layer) return filtered;

      const compatEntries = compatibility.filter((c) => c.source === prevSelection && c.layer === layer.key);
      if (compatEntries.length === 0) return filtered;

      const compatibleIds = new Set(compatEntries.map((c) => c.target));
      return filtered.filter((p) => compatibleIds.has(p.id));
    }

    return filtered;
  };

  const getTotalCost = useMemo(() => {
    let total = 0;
    Object.values(workflow).forEach((productId) => {
      if (productId) {
        const cost = costComponents[productId];
        if (cost) {
          total += cost.total;
        }
      }
    });
    return total;
  }, [workflow, costComponents]);

  const costPerSample = useMemo(() => getTotalCost, [getTotalCost]);
  const costPerRun = useMemo(() => costPerSample * throughput, [costPerSample, throughput]);
  const totalAnnualCost = useMemo(() => costPerSample * annualVolume, [costPerSample, annualVolume]);

  const vendorSet = useMemo(() => {
    const vendors = new Set<string>();
    Object.values(workflow).forEach((productId) => {
      if (productId) {
        const product = products.find((p) => p.id === productId);
        if (product) vendors.add(product.vendor);
      }
    });
    return vendors;
  }, [workflow, products]);

  const costBreakdown = useMemo(() => {
    const breakdown: Record<string, { reagents: number; instrument: number; labor: number; qc: number }> = {};
    Object.entries(workflow).forEach(([stepKey, productId]) => {
      if (productId) {
        const cost = costComponents[productId];
        if (cost) {
          breakdown[stepKey] = {
            reagents: cost.reagents,
            instrument: cost.instrument_amortized,
            labor: cost.labor,
            qc: cost.qc,
          };
        }
      }
    });
    return breakdown;
  }, [workflow, costComponents]);

  const costBreakdownData = useMemo(() => {
    return steps.map((step) => {
      const breakdown = costBreakdown[step.key];
      return {
        name: step.label,
        reagents: breakdown?.reagents || 0,
        instrument: breakdown?.instrument || 0,
        labor: breakdown?.labor || 0,
        qc: breakdown?.qc || 0,
      };
    });
  }, [steps, costBreakdown]);

  const saveWorkflow = () => {
    const name = `Workflow ${new Date().toLocaleString()}`;
    const saved: SavedWorkflow = {
      id: Date.now().toString(),
      name,
      workflow: { ...workflow },
      totalCost: totalAnnualCost,
      costPerSample,
      timestamp: Date.now(),
    };
    setSavedWorkflows((prev) => [saved, ...prev]);
  };

  const deleteSavedWorkflow = (id: string) => {
    setSavedWorkflows((prev) => prev.filter((w) => w.id !== id));
  };

  const loadWorkflow = (w: SavedWorkflow) => {
    setWorkflow(w.workflow);
  };

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Total Cost of Ownership Calculator</h1>
        <p className="text-gray-400">Model and compare costs across different workflow configurations.</p>
      </div>

      {/* Workflow Selection */}
      <div className="grid grid-cols-6 gap-4">
        {steps.map((step, idx) => {
          const compatibleProducts = getCompatibleProducts(idx);
          const selectedId = workflow[step.key];

          return (
            <div key={step.key} className="border border-gray-700 rounded-lg p-4 bg-gray-900/50">
              <label className="block text-xs font-semibold text-gray-400 mb-2">{step.label}</label>
              <select
                value={selectedId || ''}
                onChange={(e) => setWorkflow((prev) => ({ ...prev, [step.key]: e.target.value || null }))}
                className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">Select...</option>
                {compatibleProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          );
        })}
      </div>

      {/* Cost Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Cost per Sample</p>
          <p className="text-3xl font-bold text-white">${costPerSample.toFixed(2)}</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Cost per Run</p>
          <p className="text-3xl font-bold text-white">${costPerRun.toFixed(2)}</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Annual Cost</p>
          <p className="text-3xl font-bold text-white">${(totalAnnualCost / 1000).toFixed(1)}K</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Vendors in Workflow</p>
          <p className="text-3xl font-bold text-white">{vendorSet.size}</p>
        </div>
      </div>

      {/* Input Controls */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <label className="text-sm font-semibold text-white mb-2 block">Samples per Run</label>
          <input
            type="number"
            min="1"
            value={throughput}
            onChange={(e) => setThroughput(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <label className="text-sm font-semibold text-white mb-2 block">Annual Volume</label>
          <input
            type="number"
            min="1"
            value={annualVolume}
            onChange={(e) => setAnnualVolume(Math.max(1, parseInt(e.target.value) || 1))}
            className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 flex items-end">
          <button
            onClick={saveWorkflow}
            disabled={Object.values(workflow).filter((v) => v !== null).length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded transition"
          >
            <Save className="w-4 h-4" />
            Save Workflow
          </button>
        </div>
      </div>

      {/* Cost Breakdown Chart */}
      <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
        <h3 className="text-lg font-semibold text-white mb-4">Cost Breakdown by Step</h3>
        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={costBreakdownData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="reagents" fill="#3b82f6" stackId="a" name="Reagents" />
            <Bar dataKey="instrument" fill="#10b981" stackId="a" name="Instrument" />
            <Bar dataKey="labor" fill="#f59e0b" stackId="a" name="Labor" />
            <Bar dataKey="qc" fill="#ef4444" stackId="a" name="QC" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Saved Workflows */}
      {savedWorkflows.length > 0 && (
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Saved Workflows</h3>
          <div className="grid grid-cols-1 gap-3">
            {savedWorkflows.map((w) => (
              <div key={w.id} className="p-4 border border-gray-700 rounded-lg bg-gray-800/50 flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-semibold text-white">{w.name}</p>
                  <div className="flex gap-4 text-sm text-gray-400 mt-1">
                    <span>Cost/Sample: ${w.costPerSample.toFixed(2)}</span>
                    <span>Annual: ${(w.totalCost / 1000).toFixed(1)}K</span>
                    <span>{new Date(w.timestamp).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadWorkflow(w)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition"
                  >
                    Load
                  </button>
                  <button
                    onClick={() => deleteSavedWorkflow(w.id)}
                    className="px-3 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/50 text-red-400 text-sm font-medium transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
