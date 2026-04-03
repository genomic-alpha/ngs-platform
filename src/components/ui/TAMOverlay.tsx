import { useData } from '@/store';
import { DEFAULT_MARKET_SIZE } from '@/core';

interface TAMOverlayProps {
  share?: number;
  category?: string;
  indication?: string;
}

export function TAMOverlay({ share, category, indication }: TAMOverlayProps) {
  const data = useData();
  const marketSize = data?.marketSize || DEFAULT_MARKET_SIZE;

  const tam = category ? marketSize.byCategory[category] : indication ? marketSize.byIndication[indication] : marketSize.totalNGS;
  if (!tam || !share) return null;
  const dollarValue = ((share / 100) * tam).toFixed(0);
  return <span className="text-xs text-emerald-400 ml-1" title={`${share}% of $${tam}M TAM`}>(${dollarValue}M)</span>;
}
