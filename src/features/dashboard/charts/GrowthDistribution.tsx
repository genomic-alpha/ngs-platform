import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Product } from '@/core/types';
import { DEFAULT_VENDORS } from '@/core/data/vendors';

interface Props {
  products: Product[];
}

export function GrowthDistribution({ products }: Props) {
  const data = useMemo(() => {
    const vendorMomentum: Record<string, number> = {};

    products.forEach(p => {
      if (!vendorMomentum[p.vendor]) {
        vendorMomentum[p.vendor] = 0;
      }

      if (p.growth === 'growing' || p.growth === 'emerging') {
        vendorMomentum[p.vendor] += p.share;
      } else if (p.growth === 'declining') {
        vendorMomentum[p.vendor] -= p.share;
      }
    });

    return Object.entries(vendorMomentum)
      .map(([key, momentum]) => {
        const vendor = DEFAULT_VENDORS.find(v => v.key === key);
        return {
          key,
          label: vendor?.label || key,
          momentum,
          color: momentum > 0 ? '#22c55e' : '#ef4444',
        };
      })
      .sort((a, b) => b.momentum - a.momentum);
  }, [products]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">Growth Momentum</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 120, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis type="number" stroke="#9ca3af" />
          <YAxis dataKey="label" type="category" width={115} stroke="#9ca3af" tick={{ fontSize: 12 }} />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#f3f4f6' }}
          />
          <Bar dataKey="momentum" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
