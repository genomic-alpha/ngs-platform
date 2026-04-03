import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { Product } from '@/core/types';
import { tooltipStyle } from './helpers';

interface ProductAnalyticsProps {
  products: Product[];
}

const REGULATORY_COLORS = [
  '#16a34a', '#22c55e', '#3b82f6', '#6366f1', '#9ca3af', '#f59e0b', '#06b6d4',
];

export function ProductAnalytics({ products }: ProductAnalyticsProps) {
  const regulatoryData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.regulatory] = (counts[p.regulatory] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  const growthData = useMemo(() => {
    const counts: Record<string, number> = {};
    products.forEach((p) => {
      counts[p.growth] = (counts[p.growth] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [products]);

  const avgPriceByCategory = useMemo(() => {
    const categoryPrices: Record<string, { total: number; count: number }> = {};
    products.forEach((p) => {
      if (!categoryPrices[p.category]) {
        categoryPrices[p.category] = { total: 0, count: 0 };
      }
      categoryPrices[p.category].total += p.pricing;
      categoryPrices[p.category].count += 1;
    });
    return Object.entries(categoryPrices)
      .map(([name, { total, count }]) => ({
        name,
        value: Math.round((total / count) * 100) / 100,
      }))
      .sort((a, b) => b.value - a.value);
  }, [products]);

  return (
    <div className="mt-12 mb-8">
      <h2 className="text-2xl font-bold mb-6 text-blue-400">Analytics</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Regulatory Status Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Regulatory Status Distribution</h3>
          {regulatoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={regulatoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {regulatoryData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={REGULATORY_COLORS[index % REGULATORY_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Growth Status Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Growth Status Distribution</h3>
          {growthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={growthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data available</p>
          )}
        </div>

        {/* Average Price by Category Chart */}
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Avg Price by Category</h3>
          {avgPriceByCategory.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={avgPriceByCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9ca3af" />
                <Tooltip contentStyle={tooltipStyle} formatter={(value) => `$${value}`} />
                <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-400 text-center py-12">No data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
