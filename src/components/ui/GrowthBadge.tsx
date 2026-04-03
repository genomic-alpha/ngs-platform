import { TrendingUp, TrendingDown, ArrowRight, Zap, Clock } from 'lucide-react';
import type { GrowthStatus } from '@/core/types';

interface GrowthBadgeProps {
  growth?: GrowthStatus | null;
}

export function GrowthBadge({ growth }: GrowthBadgeProps) {
  if (!growth) return null;
  const styles: Record<string, { bg: string; text: string; icon: React.ReactElement }> = {
    growing: { bg: 'bg-green-900/50', text: 'text-green-400', icon: <TrendingUp className="w-3 h-3" /> },
    stable: { bg: 'bg-gray-700/50', text: 'text-gray-400', icon: <ArrowRight className="w-3 h-3" /> },
    declining: { bg: 'bg-red-900/50', text: 'text-red-400', icon: <TrendingDown className="w-3 h-3" /> },
    emerging: { bg: 'bg-blue-900/50', text: 'text-blue-400', icon: <Zap className="w-3 h-3" /> },
    'pre-launch': { bg: 'bg-yellow-900/50', text: 'text-yellow-400', icon: <Clock className="w-3 h-3" /> },
  };
  const s = styles[growth] || styles.stable;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${s.bg} ${s.text}`}>
      {s.icon} {growth.charAt(0).toUpperCase() + growth.slice(1)}
    </span>
  );
}
