import { useMemo, useState } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product, Category } from '@/core/types';
import { CATEGORIES, SAMPLE_TYPE_LABELS } from '@/core/config';

interface Props {
  products: Product[];
}

const SAMPLE_TYPE_COLORS: Record<string, string> = {
  ffpe: '#ef4444',
  blood: '#f59e0b',
  cfdna: '#3b82f6',
  tissue: '#8b5cf6',
  saliva: '#06b6d4',
};

type ViewMode = 'pricing' | 'samples';

export function SampleTypeBreakdown({ products }: Props) {
  const [viewMode, setViewMode] = useState<ViewMode>('pricing');

  const pricingData = useMemo(() => {
    const categoryMap: Record<Category, { count: number; totalPrice: number }> = {} as Record<Category, { count: number; totalPrice: number }>;
    CATEGORIES.forEach(cat => {
      categoryMap[cat] = { count: 0, totalPrice: 0 };
    });

    products.forEach(p => {
      if (categoryMap[p.category]) {
        categoryMap[p.category].count += 1;
        categoryMap[p.category].totalPrice += p.pricing;
      }
    });

    return CATEGORIES.map(cat => {
      const data = categoryMap[cat] || { count: 0, totalPrice: 0 };
      return {
        name: cat,
        avgPricing: data.count > 0 ? (data.totalPrice / data.count).toFixed(2) : 0,
      };
    });
  }, [products]);

  const sampleData = useMemo(() => {
    const sampleMap: Record<string, number> = {
      ffpe: 0,
      blood: 0,
      cfdna: 0,
      tissue: 0,
      saliva: 0,
    };

    products.forEach(p => {
      p.sampleTypes?.forEach(st => {
        sampleMap[st]++;
      });
    });

    return Object.entries(sampleMap)
      .map(([type, count]) => ({
        name: SAMPLE_TYPE_LABELS[type] || type,
        value: count,
        key: type,
      }))
      .filter(d => d.value > 0);
  }, [products]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Sample Type & Pricing Analysis</h2>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('pricing')}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              viewMode === 'pricing'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Avg Pricing
          </button>
          <button
            onClick={() => setViewMode('samples')}
            className={`px-3 py-2 rounded text-sm font-medium transition ${
              viewMode === 'samples'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            Sample Types
          </button>
        </div>
      </div>

      {viewMode === 'pricing' ? (
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={pricingData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="name" stroke="#9ca3af" angle={-45} textAnchor="end" height={80} />
            <YAxis stroke="#9ca3af" />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Bar dataKey="avgPricing" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={sampleData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label
            >
              {sampleData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={SAMPLE_TYPE_COLORS[entry.key] || '#9ca3af'} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
