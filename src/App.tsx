import { useState, useMemo, useEffect, lazy, Suspense } from 'react';
import type { ViewId, IndicationKey, DataContextType } from '@/core/types';
import {
  DEFAULT_VENDORS,
  DEFAULT_PRODUCTS,
  DEFAULT_TIMELINE_EVENTS,
  DEFAULT_COMPATIBILITY,
  DEFAULT_COMPATIBILITY_LAYERS,
  DEFAULT_HISTORICAL_SNAPSHOTS,
  DEFAULT_MARKET_SIZE,
  DEFAULT_INTEL_SIGNALS,
  DEFAULT_COST_COMPONENTS,
  DEFAULT_PARTNERS,
  DEFAULT_FINANCIALS,
} from '@/core';
import { DataContext, ScenarioContext } from '@/store';
import { Sidebar } from '@/components/ui/Sidebar';
import { IndicationFilterBar } from '@/components/ui/IndicationFilterBar';
import { SkipToContent, ScreenReaderAnnouncer } from '@/components/ui/Accessibility';
import { pathToViewId, navigateToView } from '@/router';

// ============================================
// Lazy-loaded Feature Views (code splitting)
// ============================================

const DashboardView = lazy(() => import('@/features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const ProductsView = lazy(() => import('@/features/products/ProductsView').then(m => ({ default: m.ProductsView })));
const VendorsView = lazy(() => import('@/features/vendors/VendorsView').then(m => ({ default: m.VendorsView })));
const CompareView = lazy(() => import('@/features/compare/CompareView').then(m => ({ default: m.CompareView })));
const CompatibilityView = lazy(() => import('@/features/workflow/CompatibilityView').then(m => ({ default: m.CompatibilityView })));
const TCOCalculatorView = lazy(() => import('@/features/workflow/TCOCalculatorView').then(m => ({ default: m.TCOCalculatorView })));
const IndicationStrategyView = lazy(() => import('@/features/strategy/IndicationStrategyView').then(m => ({ default: m.IndicationStrategyView })));
const ScenarioView = lazy(() => import('@/features/strategy/ScenarioView').then(m => ({ default: m.ScenarioView })));
const PartnersView = lazy(() => import('@/features/strategy/PartnersView').then(m => ({ default: m.PartnersView })));
const IntelSignalsView = lazy(() => import('@/features/intelligence/IntelSignalsView').then(m => ({ default: m.IntelSignalsView })));
const RegulatoryView = lazy(() => import('@/features/intelligence/RegulatoryView').then(m => ({ default: m.RegulatoryView })));
const TimelineView = lazy(() => import('@/features/intelligence/TimelineView').then(m => ({ default: m.TimelineView })));
const DataQualityView = lazy(() => import('@/features/admin/DataQualityView').then(m => ({ default: m.DataQualityView })));
const ValidationView = lazy(() => import('@/features/admin/ValidationView').then(m => ({ default: m.ValidationView })));
const AdminView = lazy(() => import('@/features/admin/AdminView').then(m => ({ default: m.AdminView })));

// ============================================
// Loading Fallback
// ============================================

function ViewLoader() {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-gray-500">Loading view...</p>
      </div>
    </div>
  );
}

// ============================================
// App Shell
// ============================================

const VIEW_LABELS: Record<ViewId, string> = {
  dashboard: 'Dashboard',
  products: 'Products',
  vendors: 'Vendors',
  compare: 'Compare',
  compatibility: 'Compatibility',
  tco: 'TCO Calculator',
  indication: 'Indication Strategy',
  scenarios: 'Scenarios',
  partners: 'Partners',
  timeline: 'Timeline',
  signals: 'Signals',
  validation: 'Validation',
  'data quality': 'Data Quality',
  regulatory: 'Regulatory',
  admin: 'Data Editor',
};

export default function App() {
  const [activeView, setActiveView] = useState<ViewId>(() => pathToViewId(window.location.pathname));
  const [indicationFilter, setIndicationFilter] = useState<IndicationKey[]>([]);
  const [adjustments, setAdjustments] = useState<Record<string, number>>({});
  const [announcement, setAnnouncement] = useState('');

  // Sync URL with view state
  useEffect(() => {
    const handlePopState = () => {
      setActiveView(pathToViewId(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Navigate handler that updates both URL and state
  const handleSetActiveView = (view: ViewId) => {
    setActiveView(view);
    navigateToView(view);
    setAnnouncement(`Navigated to ${VIEW_LABELS[view] || view}`);
  };

  // Editable data state
  const [vendors, setVendors] = useState(DEFAULT_VENDORS);
  const [products, setProducts] = useState(DEFAULT_PRODUCTS);
  const [timelineEvents, setTimelineEvents] = useState(DEFAULT_TIMELINE_EVENTS);
  const [compatibility, setCompatibility] = useState(DEFAULT_COMPATIBILITY);
  const [compatibilityLayers, setCompatibilityLayers] = useState(DEFAULT_COMPATIBILITY_LAYERS);
  const [historicalSnapshots, setHistoricalSnapshots] = useState(DEFAULT_HISTORICAL_SNAPSHOTS);
  const [marketSize, setMarketSize] = useState(DEFAULT_MARKET_SIZE);
  const [intelSignals, setIntelSignals] = useState(DEFAULT_INTEL_SIGNALS);
  const [costComponents, setCostComponents] = useState(DEFAULT_COST_COMPONENTS);
  const [partners, setPartners] = useState(DEFAULT_PARTNERS);
  const [financials, setFinancials] = useState(DEFAULT_FINANCIALS);

  const dataContextValue = useMemo<DataContextType>(() => ({
    vendors, setVendors,
    products, setProducts,
    timelineEvents, setTimelineEvents,
    compatibility, setCompatibility,
    compatibilityLayers, setCompatibilityLayers,
    historicalSnapshots, setHistoricalSnapshots,
    marketSize, setMarketSize,
    intelSignals, setIntelSignals,
    costComponents, setCostComponents,
    partners, setPartners,
    financials, setFinancials,
  }), [vendors, products, timelineEvents, compatibility, compatibilityLayers, historicalSnapshots, marketSize, intelSignals, costComponents, partners, financials]);

  const filteredProducts = useMemo(() => {
    return indicationFilter.length > 0
      ? products.filter(p => p.indications?.some(ind => indicationFilter.includes(ind)))
      : products;
  }, [indicationFilter, products]);

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'products':
        return <ProductsView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'vendors':
        return <VendorsView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'compare':
        return <CompareView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'compatibility':
        return <CompatibilityView products={filteredProducts} />;
      case 'tco':
        return <TCOCalculatorView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'indication':
        return <IndicationStrategyView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'scenarios':
        return <ScenarioView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'signals':
        return <IntelSignalsView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'regulatory':
        return <RegulatoryView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'timeline':
        return <TimelineView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'data quality':
        return <DataQualityView products={filteredProducts} />;
      case 'partners':
        return <PartnersView products={filteredProducts} indicationFilter={indicationFilter} />;
      case 'validation':
        return <ValidationView products={filteredProducts} />;
      case 'admin':
        return <AdminView />;
      default:
        return null;
    }
  };

  return (
    <DataContext.Provider value={dataContextValue}>
      <ScenarioContext.Provider value={{ adjustments, setAdjustments }}>
        <SkipToContent />
        <ScreenReaderAnnouncer message={announcement} />
        <div className="flex min-h-screen bg-gray-950 text-white">
          <Sidebar activeView={activeView} setActiveView={handleSetActiveView} indicationFilter={indicationFilter} />
          <main id="main-content" className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto" role="main" aria-label={VIEW_LABELS[activeView] || 'Content'}>
            <IndicationFilterBar indicationFilter={indicationFilter} setIndicationFilter={setIndicationFilter} />
            <Suspense fallback={<ViewLoader />}>
              {renderView()}
            </Suspense>
          </main>
        </div>
      </ScenarioContext.Provider>
    </DataContext.Provider>
  );
}
