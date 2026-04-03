'use client';

import type { Product } from '@/core/types';
import { SAMPLE_TYPE_LABELS, NUCLEIC_ACID_LABELS } from '@/core/config';
import { DEFAULT_VENDORS } from '@/core/data/vendors';
import { getRegulatoryBadge } from './helpers';

// ============================================
// GROWTH BADGE COMPONENT
// ============================================

interface GrowthBadgeProps {
  growth: string;
}

export function GrowthBadge({ growth }: GrowthBadgeProps) {
  const colors: Record<string, string> = {
    growing: 'text-green-400',
    stable: 'text-blue-400',
    declining: 'text-red-400',
    emerging: 'text-yellow-400',
    'pre-launch': 'text-purple-400',
  };
  return (
    <span className={`text-xs font-medium ${colors[growth] || 'text-gray-400'}`}>
      {growth}
    </span>
  );
}

// ============================================
// PRODUCT CARD COMPONENT
// ============================================

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const vendor = DEFAULT_VENDORS.find((v) => v.key === product.vendor);

  return (
    <div className="p-4 border border-gray-700 rounded-lg bg-gray-900/50 hover:bg-gray-900 transition">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-white">{product.name}</h3>
          <p className="text-sm text-gray-400">{vendor?.label || product.vendor}</p>
        </div>
        <span
          className={`px-2 py-1 rounded text-xs font-bold ${getRegulatoryBadge(
            product.regulatory
          )}`}
        >
          {product.regulatory}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs">Tier</p>
          <p className="font-semibold text-white">{product.tier}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Share</p>
          <p className="font-semibold text-white">{product.share.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Pricing</p>
          <p className="font-semibold text-white">${product.pricing}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs">Growth</p>
          <GrowthBadge growth={product.growth} />
        </div>
      </div>

      <div className="flex flex-wrap gap-1 mb-3">
        {product.sampleTypes.map((st) => (
          <span key={st} className="px-2 py-1 bg-gray-800 text-gray-300 rounded text-xs">
            {SAMPLE_TYPE_LABELS[st]}
          </span>
        ))}
        {product.nucleicAcids.map((na) => (
          <span key={na} className="px-2 py-1 bg-gray-700 text-gray-200 rounded text-xs">
            {NUCLEIC_ACID_LABELS[na]}
          </span>
        ))}
      </div>

      <div className="text-xs text-gray-400">
        <p>Category: {product.category}</p>
      </div>
    </div>
  );
}
