'use client';

import type { Product } from '@/core/types';
import { CATEGORIES } from '@/core/config';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import { DEFAULT_COMPATIBILITY, DEFAULT_COMPATIBILITY_LAYERS } from '@/core/data/compatibility';
import { useData } from '@/store';
import { useState, useMemo } from 'react';
import React from 'react';
import { ChevronDown, ChevronUp, X } from 'lucide-react';

interface WorkflowBuilderProps {
  products: Product[];
}

export function WorkflowBuilder({ products }: WorkflowBuilderProps) {
  const { vendors: contextVendors, compatibility: contextCompat, compatibilityLayers: contextLayers } = useData();
  const vendors = contextVendors.length > 0 ? contextVendors : DEFAULT_VENDORS;
  const compatibility = contextCompat.length > 0 ? contextCompat : DEFAULT_COMPATIBILITY;
  const compatibilityLayers = contextLayers.length > 0 ? contextLayers : DEFAULT_COMPATIBILITY_LAYERS;

  const [selections, setSelections] = useState<Record<string, string | null>>({
    extraction: null,
    libprep: null,
    automation: null,
    sequencing: null,
    analysis: null,
    reporting: null,
  });

  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  const workflowSteps = useMemo(
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

  const getProductsForStep = (stepIndex: number): Product[] => {
    const step = workflowSteps[stepIndex];
    let filtered = products.filter((p) => p.category === step.category);

    if (stepIndex > 0) {
      const prevStep = workflowSteps[stepIndex - 1];
      const prevSelection = selections[prevStep.key];
      if (!prevSelection) return filtered;

      // Find compatible products based on compatibility layer
      const compatEntries = compatibility.filter((c) => {
        const layer = compatibilityLayers.find(
          (l) => l.source === prevStep.category && l.target === step.category
        );
        return c.source === prevSelection && layer && c.layer === layer.key;
      });

      if (compatEntries.length === 0) {
        return filtered;
      }

      const compatibleIds = new Set(compatEntries.map((c) => c.target));
      return filtered.filter((p) => compatibleIds.has(p.id));
    }

    return filtered;
  };

  const getCompatLevel = (sourceId: string, targetId: string, layerKey: string): string => {
    const entry = compatibility.find((c) => c.source === sourceId && c.target === targetId && c.layer === layerKey);
    return entry?.level || 'incompatible';
  };

  const selectProduct = (stepKey: string, productId: string | null) => {
    setSelections((prev) => ({ ...prev, [stepKey]: productId }));
  };

  const clearWorkflow = () => {
    setSelections({
      extraction: null,
      libprep: null,
      automation: null,
      sequencing: null,
      analysis: null,
      reporting: null,
    });
  };

  const toggleStep = (stepKey: string) => {
    setExpandedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(stepKey)) {
        next.delete(stepKey);
      } else {
        next.add(stepKey);
      }
      return next;
    });
  };

  const selectedProductCount = Object.values(selections).filter((s) => s !== null).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflow Builder</h2>
          <p className="text-sm text-gray-400">{selectedProductCount}/6 steps selected</p>
        </div>
        <button
          onClick={clearWorkflow}
          className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition flex items-center gap-2"
        >
          <X className="w-4 h-4" />
          Clear
        </button>
      </div>

      {/* Pipeline Summary Bar */}
      <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2">
          {workflowSteps.map((step, idx) => {
            const selectedProduct = selections[step.key];
            const product = selectedProduct ? products.find((p) => p.id === selectedProduct) : null;

            return (
              <React.Fragment key={step.key}>
                <div className="flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      selectedProduct ? 'bg-green-500 text-white' : 'bg-gray-700 text-gray-400'
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-400 mt-1">{step.label}</p>
                  {product && <p className="text-xs text-gray-300 max-w-24 truncate text-center">{product.name}</p>}
                </div>
                {idx < workflowSteps.length - 1 && <div className="flex-1 h-0.5 bg-gray-700 mx-2" />}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Workflow Steps */}
      <div className="space-y-4">
        {workflowSteps.map((step) => {
          const stepProducts = getProductsForStep(workflowSteps.indexOf(step));
          const isExpanded = expandedSteps.has(step.key);
          const selectedId = selections[step.key];

          return (
            <div key={step.key} className="border border-gray-700 rounded-lg bg-gray-900/50 overflow-hidden">
              {/* Header */}
              <button
                onClick={() => toggleStep(step.key)}
                className="w-full p-4 flex items-center justify-between hover:bg-gray-800 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-400">
                    {workflowSteps.indexOf(step) + 1}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-white">{step.label}</p>
                    {selectedId && (
                      <p className="text-xs text-gray-400">{products.find((p) => p.id === selectedId)?.name}</p>
                    )}
                  </div>
                </div>
                {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
              </button>

              {/* Content */}
              {isExpanded && (
                <div className="p-4 border-t border-gray-700 space-y-3">
                  {stepProducts.length === 0 ? (
                    <p className="text-gray-400 text-sm">No compatible products available</p>
                  ) : (
                    stepProducts.map((product) => {
                      const isSelected = selectedId === product.id;
                      const vendor = vendors.find((v) => v.key === product.vendor);

                      return (
                        <div
                          key={product.id}
                          onClick={() => selectProduct(step.key, isSelected ? null : product.id)}
                          className={`p-3 rounded-lg cursor-pointer transition border ${
                            isSelected
                              ? 'bg-blue-900/30 border-blue-500'
                              : 'bg-gray-800/50 border-gray-700 hover:bg-gray-800'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className="w-2 h-2 rounded-full mt-1" style={{ backgroundColor: vendor?.color }} />
                              <div>
                                <p className="font-semibold text-white text-sm">{product.name}</p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-300">
                                    Tier {product.tier}
                                  </span>
                                  <span className="text-xs text-gray-400">{product.share.toFixed(1)}% share</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-medium text-gray-300">
                                {getCompatLevel(selectedId || '', product.id, step.key)}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
