import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { Product, Category } from '@/core/types';
import { CATEGORIES } from '@/core/config';

interface Props {
  products: Product[];
}

const TIER_COLORS: Record<string, string> = {
  A: '#ef4444',
  B: '#f59e0b',
  C: '#8b5cf6',
};

export function MarketShareByCategory({ products }: Props) {
  const data = useMemo(() => {
    const categoryMap: Record<Category, Record<string, number>> = {} as Record<Category, Record<string, number>>;

    CATEGORIES.forEach(cat => {
      categoryMap[cat] = { A: 0, B: 0, C: 0 };
    });

    products.forEach(p => {
      if (categoryMap[p.category]) {
        categoryMap[p.category][p.tier] += p.share;
      }
    });

    return CATEGORIES.map(category => {
      const tierData = categoryMap[category] || { A: 0, B: 0, C: 0 };
      return {
        name: category,
        A: tierData.A,
        B: tierData.B,
        C: tierData.C,
      };
    });
  }, [products]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">Market Share by Category</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="name" stroke="#9ca3af" />
          <YAxis stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Legend />
          <Bar dataKey="A" stackId="a" fill={TIER_COLORS.A} />
          <Bar dataKey="B" stackId="a" fill={TIER_COLORS.B} />
          <Bar dataKey="C" stackId="a" fill={TIER_COLORS.C} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
