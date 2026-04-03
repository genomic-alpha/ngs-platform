import { useMemo, useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import type { Product } from '@/core/types';
import { CATEGORIES, getCategoryColor } from '@/core/config';

interface Props {
  products: Product[];
}

export function SequencerLandscape({ products }: Props) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filteredData = useMemo(() => {
    return (selectedCategory === 'All' ? products : products.filter(p => p.category === selectedCategory))
      .map(p => ({
        name: p.name,
        pricing: p.pricing,
        share: p.share,
        category: p.category,
        color: getCategoryColor(p.category),
      }));
  }, [products, selectedCategory]);

  const categoryOptions = ['All', ...CATEGORIES];

  return (
    <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-white">Sequencer Landscape</h2>
        <select
          value={selectedCategory}
          onChange={e => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 text-sm"
        >
          {categoryOptions.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
      <ResponsiveContainer width="100%" height={300}>
        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="pricing" name="Pricing ($)" stroke="#9ca3af" />
          <YAxis dataKey="share" name="Market Share (%)" stroke="#9ca3af" />
          <Tooltip
            contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
            labelStyle={{ color: '#f3f4f6' }}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Legend />
          <Scatter name="Products" data={filteredData} fill="#3b82f6">
            {filteredData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
