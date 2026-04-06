import type { Partner, PartnerStatus, PartnerTier } from '@/core/types';
import { CATEGORIES } from '@/core';

/**
 * Get badge color class for partner status
 */
export function getStatusColor(status: PartnerStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-900/40 text-green-400';
    case 'evaluating':
      return 'bg-yellow-900/40 text-yellow-400';
    case 'prospect':
      return 'bg-blue-900/40 text-blue-400';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}

/**
 * Get badge color class for partner tier
 */
export function getTierColor(tier: PartnerTier): string {
  switch (tier) {
    case 'strategic':
      return 'bg-purple-900/40 text-purple-400';
    case 'preferred':
      return 'bg-pink-900/40 text-pink-400';
    case 'approved':
      return 'bg-indigo-900/40 text-indigo-400';
    case 'evaluating':
      return 'bg-amber-900/40 text-amber-400';
    default:
      return 'bg-gray-700 text-gray-300';
  }
}

/**
 * Get health score color as hex value
 */
export function getHealthColor(score: number): string {
  if (score >= 80) return '#10b981'; // green
  if (score >= 70) return '#f59e0b'; // amber
  if (score >= 60) return '#f97316'; // orange
  return '#ef4444'; // red
}

/**
 * Build vendor coverage map from filtered partners
 */
export function getCoverageMap(partners: Partner[]): Record<string, string[]> {
  const map: Record<string, string[]> = {};

  CATEGORIES.forEach((category) => {
    map[category] = [];
  });

  partners.forEach((partner) => {
    partner.categories.forEach((category) => {
      if (map[category]) {
        const vendorKey = partner.vendorKey;
        if (!map[category].includes(vendorKey)) {
          map[category].push(vendorKey);
        }
      }
    });
  });

  return map;
}

/**
 * Check if contract is expiring within 90 days
 */
export function isContractExpiring(contractEnd: string): boolean {
  const endDate = new Date(contractEnd);
  const now = new Date();
  const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
  return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
}
