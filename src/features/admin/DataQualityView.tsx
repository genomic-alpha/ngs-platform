import React, { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { AlertCircle } from 'lucide-react';
import { CATEGORIES, CONFIDENCE_COLORS } from '@/core';
import type { Product, ConfidenceLevel } from '@/core/types';

interface DataQualityViewProps {
  products: Product[];
}

interface ConfidenceCount {
  name: string;
  value: number;
  color: string;
}

interface CategoryConfidence {
  category: string;
  verified: number;
  estimated: number;
  approximate: number;
  unverified: number;
}

interface StaleDataItem {
  product: string;
  field: string;
  date: string;
  level: ConfidenceLevel;
}

export function DataQualityView({ products }: DataQualityViewProps): React.ReactElement {
  // Count confidence levels across all products
  const confData = useMemo((): ConfidenceCount[] => {
    const counts: Record<ConfidenceLevel, number> = {
      verified: 0,
      estimated: 0,
      approximate: 0,
      unverified: 0,
      low: 0,
    };

    products.forEach((product) => {
      counts[product.confidence.share.level]++;
      counts[product.confidence.pricing.level]++;
      counts[product.confidence.regulatory.level]++;
    });

    return [
      { name: 'Verified', value: counts.verified, color: CONFIDENCE_COLORS.verified },
      { name: 'Estimated', value: counts.estimated, color: CONFIDENCE_COLORS.estimated },
      { name: 'Approximate', value: counts.approximate, color: CONFIDENCE_COLORS.approximate },
      { name: 'Unverified', value: counts.unverified + counts.low, color: CONFIDENCE_COLORS.unverified },
    ];
  }, [products]);

  // Confidence by category
  const catConfData = useMemo((): CategoryConfidence[] => {
    return CATEGORIES.map((category) => {
      const catProducts = products.filter((p) => p.category === category);
      const counts: Record<ConfidenceLevel, number> = {
        verified: 0,
        estimated: 0,
        approximate: 0,
        unverified: 0,
        low: 0,
      };

      catProducts.forEach((product) => {
        counts[product.confidence.share.level]++;
        counts[product.confidence.pricing.level]++;
        counts[product.confidence.regulatory.level]++;
      });

      return {
        category,
        verified: counts.verified,
        estimated: counts.estimated,
        approximate: counts.approximate,
        unverified: counts.unverified + counts.low,
      };
    });
  }, [products]);

  // Find stale data (before Q3 2025)
  const staleData = useMemo((): StaleDataItem[] => {
    const stale: StaleDataItem[] = [];
    const staleThreshold = '2025-Q3';

    products.forEach((product) => {
      if (product.confidence.share.date < staleThreshold) {
        stale.push({
          product: product.name,
          field: 'Share',
          date: product.confidence.share.date,
          level: product.confidence.share.level,
        });
      }
      if (product.confidence.pricing.date < staleThreshold) {
        stale.push({
          product: product.name,
          field: 'Pricing',
          date: product.confidence.pricing.date,
          level: product.confidence.pricing.level,
        });
      }
      if (product.confidence.regulatory.date < staleThreshold) {
        stale.push({
          product: product.name,
          field: 'Regulatory',
          date: product.confidence.regulatory.date,
          level: product.confidence.regulatory.level,
        });
      }
    });

    return stale;
  }, [products]);

  // Quality score (weighted average)
  const qualityScore = useMemo((): number => {
    const weights: Record<ConfidenceLevel, number> = {
      verified: 100,
      estimated: 75,
      approximate: 50,
      unverified: 25,
      low: 25,
    };

    let totalScore = 0;
    let count = 0;

    products.forEach((product) => {
      totalScore += weights[product.confidence.share.level];
      totalScore += weights[product.confidence.pricing.level];
      totalScore += weights[product.confidence.regulatory.level];
      count += 3;
    });

    return count > 0 ? Math.round(totalScore / count) : 0;
  }, [products]);

  return (
    <div className="space-y-6">
      {/* Header with Score */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Quality Score Display */}
        <div
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          }}
          className="rounded-lg p-6 text-white"
        >
          <h3 className="text-sm font-medium opacity-90 mb-2">Overall Data Quality Score</h3>
          <div className="text-5xl font-bold mb-4">{qualityScore}</div>
          <p className="text-sm opacity-80">
            Based on weighted average of confidence levels across {products.length} products
          </p>
        </div>

        {/* Confidence Distribution Pie */}
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4">Confidence Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={confData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">
                {confData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} fields`} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Confidence by Category Bar Chart */}
      <div className="bg-gray-900 rounded-lg p-6">
        <h3 className="text-white font-medium mb-4">Confidence by Category</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={catConfData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis dataKey="category" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Bar dataKey="verified" stackId="a" fill={CONFIDENCE_COLORS.verified} name="Verified" />
            <Bar dataKey="estimated" stackId="a" fill={CONFIDENCE_COLORS.estimated} name="Estimated" />
            <Bar dataKey="approximate" stackId="a" fill={CONFIDENCE_COLORS.approximate} name="Approximate" />
            <Bar dataKey="unverified" stackId="a" fill={CONFIDENCE_COLORS.unverified} name="Unverified" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Stale Data Alert */}
      {staleData.length > 0 && (
        <div style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid #ef4444' }} className="rounded p-6">
          <div className="flex items-start gap-3">
            <AlertCircle size={20} style={{ color: '#ef4444', marginTop: '2px' }} />
            <div className="flex-1">
              <h3 className="font-medium text-red-200 mb-3">Stale Data Alert (before Q3 2025)</h3>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {staleData.map((item, idx) => (
                  <div key={idx} className="text-sm text-gray-300">
                    <span className="font-medium">{item.product}</span> - {item.field} ({item.date})
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {staleData.length === 0 && (
        <div className="bg-gray-900 rounded-lg p-6 text-center">
          <p className="text-gray-400">All data is current (Q3 2025 or later)</p>
        </div>
      )}
    </div>
  );
}
