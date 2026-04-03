import React, { useState, useRef } from 'react';
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
import { useData } from '@/store';
import type { ExpandedRows } from '@/core/types';
import {
  ProductsTab,
  VendorsPartnersTab,
  MarketDataTab,
  IntelCompatibilityTab,
  TimelineImportTab,
} from './tabs';

interface TabConfig {
  id: string;
  label: string;
}

export function AdminView(): React.ReactElement {
  const data = useData();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const {
    vendors,
    setVendors,
    products,
    setProducts,
    timelineEvents,
    setTimelineEvents,
    compatibility,
    setCompatibility,
    compatibilityLayers,
    setCompatibilityLayers,
    historicalSnapshots,
    setHistoricalSnapshots,
    marketSize,
    setMarketSize,
    intelSignals,
    setIntelSignals,
    costComponents,
    setCostComponents,
    partners,
    setPartners,
    financials,
    setFinancials,
  } = data;

  const [activeTab, setActiveTab] = useState('products');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedRows, setExpandedRows] = useState<ExpandedRows>({});
  const [currentQuarter, setCurrentQuarter] = useState('2026-Q1');
  const [compatLayerFilter, setCompatLayerFilter] = useState('');
  const [historyPage, setHistoryPage] = useState(0);
  const [vpSubTab, setVpSubTab] = useState<'vendors' | 'partners'>('vendors');
  const [mdSubTab, setMdSubTab] = useState<'sizing' | 'historical' | 'costs'>('sizing');
  const [icSubTab, setIcSubTab] = useState<'intel' | 'compatibility'>('intel');
  const [tiSubTab, setTiSubTab] = useState<'timeline' | 'importexport'>('timeline');

  const toggleRowExpand = (id: string): void => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleExport = (): void => {
    const dataToExport = {
      vendors,
      products,
      timelineEvents,
      compatibility,
      compatibilityLayers,
      historicalSnapshots,
      marketSize,
      intelSignals,
      costComponents,
      partners,
      financials,
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ngs-platform-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = (): void => {
    fileInputRef.current?.click();
  };

  const processFileUpload = (file: File): void => {
    const reader = new FileReader();
    reader.onload = (e): void => {
      try {
        const imported = JSON.parse(e.target?.result as string);
        if (imported.vendors) setVendors(imported.vendors);
        if (imported.products) setProducts(imported.products);
        if (imported.timelineEvents) setTimelineEvents(imported.timelineEvents);
        if (imported.compatibility) setCompatibility(imported.compatibility);
        if (imported.compatibilityLayers) setCompatibilityLayers(imported.compatibilityLayers);
        if (imported.historicalSnapshots) setHistoricalSnapshots(imported.historicalSnapshots);
        if (imported.marketSize) setMarketSize(imported.marketSize);
        if (imported.intelSignals) setIntelSignals(imported.intelSignals);
        if (imported.costComponents) setCostComponents(imported.costComponents);
        if (imported.partners) setPartners(imported.partners);
        if (imported.financials) setFinancials(imported.financials);
        alert('Data imported successfully');
      } catch {
        alert('Failed to import data');
      }
    };
    reader.readAsText(file);
  };

  const handleReset = (): void => {
    if (window.confirm('Reset all data to defaults? This cannot be undone.')) {
      setVendors(DEFAULT_VENDORS);
      setProducts(DEFAULT_PRODUCTS);
      setTimelineEvents(DEFAULT_TIMELINE_EVENTS);
      setCompatibility(DEFAULT_COMPATIBILITY);
      setCompatibilityLayers(DEFAULT_COMPATIBILITY_LAYERS);
      setHistoricalSnapshots(DEFAULT_HISTORICAL_SNAPSHOTS);
      setMarketSize(DEFAULT_MARKET_SIZE);
      setIntelSignals(DEFAULT_INTEL_SIGNALS);
      setCostComponents(DEFAULT_COST_COMPONENTS);
      setPartners(DEFAULT_PARTNERS);
      setFinancials(DEFAULT_FINANCIALS);
    }
  };

  const generateCodeConstants = (): void => {
    const code = `// Auto-generated constants from NGS Platform Admin
export const PRODUCTS = ${JSON.stringify(products, null, 2)};
export const VENDORS = ${JSON.stringify(vendors, null, 2)};
export const PARTNERS = ${JSON.stringify(partners, null, 2)};
export const COMPATIBILITY = ${JSON.stringify(compatibility, null, 2)};
export const TIMELINE_EVENTS = ${JSON.stringify(timelineEvents, null, 2)};
`;
    const blob = new Blob([code], { type: 'text/javascript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ngs-platform-constants.js';
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabs: TabConfig[] = [
    { id: 'products', label: 'Products' },
    { id: 'vendors-partners', label: 'Vendors & Partners' },
    { id: 'market-data', label: 'Market Data' },
    { id: 'intel-compatibility', label: 'Intel & Compatibility' },
    { id: 'timeline-import', label: 'Timeline & Import/Export' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-white text-2xl font-bold mb-4">Data Editor</h2>

        <div className="flex flex-wrap gap-2 border-b border-gray-700 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                borderBottomColor: activeTab === tab.id ? '#3b82f6' : 'transparent',
                borderBottomWidth: activeTab === tab.id ? '2px' : '0px',
              }}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab.id ? 'text-blue-400' : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        {activeTab === 'products' && (
          <ProductsTab
            products={products}
            setProducts={setProducts}
            vendors={vendors}
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            expandedRows={expandedRows}
            toggleRowExpand={toggleRowExpand}
          />
        )}

        {activeTab === 'vendors-partners' && (
          <VendorsPartnersTab
            vendors={vendors}
            setVendors={setVendors}
            partners={partners}
            setPartners={setPartners}
            activeSubTab={vpSubTab}
            setActiveSubTab={setVpSubTab}
          />
        )}

        {activeTab === 'market-data' && (
          <MarketDataTab
            marketSize={marketSize}
            setMarketSize={setMarketSize}
            historicalSnapshots={historicalSnapshots}
            setHistoricalSnapshots={setHistoricalSnapshots}
            currentQuarter={currentQuarter}
            setCurrentQuarter={setCurrentQuarter}
            products={products}
            costComponents={costComponents}
            setCostComponents={setCostComponents}
            activeSubTab={mdSubTab}
            setActiveSubTab={setMdSubTab}
          />
        )}

        {activeTab === 'intel-compatibility' && (
          <IntelCompatibilityTab
            intelSignals={intelSignals}
            setIntelSignals={setIntelSignals}
            vendors={vendors}
            compatibility={compatibility}
            setCompatibility={setCompatibility}
            compatibilityLayers={compatibilityLayers}
            compatLayerFilter={compatLayerFilter}
            setCompatLayerFilter={setCompatLayerFilter}
            historyPage={historyPage}
            setHistoryPage={setHistoryPage}
            activeSubTab={icSubTab}
            setActiveSubTab={setIcSubTab}
          />
        )}

        {activeTab === 'timeline-import' && (
          <TimelineImportTab
            timelineEvents={timelineEvents}
            setTimelineEvents={setTimelineEvents}
            vendors={vendors}
            products={products}
            partners={partners}
            compatibility={compatibility}
            intelSignals={intelSignals}
            onExport={handleExport}
            onImport={handleImport}
            onGenerateConstants={generateCodeConstants}
            onReset={handleReset}
            fileInputRef={fileInputRef}
            onFileUpload={processFileUpload}
            activeSubTab={tiSubTab}
            setActiveSubTab={setTiSubTab}
          />
        )}
      </div>
    </div>
  );
}
