import { useMemo } from 'react';
import type { Product, IndicationKey } from '@/core/types';
import { getRegulatoryBadge } from '@/components/ui/helpers';
import { ConfidenceDot } from '@/components/ui/ConfidenceDot';

interface RegulatoryViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function RegulatoryView({ products, indicationFilter }: RegulatoryViewProps) {
  const filteredProducts = useMemo(() => {
    return indicationFilter.length > 0
      ? products.filter((p) => p.indications?.some((ind) => indicationFilter.includes(ind)))
      : products;
  }, [products, indicationFilter]);

  const regulatoryGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};

    filteredProducts.forEach((product) => {
      const regulatory = product.regulatory || 'Unknown';
      if (!groups[regulatory]) {
        groups[regulatory] = [];
      }
      groups[regulatory].push(product);
    });

    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([regulatory, prods]) => ({
        regulatory,
        products: prods.sort((a, b) => a.name.localeCompare(b.name)),
      }));
  }, [filteredProducts]);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Regulatory Status</h2>

      <div className="space-y-4">
        {regulatoryGroups.map(({ regulatory, products: groupProducts }) => (
          <div key={regulatory} className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center gap-3 mb-4">
              <span className={`px-3 py-1.5 rounded-lg text-sm font-bold ${getRegulatoryBadge(regulatory)}`}>
                {regulatory}
              </span>
              <span className="text-gray-400 text-sm">
                {groupProducts.length} product{groupProducts.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-4 gap-3">
              {groupProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-gray-700/30 rounded-lg p-3 border border-gray-600/30 hover:border-gray-500/50 transition text-center"
                >
                  <p className="text-sm font-medium text-white truncate" title={product.name}>
                    {product.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{product.vendor}</p>
                  <div className="mt-2 flex justify-center">
                    <ConfidenceDot conf={product.confidence?.regulatory} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="bg-gray-800 rounded-lg p-8 border border-gray-700 text-center">
          <p className="text-gray-400">No products match the selected filters.</p>
        </div>
      )}
    </div>
  );
}
