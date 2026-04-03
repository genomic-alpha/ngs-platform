/**
 * Custom Dashboard Builder
 *
 * Allows users to create personalized dashboard layouts by selecting
 * which chart widgets to display and in what arrangement.
 *
 * Features:
 * - Widget library with all available chart types
 * - Grid-based layout (2/3/4 column configurations)
 * - Save/load named layouts
 * - Default layout with all 7 core charts
 */

import { useState, useMemo } from 'react';
import type { Product, IndicationKey } from '@/core/types';

// ============================================
// Types
// ============================================

export type WidgetId =
  | 'market_share_category'
  | 'top_vendors'
  | 'sequencer_landscape'
  | 'regional_distribution'
  | 'growth_distribution'
  | 'sample_type_breakdown'
  | 'indication_heatmap'
  | 'recent_signals'
  | 'key_metrics'
  | 'regulatory_summary';

export type LayoutColumns = 2 | 3 | 4;

export interface WidgetConfig {
  id: WidgetId;
  label: string;
  description: string;
  minWidth: 1 | 2; // columns the widget spans (1 = normal, 2 = wide)
  category: 'charts' | 'tables' | 'metrics';
}

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetId[];
  columns: LayoutColumns;
  createdAt: string;
}

// ============================================
// Widget Registry
// ============================================

export const WIDGET_REGISTRY: WidgetConfig[] = [
  { id: 'key_metrics', label: 'Key Metrics', description: 'TAM, vendor count, product count, CAGR', minWidth: 2, category: 'metrics' },
  { id: 'market_share_category', label: 'Market Share by Category', description: 'Stacked bar chart by category with tier segments', minWidth: 1, category: 'charts' },
  { id: 'top_vendors', label: 'Top Vendors', description: 'Horizontal bar chart of top 12 vendors by share', minWidth: 1, category: 'charts' },
  { id: 'sequencer_landscape', label: 'Sequencer Landscape', description: 'Scatter plot of pricing vs market share', minWidth: 1, category: 'charts' },
  { id: 'regional_distribution', label: 'Regional Distribution', description: 'Bar chart with region selector', minWidth: 1, category: 'charts' },
  { id: 'growth_distribution', label: 'Growth Distribution', description: 'Momentum bar chart (green/red)', minWidth: 1, category: 'charts' },
  { id: 'sample_type_breakdown', label: 'Sample Type Breakdown', description: 'Dual-view pricing bars + sample type pie', minWidth: 1, category: 'charts' },
  { id: 'indication_heatmap', label: 'Indication Heatmap', description: 'Vendor x indication grid heatmap', minWidth: 2, category: 'charts' },
  { id: 'recent_signals', label: 'Recent Signals', description: 'Latest 10 intelligence signals', minWidth: 1, category: 'tables' },
  { id: 'regulatory_summary', label: 'Regulatory Summary', description: 'Product count by regulatory status', minWidth: 1, category: 'tables' },
];

const DEFAULT_LAYOUT: DashboardLayout = {
  id: 'default',
  name: 'Default Dashboard',
  widgets: ['key_metrics', 'market_share_category', 'top_vendors', 'sequencer_landscape', 'regional_distribution', 'growth_distribution', 'sample_type_breakdown', 'indication_heatmap'],
  columns: 2,
  createdAt: new Date().toISOString(),
};

// ============================================
// Component Props
// ============================================

interface DashboardBuilderProps {
  products: Product[];
  indicationFilter: IndicationKey[];
  onLayoutChange?: (layout: DashboardLayout) => void;
}

// ============================================
// Dashboard Builder Panel
// ============================================

export function DashboardBuilder({ products: _products, indicationFilter: _indicationFilter, onLayoutChange }: DashboardBuilderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [activeLayout, setActiveLayout] = useState<DashboardLayout>({ ...DEFAULT_LAYOUT });
  const [savedLayouts, setSavedLayouts] = useState<DashboardLayout[]>([DEFAULT_LAYOUT]);
  const [layoutName, setLayoutName] = useState('');

  const availableWidgets = useMemo(() => {
    return WIDGET_REGISTRY.filter((w) => !activeLayout.widgets.includes(w.id));
  }, [activeLayout.widgets]);

  const activeWidgets = useMemo(() => {
    return activeLayout.widgets
      .map((id) => WIDGET_REGISTRY.find((w) => w.id === id))
      .filter(Boolean) as WidgetConfig[];
  }, [activeLayout.widgets]);

  const addWidget = (widgetId: WidgetId) => {
    setActiveLayout((prev) => ({
      ...prev,
      widgets: [...prev.widgets, widgetId],
    }));
  };

  const removeWidget = (widgetId: WidgetId) => {
    setActiveLayout((prev) => ({
      ...prev,
      widgets: prev.widgets.filter((w) => w !== widgetId),
    }));
  };

  const moveWidget = (index: number, direction: 'up' | 'down') => {
    setActiveLayout((prev) => {
      const newWidgets = [...prev.widgets];
      const swapIndex = direction === 'up' ? index - 1 : index + 1;
      if (swapIndex < 0 || swapIndex >= newWidgets.length) return prev;
      [newWidgets[index], newWidgets[swapIndex]] = [newWidgets[swapIndex], newWidgets[index]];
      return { ...prev, widgets: newWidgets };
    });
  };

  const setColumns = (cols: LayoutColumns) => {
    setActiveLayout((prev) => ({ ...prev, columns: cols }));
  };

  const saveLayout = () => {
    const name = layoutName || `Layout ${savedLayouts.length + 1}`;
    const layout: DashboardLayout = {
      ...activeLayout,
      id: crypto.randomUUID(),
      name,
      createdAt: new Date().toISOString(),
    };
    setSavedLayouts((prev) => [...prev, layout]);
    setLayoutName('');
    onLayoutChange?.(layout);
  };

  const loadLayout = (layout: DashboardLayout) => {
    setActiveLayout({ ...layout });
    onLayoutChange?.(layout);
  };

  const deleteLayout = (id: string) => {
    if (id === 'default') return;
    setSavedLayouts((prev) => prev.filter((l) => l.id !== id));
  };

  if (!isEditing) {
    return (
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold text-white">Dashboard</h2>
          <span className="text-sm text-gray-500">({activeLayout.name})</span>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="px-3 py-1.5 bg-gray-800 border border-gray-700 text-gray-300 text-sm rounded-lg hover:bg-gray-700 hover:text-white transition-colors"
          aria-label="Customize dashboard layout"
        >
          Customize Layout
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 bg-gray-800 rounded-lg border border-blue-500/50 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-blue-300">Dashboard Builder</h3>
        <button
          onClick={() => setIsEditing(false)}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Done Editing
        </button>
      </div>

      {/* Column selector */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-400">Columns:</span>
        {([2, 3, 4] as LayoutColumns[]).map((c) => (
          <button
            key={c}
            onClick={() => setColumns(c)}
            className={`px-3 py-1 text-xs rounded ${activeLayout.columns === c ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
            aria-pressed={activeLayout.columns === c}
          >
            {c}-col
          </button>
        ))}
      </div>

      {/* Active widgets (reorderable) */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Active Widgets ({activeWidgets.length})</p>
        <div className="space-y-1">
          {activeWidgets.map((w, i) => (
            <div key={w.id} className="flex items-center justify-between bg-gray-700/50 rounded px-3 py-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-5">{i + 1}</span>
                <span className="text-sm text-white">{w.label}</span>
                {w.minWidth === 2 && <span className="text-xs text-blue-400 bg-blue-900/30 px-1.5 py-0.5 rounded">wide</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => moveWidget(i, 'up')} disabled={i === 0} className="text-gray-500 hover:text-white disabled:opacity-30 text-xs px-1" aria-label={`Move ${w.label} up`}>Up</button>
                <button onClick={() => moveWidget(i, 'down')} disabled={i === activeWidgets.length - 1} className="text-gray-500 hover:text-white disabled:opacity-30 text-xs px-1" aria-label={`Move ${w.label} down`}>Dn</button>
                <button onClick={() => removeWidget(w.id)} className="text-red-400 hover:text-red-300 text-xs px-1 ml-2" aria-label={`Remove ${w.label}`}>Remove</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Available widgets to add */}
      {availableWidgets.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Available Widgets</p>
          <div className="flex flex-wrap gap-2">
            {availableWidgets.map((w) => (
              <button
                key={w.id}
                onClick={() => addWidget(w.id)}
                className="px-2 py-1 bg-gray-700/30 border border-gray-600/50 rounded text-xs text-gray-400 hover:text-white hover:border-blue-500 transition-colors"
              >
                + {w.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Save layout */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-700">
        <input
          type="text"
          value={layoutName}
          onChange={(e) => setLayoutName(e.target.value)}
          placeholder="Layout name..."
          className="flex-1 px-3 py-1.5 bg-gray-700 border border-gray-600 rounded text-sm text-white"
          aria-label="Layout name"
        />
        <button
          onClick={saveLayout}
          className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
        >
          Save Layout
        </button>
      </div>

      {/* Saved layouts */}
      {savedLayouts.length > 1 && (
        <div>
          <p className="text-xs text-gray-500 mb-2">Saved Layouts</p>
          <div className="flex flex-wrap gap-2">
            {savedLayouts.map((l) => (
              <div key={l.id} className="flex items-center gap-1 bg-gray-700/50 rounded px-2 py-1">
                <button onClick={() => loadLayout(l)} className="text-xs text-gray-300 hover:text-white">{l.name}</button>
                {l.id !== 'default' && (
                  <button onClick={() => deleteLayout(l.id)} className="text-red-400 hover:text-red-300 text-xs ml-1" aria-label={`Delete layout ${l.name}`}>x</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export { DEFAULT_LAYOUT };
export type { DashboardBuilderProps };
