import React from 'react';
import {
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Shield } from 'lucide-react';
import type { Vendor } from '@/core/types';

interface VendorStats {
  vendor: Vendor;
  productCount: number;
  categories: Set<string>;
  share: number;
  avgPrice: number;
  growth: Record<string, number>;
}

interface CompetitiveTabProps {
  vendorStats: Record<string, VendorStats>;
  libPrepDxChartData: Array<{
    vendor: string;
    'Library Prep': number;
    'Dx Market': number;
  }>;
  indicationCoverageData: Array<Record<string, number | string>>;
  sortedVendors: Vendor[];
}

export const CompetitiveTab: React.FC<CompetitiveTabProps> = ({
  vendorStats,
  libPrepDxChartData,
  indicationCoverageData,
  sortedVendors,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Archer/IDT Context Banner */}
      <div
        style={{
          backgroundColor: '#eff6ff',
          border: '1px solid #93c5fd',
          borderRadius: '8px',
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <Shield size={24} style={{ color: '#3b82f6', flexShrink: 0 }} />
        <div style={{ fontSize: '13px', color: '#1e40af' }}>
          <strong>Archer/IDT Context:</strong> Archer (Danaher subsidiary) excels in fusion detection
          with AMP technology; IDT (Swift Biosciences) provides xGen probes. Both are integrated into
          Danaher's genomics ecosystem.
        </div>
      </div>

      {/* 2-Column Charts */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '20px',
        }}
      >
        {/* Library Prep + Dx Market Share */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
            Library Prep + Dx Market Share
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={libPrepDxChartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="vendor" type="category" width={100} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="Library Prep" fill="#3b82f6" />
              <Bar dataKey="Dx Market" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Indication Coverage Depth */}
        <div
          style={{
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            padding: '16px',
          }}
        >
          <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
            Indication Coverage Depth (Top 5)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={indicationCoverageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="indication" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="illumina" fill="#3b82f6" />
              <Bar dataKey="roche" fill="#ef4444" />
              <Bar dataKey="thermo" fill="#10b981" />
              <Bar dataKey="qiagen" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Head-to-Head Comparison Table */}
      <div
        style={{
          backgroundColor: '#fff',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '16px',
        }}
      >
        <h3 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: 600 }}>
          Head-to-Head Comparison (Top 12 Vendors)
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '12px',
            }}
          >
            <thead>
              <tr style={{ borderBottom: '2px solid #e5e7eb', backgroundColor: '#f9fafb' }}>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Vendor
                </th>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Products
                </th>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Total Share
                </th>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Avg Price
                </th>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'center',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Categories
                </th>
                <th
                  style={{
                    padding: '12px 8px',
                    textAlign: 'left',
                    fontWeight: 600,
                    color: '#6b7280',
                    whiteSpace: 'nowrap',
                  }}
                >
                  Key Strength
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedVendors.slice(0, 12).map((vendor, idx) => {
                const stat = vendorStats[vendor.key];
                return (
                  <tr
                    key={vendor.key}
                    style={{
                      borderBottom: '1px solid #e5e7eb',
                      backgroundColor: idx % 2 === 0 ? '#fff' : '#f9fafb',
                    }}
                  >
                    <td style={{ padding: '12px 8px', fontWeight: 500 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div
                          style={{
                            width: '16px',
                            height: '16px',
                            borderRadius: '2px',
                            backgroundColor: vendor.color,
                          }}
                        />
                        {vendor.label}
                      </div>
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      {stat.productCount}
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center', fontWeight: 500 }}>
                      {stat.share.toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 8px', textAlign: 'center' }}>
                      ${stat.avgPrice.toFixed(0)}
                    </td>
                    <td
                      style={{
                        padding: '12px 8px',
                        textAlign: 'center',
                        fontSize: '11px',
                        color: '#6b7280',
                      }}
                    >
                      {stat.categories.size}
                    </td>
                    <td style={{ padding: '12px 8px', fontSize: '11px', color: '#6b7280' }}>
                      {vendor.strength.substring(0, 40)}...
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
