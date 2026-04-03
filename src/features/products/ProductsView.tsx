'use client';

import { useState, useMemo } from 'react';
import { Grid3x3, Table } from 'lucide-react';

import type { Product, IndicationKey } from '@/core/types';
import { CATEGORIES, SAMPLE_TYPE_LABELS, NUCLEIC_ACID_LABELS } from '@/core/config';
import { DEFAULT_VENDORS } from '@/core/data/vendors';

import { getTier, getRegulatoryBadge } from './helpers';
import { ProductCard, GrowthBadge } from './ProductCard';
import { ProductAnalytics } from './ProductAnalytics';

interface ProductsViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function ProductsView({ products, indicationFilter }: ProductsViewProps) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedVendors, setSelectedVendors] = useState<string[]>([]);
  const [searchText, setSearchText] = useState('');
  const [sortField, setSortField] = useState<'tier' | 'share' | 'pricing' | 'name'>('tier');
  const [viewStyle, setViewStyle] = useState<'grid' | 'table'>('grid');
  const [selectedSampleTypes, setSelectedSampleTypes] = useState<string[]>([]);
  const [selectedNucleicAcids, setSelectedNucleicAcids] = useState<string[]>([]);

  const filteredAndSortedProducts = useMemo(() => {
    let result = [...products];
    if (indicationFilter.length > 0) {
      result = result.filter((p) => p.indications.some((ind) => indicationFilter.includes(ind)));
    }
    if (selectedCategories.length > 0) {
      result = result.filter((p) => selectedCategories.includes(p.category));
    }
    if (selectedVendors.length > 0) {
      result = result.filter((p) => selectedVendors.includes(p.vendor));
    }
    if (selectedSampleTypes.length > 0) {
      result = result.filter((p) => p.sampleTypes.some((st) => selectedSampleTypes.includes(st)));
    }
    if (selectedNucleicAcids.length > 0) {
      result = result.filter((p) => p.nucleicAcids.some((na) => selectedNucleicAcids.includes(na)));
    }
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.vendor.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query)
      );
    }
    result.sort((a, b) => {
      if (sortField === 'tier') {
        const tierDiff = getTier(a) - getTier(b);
        return tierDiff !== 0 ? tierDiff : b.share - a.share;
      }
      if (sortField === 'share') return b.share - a.share;
      if (sortField === 'pricing') return a.pricing - b.pricing;
      if (sortField === 'name') return a.name.localeCompare(b.name);
      return 0;
    });
    return result;
  }, [products, indicationFilter, selectedCategories, selectedVendors, searchText, sortField, selectedSampleTypes, selectedNucleicAcids]);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>, value: string) => {
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Products</h1>
          <p className="text-gray-400">Manage and analyze NGS products across categories, vendors, and indications</p>
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium mb-2">Search</label>
            <input type="text" placeholder="Search by product name, vendor, or category..." value={searchText} onChange={(e) => setSearchText(e.target.value)} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select value={sortField} onChange={(e) => setSortField(e.target.value as 'tier' | 'share' | 'pricing' | 'name')} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="tier">Tier (with share tiebreak)</option>
              <option value="share">Market Share</option>
              <option value="pricing">Pricing</option>
              <option value="name">Name</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">View</label>
            <div className="flex gap-2">
              <button onClick={() => setViewStyle('grid')} className={`flex-1 px-4 py-2 rounded-lg transition ${viewStyle === 'grid' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><Grid3x3 size={18} className="mx-auto" /></button>
              <button onClick={() => setViewStyle('table')} className={`flex-1 px-4 py-2 rounded-lg transition ${viewStyle === 'table' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}><Table size={18} className="mx-auto" /></button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <FilterCheckboxList label="Categories" items={CATEGORIES.map((c) => ({ key: c, label: c }))} selected={selectedCategories} onToggle={(v) => toggle(setSelectedCategories, v)} />
          <FilterCheckboxList label="Vendors" items={DEFAULT_VENDORS.map((v) => ({ key: v.key, label: v.label }))} selected={selectedVendors} onToggle={(v) => toggle(setSelectedVendors, v)} />
          <FilterCheckboxList label="Sample Types" items={Object.entries(SAMPLE_TYPE_LABELS).map(([k, l]) => ({ key: k, label: l }))} selected={selectedSampleTypes} onToggle={(v) => toggle(setSelectedSampleTypes, v)} />
          <FilterCheckboxList label="Nucleic Acids" items={Object.entries(NUCLEIC_ACID_LABELS).map(([k, l]) => ({ key: k, label: l }))} selected={selectedNucleicAcids} onToggle={(v) => toggle(setSelectedNucleicAcids, v)} />
        </div>

        <div className="mb-6 text-sm text-gray-400">Showing {filteredAndSortedProducts.length} of {products.length} products</div>

        {/* Grid View */}
        {viewStyle === 'grid' && (
          <div className="mb-8">
            {CATEGORIES.filter((cat) => selectedCategories.length === 0 || selectedCategories.includes(cat)).map((category) => {
              const catProducts = filteredAndSortedProducts.filter((p) => p.category === category);
              if (catProducts.length === 0) return null;
              return (
                <div key={category} className="mb-8">
                  <h2 className="text-2xl font-bold mb-4 text-blue-400">{category}</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {catProducts.map((product) => (<ProductCard key={product.id} product={product} />))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table View */}
        {viewStyle === 'table' && (
          <div className="mb-8 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Product Name</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Vendor</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Tier</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-300">Share %</th>
                  <th className="text-right px-4 py-3 font-semibold text-gray-300">Pricing</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Regulatory</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Growth</th>
                  <th className="text-left px-4 py-3 font-semibold text-gray-300">Sample Types</th>
                </tr>
              </thead>
              <tbody>
                {filteredAndSortedProducts.map((product) => {
                  const vendor = DEFAULT_VENDORS.find((v) => v.key === product.vendor);
                  return (
                    <tr key={product.id} className="border-b border-gray-800 hover:bg-gray-900/50 transition">
                      <td className="px-4 py-3 text-white font-medium">{product.name}</td>
                      <td className="px-4 py-3 text-gray-300">{vendor?.label || product.vendor}</td>
                      <td className="px-4 py-3 text-gray-300">{product.category}</td>
                      <td className="px-4 py-3 text-gray-300 font-semibold">{product.tier}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{product.share.toFixed(2)}%</td>
                      <td className="px-4 py-3 text-right text-gray-300">${product.pricing}</td>
                      <td className="px-4 py-3"><span className={`px-2 py-1 rounded text-xs font-medium ${getRegulatoryBadge(product.regulatory)}`}>{product.regulatory}</span></td>
                      <td className="px-4 py-3"><GrowthBadge growth={product.growth} /></td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex flex-wrap gap-1">
                          {product.sampleTypes.map((st) => (<span key={st} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">{SAMPLE_TYPE_LABELS[st]}</span>))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <ProductAnalytics products={filteredAndSortedProducts} />
      </div>
    </div>
  );
}

// Reusable filter checkbox list
function FilterCheckboxList({ label, items, selected, onToggle }: {
  label: string;
  items: { key: string; label: string }[];
  selected: string[];
  onToggle: (key: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-3">{label}</label>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item) => (
          <label key={item.key} className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={selected.includes(item.key)} onChange={() => onToggle(item.key)} className="w-4 h-4 bg-gray-800 border-gray-600 rounded cursor-pointer" />
            <span className="text-sm text-gray-300">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  );
}
