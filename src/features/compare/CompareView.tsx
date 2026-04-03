'use client';

import type { IndicationKey, Product } from '@/core/types';
import { CATEGORIES } from '@/core/config';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import { useData } from '@/store';
import { GrowthBadge } from '@/components/ui/GrowthBadge';
import { getRegulatoryBadge } from '@/components/ui/helpers';
import { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  RadarChart,
  Radar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CompareViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function CompareView({ products, indicationFilter }: CompareViewProps) {
  const { vendors: contextVendors } = useData();
  const vendors = contextVendors.length > 0 ? contextVendors : DEFAULT_VENDORS;

  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortField] = useState<'share'>('share');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  // Filter products by indication
  const allProducts = useMemo(() => {
    if (indicationFilter.length === 0) return products;
    return products.filter((p) => p.indications.some((ind) => indicationFilter.includes(ind)));
  }, [products, indicationFilter]);

  // Get unique vendors from filtered products
  const availableVendors = useMemo(() => {
    const vendorKeys = Array.from(new Set(allProducts.map((p) => p.vendor)));
    return vendorKeys
      .map((key) => vendors.find((v) => v.key === key))
      .filter(Boolean)
      .sort((a, b) => a!.label.localeCompare(b!.label)) as typeof vendors;
  }, [allProducts, vendors]);

  // Get available categories
  const availableCategories = useMemo(() => {
    return Array.from(new Set(allProducts.map((p) => p.category))).sort();
  }, [allProducts]);

  // Filter products by selected vendors and categories
  const filteredProducts = useMemo(() => {
    let filtered = allProducts;
    if (selectedVendors.length > 0) {
      filtered = filtered.filter((p) => selectedVendors.includes(p.vendor));
    }
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((p) => selectedCategories.includes(p.category));
    }
    return filtered.sort((a, b) => {
      const aVal = a[sortField as keyof Product] as number;
      const bVal = b[sortField as keyof Product] as number;
      return sortDir === 'desc' ? bVal - aVal : aVal - bVal;
    });
  }, [allProducts, selectedVendors, selectedCategories, sortField, sortDir]);

  const toggleVendor = (vendorKey: string) => {
    setSelectedVendors((prev) => (prev.includes(vendorKey) ? prev.filter((v) => v !== vendorKey) : [...prev, vendorKey]));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => (prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]));
  };

  const toggleSort = () => {
    setSortDir((prev) => (prev === 'desc' ? 'asc' : 'desc'));
  };

  // Summary statistics
  const statsData = useMemo(
    () => ({
      productCount: filteredProducts.length,
      vendorCount: new Set(filteredProducts.map((p) => p.vendor)).size,
      avgShare: filteredProducts.length > 0 ? (filteredProducts.reduce((sum, p) => sum + p.share, 0) / filteredProducts.length).toFixed(1) : '0',
      iVDClearedCount: filteredProducts.filter((p) => p.regulatory.includes('FDA') || p.regulatory.includes('CE-IVD')).length,
    }),
    [filteredProducts]
  );

  // Chart data
  const vendorChartData = useMemo(() => {
    const map: Record<string, { vendor: string; share: number; products: number; avgPrice: number }> = {};
    filteredProducts.forEach((p) => {
      if (!map[p.vendor]) {
        map[p.vendor] = { vendor: vendors.find((v) => v.key === p.vendor)?.label || p.vendor, share: 0, products: 0, avgPrice: 0 };
      }
      map[p.vendor].share += p.share;
      map[p.vendor].products += 1;
      map[p.vendor].avgPrice += p.pricing;
    });
    return Object.values(map).map((item) => ({
      ...item,
      avgPrice: item.avgPrice / item.products,
    }));
  }, [filteredProducts, vendors]);

  const scatterData = useMemo(
    () =>
      filteredProducts.map((p) => ({
        x: p.share,
        y: p.pricing,
        z: p.share * 10,
        vendor: vendors.find((v) => v.key === p.vendor)?.label || p.vendor,
        name: p.name,
      })),
    [filteredProducts, vendors]
  );

  const radarData = useMemo(() => {
    const topVendors = Array.from(new Set(filteredProducts.map((p) => p.vendor))).slice(0, 6);
    const categoryTotals: Record<string, Record<string, number>> = {};
    CATEGORIES.forEach((cat) => {
      categoryTotals[cat] = {};
      topVendors.forEach((v) => {
        categoryTotals[cat][v] = filteredProducts.filter((p) => p.category === cat && p.vendor === v).length;
      });
    });
    return CATEGORIES.map((cat) => ({ category: cat, ...categoryTotals[cat] }));
  }, [filteredProducts]);

  const regulatoryData = useMemo(() => {
    const map: Record<string, { vendor: string; IVD: number; RUO: number; Service: number }> = {};
    filteredProducts.forEach((p) => {
      if (!map[p.vendor]) {
        const vendorLabel = vendors.find((v) => v.key === p.vendor)?.label || p.vendor;
        map[p.vendor] = { vendor: vendorLabel, IVD: 0, RUO: 0, Service: 0 };
      }
      if (p.regulatory.includes('FDA') || p.regulatory.includes('CE-IVD')) {
        map[p.vendor].IVD += 1;
      } else if (p.regulatory === 'RUO') {
        map[p.vendor].RUO += 1;
      } else {
        map[p.vendor].Service += 1;
      }
    });
    return Object.values(map);
  }, [filteredProducts, vendors]);

  return (
    <div className="space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Compare Products</h1>
        <p className="text-gray-400">Analyze product portfolios across vendors, categories, and regulatory status.</p>
      </div>

      {/* Filter by Workflow Step */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Filter by Workflow Step</h2>
        <div className="flex flex-wrap gap-2">
          {availableCategories.map((cat) => {
            const count = allProducts.filter((p) => p.category === cat).length;
            const isSelected = selectedCategories.includes(cat);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                  isSelected ? 'bg-blue-500 text-white' : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Filter by Vendor */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Filter by Vendor</h2>
        <div className="flex flex-wrap gap-3">
          {availableVendors.map((vendor) => {
            const isSelected = selectedVendors.includes(vendor.key);
            return (
              <button
                key={vendor.key}
                onClick={() => toggleVendor(vendor.key)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                  isSelected ? 'bg-gray-900 ring-2' : 'bg-gray-800 hover:bg-gray-700'
                }`}
                style={{ ringColor: isSelected ? vendor.color : undefined }}
              >
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: vendor.color }} />
                {vendor.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Products</p>
          <p className="text-3xl font-bold text-white">{statsData.productCount}</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Vendors</p>
          <p className="text-3xl font-bold text-white">{statsData.vendorCount}</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">Avg Share</p>
          <p className="text-3xl font-bold text-white">{statsData.avgShare}%</p>
        </div>
        <div className="p-6 border border-gray-700 rounded-lg bg-gray-900/50">
          <p className="text-gray-400 text-sm mb-2">IVD Cleared</p>
          <p className="text-3xl font-bold text-white">{statsData.iVDClearedCount}</p>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Market Share by Vendor */}
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Market Share by Vendor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={vendorChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis type="category" dataKey="vendor" width={120} />
              <Tooltip />
              <Bar dataKey="share" fill="#3b82f6" radius={[0, 8, 8, 0]}>
                {vendorChartData.map((item, idx) => (
                  <Cell key={idx} fill={vendors.find((v) => v.label === item.vendor)?.color || '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Price vs Share Scatter */}
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Price vs Market Share</h3>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" dataKey="x" name="Share %" />
              <YAxis type="number" dataKey="y" name="Price ($)" />
              <Tooltip cursor={{ strokeDasharray: '3 3' }} />
              <Scatter data={scatterData} fill="#3b82f6" />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Extended Analytics */}
      <div className="grid grid-cols-2 gap-6">
        {/* Regulatory Status by Vendor */}
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Regulatory Status by Vendor</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={regulatoryData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="vendor" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="IVD" fill="#22c55e" stackId="a" />
              <Bar dataKey="RUO" fill="#9ca3af" stackId="a" />
              <Bar dataKey="Service" fill="#3b82f6" stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Regional Footprint */}
        <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50">
          <h3 className="text-lg font-semibold text-white mb-4">Top Vendors by Category</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              <Radar name="Vendor Count" dataKey="A" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
              <Legend />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="border border-gray-700 rounded-lg p-6 bg-gray-900/50 overflow-x-auto">
        <h3 className="text-lg font-semibold text-white mb-4">Product Comparison</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-600">
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Product</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Vendor</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Category</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Tier</th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">
                <button onClick={toggleSort} className="flex items-center gap-1 hover:text-white transition">
                  Share %
                  {sortDir === 'desc' ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
                </button>
              </th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">Price ($)</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Regulatory</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Growth</th>
              <th className="text-right py-3 px-4 text-gray-400 font-semibold">Samples</th>
              <th className="text-left py-3 px-4 text-gray-400 font-semibold">Indications</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => {
              const vendor = vendors.find((v) => v.key === product.vendor);
              return (
                <tr key={product.id} className="border-b border-gray-700 hover:bg-gray-800/50 transition">
                  <td className="py-3 px-4 text-white font-medium">{product.name}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vendor?.color }} />
                      <span className="text-gray-300">{vendor?.label}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-gray-300">{product.category}</td>
                  <td className="py-3 px-4 text-gray-300 font-semibold">{product.tier}</td>
                  <td className="py-3 px-4 text-right text-gray-300">{product.share.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right text-gray-300">${product.pricing}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getRegulatoryBadge(product.regulatory)}`}>{product.regulatory}</span>
                  </td>
                  <td className="py-3 px-4">
                    <GrowthBadge growth={product.growth} />
                  </td>
                  <td className="py-3 px-4 text-right text-gray-300">{product.sampleTypes.length}</td>
                  <td className="py-3 px-4 text-gray-300 text-xs">{product.indications.join(', ')}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
