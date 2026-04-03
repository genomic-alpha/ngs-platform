import type { Product, IndicationKey } from '@/core/types';
import { INDICATIONS, SAMPLE_TYPE_LABELS, NUCLEIC_ACID_LABELS } from '@/core';
import { GrowthBadge } from './GrowthBadge';
import { ConfidenceDot } from './ConfidenceDot';
import { MiniSparkline } from './MiniSparkline';
import { TAMOverlay } from './TAMOverlay';
import { RegionalShareBar } from './RegionalShareBar';
import { getTier, getRegulatoryBadge } from './helpers';

interface ProductCardProps {
  product: Product;
  indicationFilter?: IndicationKey[];
}

export function ProductCard({ product }: ProductCardProps) {
  const productIndications = product.indications || [];

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-white text-sm">{product.name}</h3>
          <p className="text-xs text-gray-400">{product.category}</p>
        </div>
        <span className={`text-xs font-bold px-2 py-1 rounded ${getTier(product) === 1 ? 'bg-green-900 text-green-200' : getTier(product) === 2 ? 'bg-yellow-900 text-yellow-200' : 'bg-gray-700 text-gray-200'}`}>
          {product.tier}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 mb-2">
        <GrowthBadge growth={product.growth} />
        {(product.sampleTypes || []).map(st => (
          <span key={st} className="text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">{SAMPLE_TYPE_LABELS[st] || st}</span>
        ))}
        {(product.nucleicAcids || []).map(na => (
          <span key={na} className="text-[10px] px-1.5 py-0.5 rounded bg-cyan-900/30 text-cyan-400">{NUCLEIC_ACID_LABELS[na] || na}</span>
        ))}
      </div>

      {productIndications.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {productIndications.map(indKey => {
            const ind = INDICATIONS.find(i => i.key === indKey);
            return (
              <span key={indKey} className="text-xs px-2 py-1 rounded" style={{ backgroundColor: `${ind?.color}33`, color: ind?.color }}>
                {ind?.icon} {ind?.label}
              </span>
            );
          })}
        </div>
      )}

      <div className="space-y-2 text-xs text-gray-300">
        {product.share !== undefined && (
          <div className="flex justify-between items-center">
            <span>Market Share:</span>
            <span className="font-bold text-white flex items-center gap-1">
              {product.share}%
              <ConfidenceDot conf={product.confidence?.share} />
              <MiniSparkline productId={product.id} metric="share" width={60} height={18} />
              <TAMOverlay share={product.share} category={product.category} />
            </span>
          </div>
        )}
        {product.pricing !== undefined && product.pricing !== 0 && (
          <div className="flex justify-between">
            <span>Cost/Sample:</span>
            <span className="font-bold text-white">
              ${product.pricing}
              <ConfidenceDot conf={product.confidence?.pricing} />
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Regulatory:</span>
          <span className={`font-bold px-2 py-1 rounded text-xs ${getRegulatoryBadge(product.regulatory)}`}>
            {product.regulatory}
            <ConfidenceDot conf={product.confidence?.regulatory} />
          </span>
        </div>
        {product.regionalShare && (
          <div>
            <span className="text-gray-500 text-[10px]">Regional Share:</span>
            <RegionalShareBar regionalShare={product.regionalShare} />
          </div>
        )}
      </div>
    </div>
  );
}
