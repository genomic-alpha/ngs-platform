import React, { useState, useMemo } from 'react';
import { Users, BarChart3, DollarSign } from 'lucide-react';
import { CATEGORIES, INDICATIONS, DEFAULT_VENDORS } from '@/core';
import { CATEGORY_COLORS } from '@/core/config';
import { useData } from '@/store';
import type { Product, IndicationKey, Vendor } from '@/core/types';
import { OverviewTab } from './OverviewTab';
import { CompetitiveTab } from './CompetitiveTab';
import { FinancialTab } from './FinancialTab';

interface VendorsViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

interface VendorStats {
  vendor: Vendor;
  productCount: number;
  categories: Set<string>;
  share: number;
  avgPrice: number;
  growth: Record<string, number>;
}

export const VendorsView: React.FC<VendorsViewProps> = ({ products, indicationFilter }) => {
  useData();
  const [activeTab, setActiveTab] = useState<'overview' | 'competitive' | 'financials'>(
    'overview'
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [expandedVendor, setExpandedVendor] = useState<string | null>(null);
  const [sortField, setSortField] = useState<'share' | 'products' | 'name'>('share');

  // Filter products based on indication filter
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (indicationFilter.length === 0) return true;
      return indicationFilter.some((ind) => p.indications.includes(ind));
    });
  }, [products, indicationFilter]);

  // Calculate vendor statistics
  const vendorStats = useMemo(() => {
    const stats: Record<string, VendorStats> = {};

    DEFAULT_VENDORS.forEach((vendor) => {
      stats[vendor.key] = {
        vendor,
        productCount: 0,
        categories: new Set(),
        share: 0,
        avgPrice: 0,
        growth: {},
      };
    });

    let totalPrice = 0;
    let priceCount = 0;

    filteredProducts.forEach((product) => {
      if (stats[product.vendor]) {
        stats[product.vendor].productCount += 1;
        stats[product.vendor].categories.add(product.category);
        stats[product.vendor].share += product.share;
        if (product.pricing) {
          totalPrice += product.pricing;
          priceCount += 1;
        }
      }
    });

    // Calculate average price per vendor
    if (priceCount > 0) {
      Object.values(stats).forEach((stat) => {
        const vendorProducts = filteredProducts.filter((p) => p.vendor === stat.vendor.key);
        const vendorPrices = vendorProducts.filter((p) => p.pricing > 0).map((p) => p.pricing);
        stat.avgPrice = vendorPrices.length > 0
          ? vendorPrices.reduce((a, b) => a + b) / vendorPrices.length
          : 0;
      });
    }

    return stats;
  }, [filteredProducts]);

  // Filter vendors based on search and category selection
  const filteredVendors = useMemo(() => {
    return DEFAULT_VENDORS.filter((vendor) => {
      const stat = vendorStats[vendor.key];
      const matchesSearch =
        vendor.label.toLowerCase().includes(searchText.toLowerCase()) ||
        vendor.strength.toLowerCase().includes(searchText.toLowerCase()) ||
        vendor.weakness.toLowerCase().includes(searchText.toLowerCase());

      if (selectedCategories.length === 0) {
        return matchesSearch && stat.productCount > 0;
      }

      const hasCategory = selectedCategories.some((cat) => stat.categories.has(cat));
      return matchesSearch && hasCategory;
    });
  }, [searchText, selectedCategories, vendorStats]);

  // Sort filtered vendors
  const sortedVendors = useMemo(() => {
    const sorted = [...filteredVendors];
    switch (sortField) {
      case 'share':
        return sorted.sort((a, b) => vendorStats[b.key].share - vendorStats[a.key].share);
      case 'products':
        return sorted.sort(
          (a, b) => vendorStats[b.key].productCount - vendorStats[a.key].productCount
        );
      case 'name':
        return sorted.sort((a, b) => a.label.localeCompare(b.label));
      default:
        return sorted;
    }
  }, [filteredVendors, sortField, vendorStats]);

  // Prepare radar chart data (Category Coverage - top 8 categories)
  const radarChartData = useMemo(() => {
    const categoryData: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      categoryData[cat] = 0;
    });

    filteredProducts.forEach((p) => {
      categoryData[p.category] = (categoryData[p.category] || 0) + p.share;
    });

    return CATEGORIES.slice(0, 8).map((cat) => ({
      category: cat,
      value: categoryData[cat] || 0,
    }));
  }, [filteredProducts]);

  // Prepare tier distribution chart data
  const tierChartData = useMemo(() => {
    const tierData: Record<string, number> = { A: 0, B: 0, C: 0 };
    filteredProducts.forEach((p) => {
      tierData[p.tier] = (tierData[p.tier] || 0) + p.share;
    });

    return [
      { tier: 'Tier A', share: tierData.A },
      { tier: 'Tier B', share: tierData.B },
      { tier: 'Tier C', share: tierData.C },
    ];
  }, [filteredProducts]);

  // Prepare library prep & dx market share data
  const libPrepDxChartData = useMemo(() => {
    const libPrepShare: Record<string, number> = {};
    const dxShare: Record<string, number> = {};

    filteredProducts.forEach((p) => {
      if (p.category === 'Library Prep') {
        libPrepShare[p.vendor] = (libPrepShare[p.vendor] || 0) + p.share;
      }
      if (p.category === 'Diagnostic Services') {
        dxShare[p.vendor] = (dxShare[p.vendor] || 0) + p.share;
      }
    });

    const vendors = new Set([...Object.keys(libPrepShare), ...Object.keys(dxShare)]);
    return Array.from(vendors).map((vendor) => ({
      vendor: DEFAULT_VENDORS.find((v) => v.key === vendor)?.label || vendor,
      'Library Prep': libPrepShare[vendor] || 0,
      'Dx Market': dxShare[vendor] || 0,
    }));
  }, [filteredProducts]);

  // Prepare indication coverage depth data
  const indicationCoverageData = useMemo(() => {
    const indicationData: Record<string, Record<string, number>> = {};

    INDICATIONS.forEach((ind) => {
      indicationData[ind.key] = {};
      DEFAULT_VENDORS.forEach((v) => {
        indicationData[ind.key][v.key] = 0;
      });
    });

    filteredProducts.forEach((p) => {
      p.indications.forEach((ind) => {
        if (indicationData[ind]) {
          indicationData[ind][p.vendor] = (indicationData[ind][p.vendor] || 0) + p.share;
        }
      });
    });

    return INDICATIONS.slice(0, 5).map((ind) => ({
      indication: ind.label,
      ...indicationData[ind.key],
    }));
  }, [filteredProducts]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Tab Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '0',
          borderBottom: '2px solid #374151',
          backgroundColor: '#1f2937',
          borderRadius: '8px 8px 0 0',
          overflow: 'hidden',
        }}
      >
        {['overview', 'competitive', 'financials'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as 'overview' | 'competitive' | 'financials')}
            style={{
              flex: 1,
              padding: '12px 16px',
              border: 'none',
              backgroundColor: activeTab === tab ? '#111827' : '#1f2937',
              borderBottom: activeTab === tab ? '3px solid #3b82f6' : '1px solid #374151',
              color: activeTab === tab ? '#f3f4f6' : '#9ca3af',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: activeTab === tab ? 600 : 500,
              transition: 'all 0.2s',
              textTransform: 'capitalize',
            }}
          >
            {tab === 'overview' && <Users size={16} style={{ marginRight: '6px', display: 'inline' }} />}
            {tab === 'competitive' && <BarChart3 size={16} style={{ marginRight: '6px', display: 'inline' }} />}
            {tab === 'financials' && <DollarSign size={16} style={{ marginRight: '6px', display: 'inline' }} />}
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div
        style={{
          backgroundColor: '#111827',
          borderRadius: '0 0 8px 8px',
          border: '1px solid #374151',
          padding: '20px',
        }}
      >
        {activeTab === 'overview' && (
          <OverviewTab
            vendorStats={vendorStats}
            filteredProducts={filteredProducts}
            expandedVendor={expandedVendor}
            setExpandedVendor={setExpandedVendor}
            searchText={searchText}
            setSearchText={setSearchText}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            sortField={sortField}
            setSortField={setSortField}
            radarChartData={radarChartData}
            tierChartData={tierChartData}
            sortedVendors={sortedVendors}
          />
        )}
        {activeTab === 'competitive' && (
          <CompetitiveTab
            vendorStats={vendorStats}
            libPrepDxChartData={libPrepDxChartData}
            indicationCoverageData={indicationCoverageData}
            sortedVendors={sortedVendors}
          />
        )}
        {activeTab === 'financials' && <FinancialTab />}
      </div>
    </div>
  );
};
