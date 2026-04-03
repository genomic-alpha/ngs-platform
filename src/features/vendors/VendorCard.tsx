import React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { CATEGORY_COLORS } from '@/core/config';
import type { Product, Vendor } from '@/core/types';
import { getTier, getRegulatoryBadge } from './helpers';
import { GrowthBadge } from './GrowthBadge';

interface VendorStats {
  vendor: Vendor;
  productCount: number;
  categories: Set<string>;
  share: number;
  avgPrice: number;
  growth: Record<string, number>;
}

interface VendorCardProps {
  vendor: Vendor;
  stat: VendorStats;
  isExpanded: boolean;
  onToggle: () => void;
  products: Product[];
}

const thStyle: React.CSSProperties = { padding: '8px', textAlign: 'left', fontWeight: 600, color: '#6b7280' };
const thCenter: React.CSSProperties = { ...thStyle, textAlign: 'center' };

export const VendorCard: React.FC<VendorCardProps> = ({ vendor, stat, isExpanded, onToggle, products }) => {
  const vendorProducts = products.filter((p) => p.vendor === vendor.key);

  return (
    <div style={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', cursor: 'pointer' }}>
      {/* Card Header */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '24px', height: '24px', borderRadius: '4px', backgroundColor: vendor.color, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 600 }}>{vendor.label}</h4>
            <p style={{ margin: 0, fontSize: '12px', color: '#6b7280' }}>
              {stat.productCount} products • {stat.share.toFixed(1)}% share • ${stat.avgPrice.toFixed(0)}/avg
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {Array.from(stat.categories).slice(0, 2).map((cat) => (
            <span key={cat} style={{ padding: '4px 8px', borderRadius: '4px', backgroundColor: `${CATEGORY_COLORS[cat]}20`, color: CATEGORY_COLORS[cat], fontSize: '11px', fontWeight: 500 }}>
              {cat.substring(0, 3)}
            </span>
          ))}
        </div>
        <div style={{ flexShrink: 0 }}>
          {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
        </div>
      </div>

      {/* SWOT Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e5e7eb', fontSize: '12px' }}>
        <div>
          <span style={{ fontWeight: 600, color: '#059669' }}>Strength: </span>
          <span style={{ color: '#6b7280' }}>{vendor.strength}</span>
        </div>
        <div>
          <span style={{ fontWeight: 600, color: '#dc2626' }}>Weakness: </span>
          <span style={{ color: '#6b7280' }}>{vendor.weakness}</span>
        </div>
      </div>

      {/* Expanded Product Table */}
      {isExpanded && (
        <div style={{ marginTop: '16px', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th style={thStyle}>Product</th>
                <th style={thStyle}>Category</th>
                <th style={thCenter}>Tier</th>
                <th style={thCenter}>Share</th>
                <th style={thCenter}>Regulatory</th>
                <th style={thCenter}>Growth</th>
              </tr>
            </thead>
            <tbody>
              {vendorProducts.map((product, idx) => (
                <tr key={product.id} style={{ borderBottom: '1px solid #e5e7eb', backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb' }}>
                  <td style={{ padding: '8px' }}>{product.name}</td>
                  <td style={{ padding: '8px' }}>{product.category}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{getTier(product.tier)}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}>{product.share.toFixed(1)}%</td>
                  <td style={{ padding: '8px', textAlign: 'center', fontSize: '11px' }}>{getRegulatoryBadge(product.regulatory)}</td>
                  <td style={{ padding: '8px', textAlign: 'center' }}><GrowthBadge status={product.growth} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
