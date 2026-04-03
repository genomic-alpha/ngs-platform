import type { Product } from '@/core/types';

/**
 * Convert product tier letter to numeric value for sorting
 */
export function getTier(product: Product): number {
  return product.tier === 'A' ? 1 : product.tier === 'B' ? 2 : 3;
}

/**
 * Get Tailwind classes for regulatory badge based on status
 */
export function getRegulatoryBadge(regulatory: string): string {
  const badges: Record<string, string> = {
    'FDA PMA': 'bg-green-900/50 text-green-300',
    'FDA 510(k)': 'bg-green-900/30 text-green-400',
    'CE-IVD': 'bg-blue-900/50 text-blue-300',
    'CE-IVDR': 'bg-indigo-900/50 text-indigo-300',
    RUO: 'bg-gray-700/50 text-gray-400',
    'CLIA/CAP': 'bg-yellow-900/50 text-yellow-300',
    'ISO 13485': 'bg-purple-900/50 text-purple-300',
  };
  return badges[regulatory] || 'bg-gray-700 text-gray-400';
}

/**
 * Tooltip styling for Recharts tooltips
 */
export const tooltipStyle = {
  backgroundColor: '#1f2937',
  border: '1px solid #374151',
  borderRadius: '8px',
};
