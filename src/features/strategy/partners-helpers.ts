import type { Partner, PartnerStatus, PartnerTier } from '@/core/types';
import { CATEGORIES } from '@/core';

/**
 * Get badge color class for partner status
 */
export function getStatusColor(status: PartnerStatus): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800';
    case 'evaluating':
      return 'bg-yellow-100 text-yellow-800';
    case 'prospect':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get badge color class for partner tier
 */
export function getTierColor(tier: PartnerTier): string {
  switch (tier) {
    case 'strategic':
      return 'bg-purple-100 text-purple-800';
    case 'preferred':
      return 'bg-pink-100 text-pink-800';
    case 'approved':
      return 'bg-indigo-100 text-indigo-800';
    case 'evaluating':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-gray-100 text-gray-800';
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
