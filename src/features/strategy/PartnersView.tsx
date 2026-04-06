'use client';

import { useMemo, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { Product, IndicationKey, Partner, PartnerStatus, PartnerTier } from '@/core/types';
import { DEFAULT_PARTNERS, DEFAULT_VENDORS, CATEGORIES } from '@/core';
import { useData } from '@/store';
import {
  getStatusColor,
  getTierColor,
  getHealthColor,
  getCoverageMap,
  isContractExpiring,
} from './partners-helpers';

interface PartnersViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function PartnersView({ products, indicationFilter }: PartnersViewProps) {
  const [sortBy, setSortBy] = useState<'health' | 'value' | 'expiry'>('health');
  const [filterStatus, setFilterStatus] = useState<'all' | PartnerStatus>('all');
  const [filterTier, setFilterTier] = useState<'all' | PartnerTier>('all');
  const [expandedPartner, setExpandedPartner] = useState<string | null>(null);

  const { partners = DEFAULT_PARTNERS, vendors = DEFAULT_VENDORS } = useData();

  // Filtered and sorted partners
  const filteredPartners = useMemo(() => {
    let result = [...partners];

    // Apply filters
    if (filterStatus !== 'all') {
      result = result.filter((p) => p.status === filterStatus);
    }
    if (filterTier !== 'all') {
      result = result.filter((p) => p.tier === filterTier);
    }

    // Sort
    result.sort((a, b) => {
      if (sortBy === 'health') {
        return b.healthScore - a.healthScore;
      } else if (sortBy === 'value') {
        return b.contractValue - a.contractValue;
      } else if (sortBy === 'expiry') {
        return new Date(a.contractEnd).getTime() - new Date(b.contractEnd).getTime();
      }
      return 0;
    });

    return result;
  }, [partners, filterStatus, filterTier, sortBy]);

  // Stat cards
  const stats = useMemo(() => {
    const activeCount = partners.filter((p) => p.status === 'active').length;
    const totalValue = partners.reduce((sum, p) => sum + p.contractValue, 0);
    const avgHealth = partners.length > 0 ? Math.round(partners.reduce((sum, p) => sum + p.healthScore, 0) / partners.length) : 0;
    const now = new Date();
    const expiringCount = partners.filter((p) => {
      const endDate = new Date(p.contractEnd);
      const daysUntilExpiry = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
    }).length;

    return { activeCount, totalValue, avgHealth, expiringCount };
  }, [partners]);

  // Coverage map
  const coverageMap = useMemo(() => getCoverageMap(filteredPartners), [filteredPartners]);

  const getPartnerVendorColor = (vendorKey: string): string => {
    const vendor = vendors.find((v) => v.key === vendorKey);
    return vendor?.color || '#9ca3af';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-100">Partner & Vendor Network</h2>
        <p className="mt-1 text-sm text-gray-400">Manage and monitor strategic partnerships and integrations</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Active Partners</p>
          <p className="mt-2 text-3xl font-bold text-gray-100">{stats.activeCount}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Total Contract Value</p>
          <p className="mt-2 text-3xl font-bold text-gray-100">${(stats.totalValue / 1000000).toFixed(1)}M</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Avg Health Score</p>
          <p className="mt-2 text-3xl font-bold text-gray-100">{stats.avgHealth}</p>
        </div>
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Expiring Soon (90d)</p>
          <p className="mt-2 text-3xl font-bold text-orange-400">{stats.expiringCount}</p>
        </div>
      </div>

      {/* Filter and Sort Controls */}
      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'health' | 'value' | 'expiry')}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="health">Health Score</option>
            <option value="value">Contract Value</option>
            <option value="expiry">Contract Expiry</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Status</label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | PartnerStatus)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="evaluating">Evaluating</option>
            <option value="prospect">Prospect</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-300 mb-1">Tier</label>
          <select
            value={filterTier}
            onChange={(e) => setFilterTier(e.target.value as 'all' | PartnerTier)}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Tiers</option>
            <option value="strategic">Strategic</option>
            <option value="preferred">Preferred</option>
            <option value="approved">Approved</option>
            <option value="evaluating">Evaluating</option>
          </select>
        </div>
      </div>

      {/* Partner Cards Grid (2-col) */}
      <div className="grid grid-cols-2 gap-6">
        {filteredPartners.map((partner) => {
          const isExpiring = isContractExpiring(partner.contractEnd);

          return (
            <div key={partner.id} className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden">
              {/* Card Header */}
              <div className="p-6 border-b border-gray-700">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0 mt-1"
                      style={{ backgroundColor: getPartnerVendorColor(partner.vendorKey) }}
                    />
                    <div>
                      <h3 className="font-semibold text-gray-100">{partner.vendorKey}</h3>
                      <p className="text-sm text-gray-400 mt-0.5">{partner.primaryContact}</p>
                    </div>
                  </div>
                  {isExpiring && (
                    <div className="flex-shrink-0">
                      <AlertTriangle className="w-5 h-5 text-orange-400" />
                    </div>
                  )}
                </div>

                {/* Status and Tier Badges */}
                <div className="flex gap-2 mb-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(partner.status)}`}>
                    {partner.status.charAt(0).toUpperCase() + partner.status.slice(1)}
                  </span>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getTierColor(partner.tier)}`}>
                    {partner.tier.charAt(0).toUpperCase() + partner.tier.slice(1)}
                  </span>
                </div>

                {/* Health Bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-gray-400">Health Score</span>
                    <span className="text-sm font-bold" style={{ color: getHealthColor(partner.healthScore) }}>
                      {partner.healthScore}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all"
                      style={{
                        width: `${partner.healthScore}%`,
                        backgroundColor: getHealthColor(partner.healthScore),
                      }}
                    />
                  </div>
                </div>

                {/* Contract Dates and Value */}
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Contract Value:</span>
                    <span className="font-semibold text-gray-100">${(partner.contractValue / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Expires:</span>
                    <span className={`font-semibold ${isExpiring ? 'text-orange-400' : 'text-gray-100'}`}>
                      {new Date(partner.contractEnd).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Expandable Section */}
              <button
                onClick={() => setExpandedPartner(expandedPartner === partner.id ? null : partner.id)}
                className="w-full px-6 py-3 text-sm font-semibold text-blue-400 hover:bg-gray-800 transition-colors text-left"
              >
                {expandedPartner === partner.id ? 'Hide Details' : 'Show Details'}
              </button>

              {expandedPartner === partner.id && (
                <div className="border-t border-gray-700 p-6 space-y-6">
                  {/* Commercial Details */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Commercial Details</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Pricing Tier:</span>
                        <span className="font-semibold text-gray-100">{partner.pricingTier}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Discount:</span>
                        <span className="font-semibold text-gray-100">{partner.discountPct}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Payment Terms:</span>
                        <span className="font-semibold text-gray-100">{partner.paymentTerms}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Auto Renew:</span>
                        <span className="font-semibold text-gray-100">{partner.autoRenew ? 'Yes' : 'No'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Technical Integration */}
                  <div>
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Technical Integration</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Status:</span>
                        <span className="font-semibold text-gray-100 capitalize">{partner.integrationStatus}</span>
                      </div>
                      <div>
                        <p className="text-gray-400 mb-1">Validated Products:</p>
                        <div className="flex flex-wrap gap-1">
                          {partner.validatedProducts.length > 0 ? (
                            partner.validatedProducts.map((prod) => (
                              <span key={prod} className="inline-block px-2 py-1 bg-green-900/40 text-green-400 text-xs rounded">
                                {prod}
                              </span>
                            ))
                          ) : (
                            <span className="text-gray-500 text-xs">None</span>
                          )}
                        </div>
                      </div>
                      <p className="text-gray-400 mt-2">{partner.integrationNotes}</p>
                    </div>
                  </div>

                  {/* Recent Meetings */}
                  {partner.meetingNotes.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Meetings</h4>
                      <div className="space-y-2">
                        {partner.meetingNotes.slice(-3).map((note, idx) => (
                          <div key={idx} className="p-2 bg-gray-800 rounded text-sm">
                            <div className="flex justify-between mb-1">
                              <span className="font-semibold text-gray-100">{note.type}</span>
                              <span className="text-gray-400">{new Date(note.date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-gray-300">{note.notes}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Risk Factors */}
                  {partner.riskFactors.length > 0 && (
                    <div>
                      <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Risk Factors</h4>
                      <ul className="space-y-1">
                        {partner.riskFactors.map((risk, idx) => (
                          <li key={idx} className="text-sm text-red-400 flex items-start gap-2">
                            <span className="mt-0.5">•</span>
                            <span>{risk}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Vendor Coverage by Category */}
      <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-6">Vendor Coverage by Category</h3>
        <div className="grid grid-cols-2 gap-6">
          {CATEGORIES.map((category) => {
            const vendorLabels = coverageMap[category]
              .map((vendorKey) => vendors.find((v) => v.key === vendorKey)?.label || vendorKey)
              .filter(Boolean);

            return (
              <div key={category}>
                <h4 className="text-sm font-semibold text-gray-200 mb-2">{category}</h4>
                {vendorLabels.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {vendorLabels.map((label) => (
                      <span key={label} className="inline-block px-3 py-1 bg-gray-800 text-gray-300 text-xs rounded-full">
                        {label}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No active partners</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Pipeline Activities Table */}
      {filteredPartners.some((p) => p.pipelineActivities.length > 0) && (
        <div className="bg-gray-900 rounded-lg border border-gray-700 p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wide mb-4">Active Pipeline Activities</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-600">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Partner</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Activity</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Status</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-400">Target Date</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-400">Value</th>
                </tr>
              </thead>
              <tbody>
                {filteredPartners.flatMap((partner) =>
                  partner.pipelineActivities.map((activity) => (
                    <tr key={activity.id} className="border-b border-gray-700 hover:bg-gray-800">
                      <td className="py-3 px-4 text-gray-100 font-medium">{partner.vendorKey}</td>
                      <td className="py-3 px-4 text-gray-300">{activity.description}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 bg-blue-900/40 text-blue-400 text-xs font-semibold rounded capitalize">
                          {activity.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-gray-400">{new Date(activity.targetDate).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-right text-gray-100 font-semibold">${(activity.value / 1000).toFixed(0)}K</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
