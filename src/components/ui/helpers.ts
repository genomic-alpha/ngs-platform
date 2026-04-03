import type { Product, Tier } from '@/core/types';
import { TrendingUp } from 'lucide-react';
import React from 'react';

export const getTier = (product: Product): number => {
  const tierMap: Record<string, number> = { 'A': 1, 'B': 2, 'C': 3 };
  return tierMap[product.tier] || 3;
};

export const getGrowthIcon = (impact: string): React.ReactElement => {
  if (impact === 'High') return React.createElement(TrendingUp, { className: 'w-4 h-4 text-green-400' });
  return React.createElement(TrendingUp, { className: 'w-4 h-4 text-gray-500' });
};

export const getRegulatoryBadge = (regulatory: string): string => {
  const colors: Record<string, string> = {
    'FDA PMA': 'bg-blue-900 text-blue-200',
    'FDA 510(k)': 'bg-blue-800 text-blue-200',
    'FDA EUA': 'bg-purple-900 text-purple-200',
    'CE-IVDR': 'bg-green-900 text-green-200',
    'CE-IVD': 'bg-green-800 text-green-300',
    'CLIA/CAP': 'bg-yellow-900 text-yellow-200',
    'ISO 13485': 'bg-gray-700 text-gray-300',
    'RUO': 'bg-gray-800 text-gray-400',
  };
  return colors[regulatory] || 'bg-gray-800 text-gray-400';
};
