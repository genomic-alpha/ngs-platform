import React from 'react';
import {
  BarChart, Bar, RadarChart, Radar, CartesianGrid, XAxis, YAxis,
  Tooltip, Legend, ResponsiveContainer, PolarAngleAxis, PolarGrid,
} from 'recharts';
import { CATEGORIES } from '@/core';
import { CATEGORY_COLORS } from '@/core/config';
import type { Product, Vendor } from '@/core/types';
import { VendorCard } from './VendorCard';

interface VendorStats {
  vendor: Vendor;
  productCount: number;
  categories: Set<string>;
  share: number;
  avgPrice: number;
  growth: Record<string, number>;
}

interface OverviewTabProps {
  vendorStats: Record<string, VendorStats>;
  filteredProducts: Product[];
  expandedVendor: string | null;
  setExpandedVendor: (vendor: string | null) => void;
  searchText: string;
  setSearchText: (text: string) => void;
  selectedCategories: string[];
  setSelectedCategories: (categories: string[]) => void;
  sortField: 'share' | 'products' | 'name';
  setSortField: (field: 'share' | 'products' | 'name') => void;
  radarChartData: Array<{ category: string; value: number }>;
  tierChartData: Array<{ tier: string; share: number }>;
  sortedVendors: Vendor[];
}

export const OverviewTab: React.FC<OverviewTabProps> = ({
  vendorStats, filteredProducts, expandedVendor, setExpandedVendor,
  searchText, setSearchText, selectedCategories, setSelectedCategories,
  sortField, setSortField, radarChartData, tierChartData, sortedVendors,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Search & Sort Controls */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
        <input type="text" placeholder="Search vendors..." value={searchText} onChange={(e) => setSearchText(e.target.value)}
          style={{ flex: 1, minWidth: '200px', padding: '8px 12px', border: '1px solid #4b5563', borderRadius: '4px', fontSize: '14px', backgroundColor: '#111827', color: '#f3f4f6' }} />
        <select value={sortField} onChange={(e) => setSortField(e.target.value as 'share' | 'products' | 'name')}
          style={{ padding: '8px 12px', border: '1px solid #4b5563', borderRadius: '4px', fontSize: '14px', backgroundColor: '#111827', color: '#f3f4f6' }}>
          <option value="share">Sort by Share</option>
          <option value="products">Sort by Products</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Category Filter Buttons */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', padding: '16px', backgroundColor: '#1f2937', borderRadius: '8px' }}>
        <button onClick={() => setSelectedCategories([])}
          style={{ padding: '8px 12px', border: selectedCategories.length === 0 ? '2px solid #3b82f6' : '1px solid #4b5563', borderRadius: '4px', backgroundColor: selectedCategories.length === 0 ? 'rgba(59,130,246,0.15)' : '#111827', color: '#f3f4f6', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
          All Categories
        </button>
        {CATEGORIES.map((cat) => (
          <button key={cat} onClick={() => {
            setSelectedCategories((prev: string[]) => prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]);
          }}
            style={{ padding: '8px 12px', border: selectedCategories.includes(cat) ? `2px solid ${CATEGORY_COLORS[cat]}` : '1px solid #4b5563', borderRadius: '4px', backgroundColor: selectedCategories.includes(cat) ? `${CATEGORY_COLORS[cat]}20` : '#111827', color: '#f3f4f6', cursor: 'pointer', fontSize: '13px', fontWeight: 500 }}>
            {cat}
          </button>
        ))}
      </div>

      {/* 2-Column Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>Category Coverage (Top 8)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarChartData}>
              <PolarGrid stroke="#374151" />
              <PolarAngleAxis dataKey="category" tick={{ fontSize: 12, fill: '#9ca3af' }} />
              <Radar name="Share" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }} />
              <Legend wrapperStyle={{ color: '#d1d5db' }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div style={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px', padding: '16px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600, color: '#f3f4f6' }}>Tier Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={tierChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="tier" tick={{ fill: '#9ca3af' }} />
              <YAxis tick={{ fill: '#9ca3af' }} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', color: '#f3f4f6' }} />
              <Bar dataKey="share" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Vendor Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {sortedVendors.map((vendor) => (
          <VendorCard
            key={vendor.key}
            vendor={vendor}
            stat={vendorStats[vendor.key]}
            isExpanded={expandedVendor === vendor.key}
            onToggle={() => setExpandedVendor(expandedVendor === vendor.key ? null : vendor.key)}
            products={filteredProducts}
          />
        ))}
      </div>
    </div>
  );
};
