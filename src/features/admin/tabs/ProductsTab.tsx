import React from 'react';
import { Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { CATEGORIES, INDICATIONS } from '@/core';
import type {
  Product,
  Vendor,
  Category,
  Tier,
  GrowthStatus,
} from '@/core/types';

interface ProductsTabProps {
  products: Product[];
  setProducts: (products: Product[]) => void;
  vendors: Vendor[];
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  expandedRows: Record<string, boolean>;
  toggleRowExpand: (id: string) => void;
}

export function ProductsTab({
  products,
  setProducts,
  vendors,
  searchTerm,
  setSearchTerm,
  expandedRows,
  toggleRowExpand,
}: ProductsTabProps): React.ReactElement {
  const filtered = products.filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-4">
      <div className="flex gap-2 mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
        />
        <button
          onClick={() => {
            const newProduct: Product = {
              id: `prod-${Date.now()}`,
              vendor: vendors[0]?.key || 'unknown',
              name: 'New Product',
              category: 'Extraction',
              tier: 'B',
              share: 0,
              pricing: 0,
              regulatory: 'RUO',
              region: 'global',
              sampleTypes: [],
              nucleicAcids: [],
              regionalShare: { na: 0, we: 0, hg: 0, od: 0 },
              growth: 'stable',
              indications: [],
              indicationShare: {},
              confidence: {
                share: { level: 'unverified', source: '', date: new Date().toISOString().split('T')[0] },
                pricing: { level: 'unverified', source: '', date: new Date().toISOString().split('T')[0] },
                regulatory: { level: 'unverified', source: '', date: new Date().toISOString().split('T')[0] },
              },
            };
            setProducts([...products, newProduct]);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          <Plus size={18} />
          Add Product
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((product) => (
          <React.Fragment key={product.id}>
            <div className="bg-gray-800 rounded p-4 flex items-center gap-4">
              <button
                onClick={() => toggleRowExpand(product.id)}
                className="text-gray-400 hover:text-white"
              >
                {expandedRows[product.id] ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              <div className="flex-1 grid grid-cols-4 gap-4">
                <input
                  type="text"
                  value={product.name}
                  onChange={(e) => {
                    const updated = products.map((p) => (p.id === product.id ? { ...p, name: e.target.value } : p));
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />

                <select
                  value={product.vendor}
                  onChange={(e) => {
                    const updated = products.map((p) => (p.id === product.id ? { ...p, vendor: e.target.value } : p));
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  {vendors.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <select
                  value={product.category}
                  onChange={(e) => {
                    const updated = products.map((p) =>
                      p.id === product.id ? { ...p, category: e.target.value as Category } : p
                    );
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>

                <select
                  value={product.tier}
                  onChange={(e) => {
                    const updated = products.map((p) => (p.id === product.id ? { ...p, tier: e.target.value as Tier } : p));
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="A">Tier A</option>
                  <option value="B">Tier B</option>
                  <option value="C">Tier C</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={product.share}
                  onChange={(e) => {
                    const updated = products.map((p) =>
                      p.id === product.id ? { ...p, share: parseFloat(e.target.value) } : p
                    );
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-20"
                  placeholder="Share"
                />
                <input
                  type="number"
                  step="0.1"
                  value={product.pricing}
                  onChange={(e) => {
                    const updated = products.map((p) =>
                      p.id === product.id ? { ...p, pricing: parseFloat(e.target.value) } : p
                    );
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm w-20"
                  placeholder="Pricing"
                />
                <input
                  type="text"
                  value={product.regulatory}
                  onChange={(e) => {
                    const updated = products.map((p) =>
                      p.id === product.id ? { ...p, regulatory: e.target.value } : p
                    );
                    setProducts(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Regulatory"
                />
              </div>

              <select
                value={product.growth}
                onChange={(e) => {
                  const updated = products.map((p) => (p.id === product.id ? { ...p, growth: e.target.value as GrowthStatus } : p));
                  setProducts(updated);
                }}
                className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
              >
                <option value="growing">Growing</option>
                <option value="stable">Stable</option>
                <option value="declining">Declining</option>
                <option value="emerging">Emerging</option>
                <option value="pre-launch">Pre-Launch</option>
              </select>

              <button
                onClick={() => {
                  const updated = products.filter((p) => p.id !== product.id);
                  setProducts(updated);
                }}
                className="text-red-400 hover:text-red-300"
              >
                <Trash2 size={18} />
              </button>
            </div>

            {expandedRows[product.id] && (
              <div className="bg-gray-900 rounded p-4 ml-8 space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-400">NA Share</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.regionalShare.na}
                      onChange={(e) => {
                        const updated = products.map((p) =>
                          p.id === product.id
                            ? {
                                ...p,
                                regionalShare: { ...p.regionalShare, na: parseFloat(e.target.value) },
                              }
                            : p
                        );
                        setProducts(updated);
                      }}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">WE Share</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.regionalShare.we}
                      onChange={(e) => {
                        const updated = products.map((p) =>
                          p.id === product.id
                            ? {
                                ...p,
                                regionalShare: { ...p.regionalShare, we: parseFloat(e.target.value) },
                              }
                            : p
                        );
                        setProducts(updated);
                      }}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">HG Share</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.regionalShare.hg}
                      onChange={(e) => {
                        const updated = products.map((p) =>
                          p.id === product.id
                            ? {
                                ...p,
                                regionalShare: { ...p.regionalShare, hg: parseFloat(e.target.value) },
                              }
                            : p
                        );
                        setProducts(updated);
                      }}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400">OD Share</label>
                    <input
                      type="number"
                      step="0.1"
                      value={product.regionalShare.od}
                      onChange={(e) => {
                        const updated = products.map((p) =>
                          p.id === product.id
                            ? {
                                ...p,
                                regionalShare: { ...p.regionalShare, od: parseFloat(e.target.value) },
                              }
                            : p
                        );
                        setProducts(updated);
                      }}
                      className="w-full bg-gray-800 text-white rounded px-2 py-1 text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400">Indications</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INDICATIONS.map((indication) => (
                      <label key={indication.key} className="flex items-center gap-2 text-sm text-gray-300">
                        <input
                          type="checkbox"
                          checked={product.indications.includes(indication.key)}
                          onChange={(e) => {
                            const updated = products.map((p) => {
                              if (p.id !== product.id) return p;
                              return {
                                ...p,
                                indications: e.target.checked
                                  ? [...p.indications, indication.key]
                                  : p.indications.filter((ind) => ind !== indication.key),
                              };
                            });
                            setProducts(updated);
                          }}
                          className="rounded"
                        />
                        {indication.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
