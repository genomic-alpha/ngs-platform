import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { Product } from '@/core/types';
import { DEFAULT_VENDORS } from '@/core/data/vendors';

interface Props {
  products: Product[];
}

export function TopVendorsBubble({ products }: Props) {
  const data = useMemo(() => {
    const vendorMap: Record<string, number> = {};

    products.forEach(p => {
      vendorMap[p.vendor] = (vendorMap[p.vendor] || 0) + p.share;
    });

    const vendorArray = Object.entries(vendorMap)
      .map(([key, share]) => {
        const vendor = DEFAULT_VENDORS.find(v => v.key === key);
        return {
          key,
          label: vendor?.label || key,
          share,
          color: vendor?.color || '#9ca3af',
        };
      })
      .sort((a, b) => b.share - a.share)
      .slice(0, 12);

    return vendorArray;
  }, [products]);

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <h2 className="text-lg font-bold text-white mb-4">Top Vendors by Market Share</h2>
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
          <Bar dataKey="share" fill="#3b82f6" radius={[0, 8, 8, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
