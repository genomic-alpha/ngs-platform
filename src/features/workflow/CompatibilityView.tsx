'use client';

import type { Product, CompatibilityEntry, CompatibilityLevel } from '@/core/types';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import { DEFAULT_COMPATIBILITY, DEFAULT_COMPATIBILITY_LAYERS } from '@/core/data/compatibility';
import { useData } from '@/store';
import { WorkflowBuilder } from './WorkflowBuilder';
import { useState, useMemo } from 'react';
import { Grid3x3, Layers } from 'lucide-react';

interface CompatibilityViewProps {
  products: Product[];
}

export function CompatibilityView({ products }: CompatibilityViewProps) {
  const { vendors: contextVendors, compatibility: contextCompat, compatibilityLayers: contextLayers } = useData();
  const vendors = contextVendors.length > 0 ? contextVendors : DEFAULT_VENDORS;
  const compatibility = contextCompat.length > 0 ? contextCompat : DEFAULT_COMPATIBILITY;
  const compatibilityLayers = contextLayers.length > 0 ? contextLayers : DEFAULT_COMPATIBILITY_LAYERS;

  const [selectedLayer, setSelectedLayer] = useState<string>('ext_to_libprep');
  const [selectedDetail, setSelectedDetail] = useState<CompatibilityEntry | null>(null);
  const [viewMode, setViewMode] = useState<'matrix' | 'builder'>('matrix');
  const [hoveredCell, setHoveredCell] = useState<{ src: string; tgt: string } | null>(null);

  const currentLayer = useMemo(() => compatibilityLayers.find((l) => l.key === selectedLayer), [selectedLayer, compatibilityLayers]);

  const layerData = useMemo(() => {
    if (!currentLayer) return { sources: [], targets: [], entries: [] };
    return {
      sources: Array.from(new Set(compatibility.filter((c) => c.layer === currentLayer.key).map((c) => c.source))),
      targets: Array.from(new Set(compatibility.filter((c) => c.layer === currentLayer.key).map((c) => c.target))),
      entries: compatibility.filter((c) => c.layer === currentLayer.key),
    };
  }, [currentLayer, compatibility]);

  const getLevelColor = (level: CompatibilityLevel | string) => {
    const colors: Record<string, { bg: string; border: string; text: string }> = {
      validated: { bg: 'bg-green-900/20', border: 'border-green-600', text: 'text-green-400' },
      compatible: { bg: 'bg-blue-900/20', border: 'border-blue-600', text: 'text-blue-400' },
      theoretical: { bg: 'bg-yellow-900/20', border: 'border-yellow-600', text: 'text-yellow-400' },
      undetermined: { bg: 'bg-gray-900/20', border: 'border-gray-700', text: 'text-gray-500' },
    };
    return colors[level] || colors.undetermined;
  };

  const getProduct = (id: string): Product | undefined => products.find((p) => p.id === id);

  const getProductName = (id: string): string => {
    const product = getProduct(id);
    return product?.name || id;
  };

  const getVendor = (vendorKey: string) => vendors.find((v) => v.key === vendorKey);

  const matrixData = useMemo(() => {
    if (!currentLayer) return [];
    const matrix: Array<{ source: string; [key: string]: string | number }> = [];
    layerData.sources.forEach((src) => {
      const row: { source: string; [key: string]: string | number } = { source: src };
      layerData.targets.forEach((tgt) => {
        const entry = layerData.entries.find((e) => e.source === src && e.target === tgt);
        row[tgt] = entry?.level || 'undetermined';
      });
      matrix.push(row);
    });
    return matrix;
  }, [currentLayer, layerData]);

  const stats = useMemo(() => {
    const validatedCount = layerData.entries.filter((e) => e.level === 'validated').length;
    const compatibleCount = layerData.entries.filter((e) => e.level === 'compatible').length;
    const theoreticalCount = layerData.entries.filter((e) => e.level === 'theoretical').length;
    return {
      validated: validatedCount,
      compatible: compatibleCount,
      theoretical: theoreticalCount,
      total: layerData.entries.length,
    };
  }, [layerData]);

  const totalStats = useMemo(() => {
    const validatedCount = compatibility.filter((e) => e.level === 'validated').length;
    const compatibleCount = compatibility.filter((e) => e.level === 'compatible').length;
    const theoreticalCount = compatibility.filter((e) => e.level === 'theoretical').length;
    return {
      validated: validatedCount,
      compatible: compatibleCount,
      theoretical: theoreticalCount,
      total: compatibility.length,
    };
  }, [compatibility]);

  if (viewMode === 'builder') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('matrix')}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
          >
            <Grid3x3 className="w-4 h-4" />
            Matrix View
          </button>
        </div>
        <WorkflowBuilder products={products} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Workflow Compatibility</h1>
        <p className="text-gray-400">Analyze compatibility between workflow steps and build optimized pipelines.</p>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setViewMode('matrix')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'matrix' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <Grid3x3 className="w-4 h-4" />
          Matrix
        </button>
        <button
          onClick={() => setViewMode('builder')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'builder' ? 'bg-blue-600 text-white' : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
          }`}
        >
          <Layers className="w-4 h-4" />
          Builder
        </button>
      </div>

      {/* Global Stats */}
      <div className="grid grid-cols-5 gap-4">
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-xs mb-1">Total Entries</p>
          <p className="text-2xl font-bold text-white">{totalStats.total}</p>
        </div>
        <div className="p-4 border border-green-700/30 rounded-lg bg-green-900/10">
          <p className="text-green-400 text-xs mb-1">Validated</p>
          <p className="text-2xl font-bold text-green-400">{totalStats.validated}</p>
        </div>
        <div className="p-4 border border-blue-700/30 rounded-lg bg-blue-900/10">
          <p className="text-blue-400 text-xs mb-1">Compatible</p>
          <p className="text-2xl font-bold text-blue-400">{totalStats.compatible}</p>
        </div>
        <div className="p-4 border border-yellow-700/30 rounded-lg bg-yellow-900/10">
          <p className="text-yellow-400 text-xs mb-1">Theoretical</p>
          <p className="text-2xl font-bold text-yellow-400">{totalStats.theoretical}</p>
        </div>
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-xs mb-1">Compatibility Rate</p>
          <p className="text-2xl font-bold text-white">{((totalStats.validated + totalStats.compatible) / totalStats.total * 100).toFixed(0)}%</p>
        </div>
      </div>

      {/* Layer Tabs */}
      <div className="flex gap-2 border-b border-gray-700 flex-wrap">
        {compatibilityLayers.map((layer) => (
          <button
            key={layer.key}
            onClick={() => setSelectedLayer(layer.key)}
            className={`px-4 py-3 font-medium transition border-b-2 ${
              selectedLayer === layer.key
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-gray-400 hover:text-gray-300'
            }`}
          >
            {layer.label}
          </button>
        ))}
      </div>

      {/* Layer Stats Legend */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 border border-green-700/30 rounded-lg bg-green-900/10">
          <p className="text-green-400 text-xs mb-1">Validated</p>
          <p className="text-xl font-bold text-green-400">{stats.validated}</p>
        </div>
        <div className="p-4 border border-blue-700/30 rounded-lg bg-blue-900/10">
          <p className="text-blue-400 text-xs mb-1">Compatible</p>
          <p className="text-xl font-bold text-blue-400">{stats.compatible}</p>
        </div>
        <div className="p-4 border border-yellow-700/30 rounded-lg bg-yellow-900/10">
          <p className="text-yellow-400 text-xs mb-1">Theoretical</p>
          <p className="text-xl font-bold text-yellow-400">{stats.theoretical}</p>
        </div>
        <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-xs mb-1">Total</p>
          <p className="text-xl font-bold text-white">{stats.total}</p>
        </div>
      </div>

      {/* Compatibility Matrix */}
      <div className="border border-gray-700 rounded-lg bg-gray-900/50 overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="py-3 px-4 text-left text-gray-400 font-semibold sticky left-0 bg-gray-900">
                  {currentLayer?.source}
                </th>
                {layerData.targets.map((target) => (
                  <th key={target} className="py-3 px-4 text-center text-gray-400 font-semibold text-xs max-w-32">
                    <div className="truncate">{getProductName(target)}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {layerData.sources.map((source) => (
                <tr key={source} className="border-b border-gray-700 hover:bg-gray-800/30 transition">
                  <td className="py-3 px-4 text-gray-300 font-semibold sticky left-0 bg-gray-900/50 text-xs max-w-32">
                    {getProductName(source)}
                  </td>
                  {layerData.targets.map((target) => {
                    const entry = layerData.entries.find((e) => e.source === source && e.target === target);
                    const level = entry?.level || 'undetermined';
                    const colors = getLevelColor(level);
                    const isHovered = hoveredCell?.src === source && hoveredCell?.tgt === target;

                    return (
                      <td key={`${source}-${target}`} className="py-3 px-4">
                        <button
                          onClick={() => entry && setSelectedDetail(entry)}
                          onMouseEnter={() => setHoveredCell({ src: source, tgt: target })}
                          onMouseLeave={() => setHoveredCell(null)}
                          className={`w-full py-2 px-3 rounded text-xs font-semibold border transition ${
                            isHovered && entry ? 'ring-2 ring-white' : ''
                          } ${colors.bg} ${colors.border} border ${colors.text} ${entry ? 'cursor-pointer hover:opacity-80' : 'cursor-default opacity-60'}`}
                        >
                          {entry ? level.charAt(0).toUpperCase() + level.slice(1) : '—'}
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedDetail && (
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-2">Compatibility Details</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-gray-500">Source</p>
                  <p className="text-sm text-gray-300">{getProductName(selectedDetail.source)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Target</p>
                  <p className="text-sm text-gray-300">{getProductName(selectedDetail.target)}</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSelectedDetail(null)}
              className="text-gray-400 hover:text-white transition"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Compatibility Level</p>
              <div className={`inline-block px-3 py-1 rounded text-sm font-medium ${getLevelColor(selectedDetail.level).text} ${getLevelColor(selectedDetail.level).bg} border ${getLevelColor(selectedDetail.level).border}`}>
                {selectedDetail.level}
              </div>
            </div>
            {selectedDetail.protocol && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Protocol</p>
                <p className="text-sm text-gray-300">{selectedDetail.protocol}</p>
              </div>
            )}
          </div>
          {selectedDetail.notes && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">Notes</p>
              <p className="text-sm text-gray-300">{selectedDetail.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
