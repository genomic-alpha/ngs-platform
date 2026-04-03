import { useMemo, useState } from 'react';
import { Package, Users, Zap, Globe, Download } from 'lucide-react';
import type { Product, IndicationKey } from '@/core/types';
import { INDICATIONS } from '@/core/constants';
import { useData } from '@/store';
import { DEFAULT_INTEL_SIGNALS } from '@/core/data/signals';
import { DashboardBuilder, DEFAULT_LAYOUT } from './DashboardBuilder';
import type { DashboardLayout, WidgetId } from './DashboardBuilder';
import { MarketShareByCategory } from './charts/MarketShareByCategory';
import { TopVendorsBubble } from './charts/TopVendorsBubble';
import { SequencerLandscape } from './charts/SequencerLandscape';
import { RegionalDistribution } from './charts/RegionalDistribution';
import { GrowthDistribution } from './charts/GrowthDistribution';
import { SampleTypeBreakdown } from './charts/SampleTypeBreakdown';
import { IndicationHeatmap } from './charts/IndicationHeatmap';

interface DashboardViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function DashboardView({ products, indicationFilter }: DashboardViewProps) {
  const data = useData();
  const intelSignals = data?.intelSignals || DEFAULT_INTEL_SIGNALS;
  const [activeLayout, setActiveLayout] = useState<DashboardLayout>({ ...DEFAULT_LAYOUT });

  const filteredProducts = useMemo(() => {
    return indicationFilter.length > 0
      ? products.filter(p => p.indications?.some(ind => indicationFilter.includes(ind)))
      : products;
  }, [products, indicationFilter]);

  const stats = [
    { label: 'Total Products', value: filteredProducts.length, icon: <Package className="w-6 h-6" /> },
    { label: 'Total Vendors', value: new Set(filteredProducts.map(p => p.vendor)).size, icon: <Users className="w-6 h-6" /> },
    { label: 'Indications', value: INDICATIONS.length, icon: <Zap className="w-6 h-6" /> },
    { label: 'Avg Market Share', value: (filteredProducts.reduce((s, p) => s + (p.share || 0), 0) / filteredProducts.length).toFixed(1) + '%', icon: <Globe className="w-6 h-6" /> },
  ];

  // Widget renderer — maps WidgetId to actual chart components
  const renderWidget = (widgetId: WidgetId) => {
    switch (widgetId) {
      case 'key_metrics':
        return (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <div key={i} className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                  </div>
                  <div className="text-gray-600">{stat.icon}</div>
                </div>
              </div>
            ))}
          </div>
        );
      case 'market_share_category':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Market Share by Category & Tier</h3>
            <MarketShareByCategory products={filteredProducts} />
          </div>
        );
      case 'top_vendors':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Top Vendors by Combined Share</h3>
            <TopVendorsBubble products={filteredProducts} />
          </div>
        );
      case 'sequencer_landscape':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Product Landscape: Share vs. Cost</h3>
            <SequencerLandscape products={filteredProducts} />
          </div>
        );
      case 'regional_distribution':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Top Vendors by Region</h3>
            <RegionalDistribution products={filteredProducts} />
          </div>
        );
      case 'growth_distribution':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Growth Momentum by Vendor</h3>
            <GrowthDistribution products={filteredProducts} />
          </div>
        );
      case 'sample_type_breakdown':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-lg font-bold text-white mb-4">Pricing & Sample Intelligence</h3>
            <SampleTypeBreakdown products={filteredProducts} />
          </div>
        );
      case 'indication_heatmap':
        return <IndicationHeatmap products={filteredProducts} />;
      case 'recent_signals':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Recent Signals</h3>
            <div className="space-y-2">
              {intelSignals.filter(s => s.impact === 'high').slice(0, 5).map(signal => (
                <div key={signal.id} className="bg-gray-900 rounded p-2 text-xs border border-gray-700">
                  <div className="font-semibold text-white truncate">{signal.title.substring(0, 60)}</div>
                  <div className="text-gray-500 text-[10px] mt-1">{signal.date}</div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'regulatory_summary':
        return (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Regulatory Summary</h3>
            <div className="space-y-2 text-xs">
              {['FDA Cleared', 'CE-IVD', 'RUO', 'LDT'].map(status => {
                const count = filteredProducts.filter(p => p.regulatory === status).length;
                return (
                  <div key={status} className="flex justify-between text-gray-300">
                    <span>{status}</span>
                    <span className="font-bold text-white">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Determine grid class from layout columns
  const gridColsClass = activeLayout.columns === 4
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    : activeLayout.columns === 3
    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'
    : 'grid-cols-1 sm:grid-cols-2';

  return (
    <div className="space-y-6">
      <DashboardBuilder
        products={filteredProducts}
        indicationFilter={indicationFilter}
        onLayoutChange={setActiveLayout}
      />

      <div className="flex justify-end mb-2">
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-blue-700 text-sm">
          <Download className="w-4 h-4" />
          Export Brief
        </button>
      </div>

      {/* Dynamic Widget Grid */}
      <div className={`grid ${gridColsClass} gap-6`}>
        {activeLayout.widgets.map(widgetId => (
          <div key={widgetId} className={widgetId === 'key_metrics' || widgetId === 'indication_heatmap' ? 'col-span-full' : ''}>
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>
    </div>
  );
}
