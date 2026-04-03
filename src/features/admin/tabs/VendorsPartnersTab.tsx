import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import type { Vendor, Partner, PartnerStatus, PartnerTier } from '@/core/types';

interface VendorsPartnersTabProps {
  vendors: Vendor[];
  setVendors: (vendors: Vendor[]) => void;
  partners: Partner[];
  setPartners: (partners: Partner[]) => void;
  activeSubTab: 'vendors' | 'partners';
  setActiveSubTab: (tab: 'vendors' | 'partners') => void;
}

export function VendorsPartnersTab({
  vendors,
  setVendors,
  partners,
  setPartners,
  activeSubTab,
  setActiveSubTab,
}: VendorsPartnersTabProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Sub-tab selector */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveSubTab('vendors')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'vendors' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Vendors
        </button>
        <button
          onClick={() => setActiveSubTab('partners')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'partners' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Partners
        </button>
      </div>

      {activeSubTab === 'vendors' && (
        <div className="space-y-4">
          <button
            onClick={() => {
              const newVendor: Vendor = {
                key: `vendor-${Date.now()}`,
                label: 'New Vendor',
                color: '#9ca3af',
                strength: '',
                weakness: '',
                recentMove: '',
              };
              setVendors([...vendors, newVendor]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus size={18} />
            Add Vendor
          </button>

          <div className="space-y-2">
            {vendors.map((vendor) => (
              <div key={vendor.key} className="bg-gray-800 rounded p-4 grid grid-cols-5 gap-4">
                <input
                  type="text"
                  value={vendor.label}
                  onChange={(e) => {
                    const updated = vendors.map((v) => (v.key === vendor.key ? { ...v, label: e.target.value } : v));
                    setVendors(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />
                <input
                  type="color"
                  value={vendor.color}
                  onChange={(e) => {
                    const updated = vendors.map((v) => (v.key === vendor.key ? { ...v, color: e.target.value } : v));
                    setVendors(updated);
                  }}
                  className="bg-gray-700 rounded px-2 py-1 text-sm h-10"
                />
                <input
                  type="text"
                  value={vendor.strength}
                  onChange={(e) => {
                    const updated = vendors.map((v) => (v.key === vendor.key ? { ...v, strength: e.target.value } : v));
                    setVendors(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Strength"
                />
                <input
                  type="text"
                  value={vendor.weakness}
                  onChange={(e) => {
                    const updated = vendors.map((v) => (v.key === vendor.key ? { ...v, weakness: e.target.value } : v));
                    setVendors(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Weakness"
                />
                <button
                  onClick={() => {
                    const updated = vendors.filter((v) => v.key !== vendor.key);
                    setVendors(updated);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'partners' && (
        <div className="space-y-4">
          <button
            onClick={() => {
              const newPartner: Partner = {
                id: `partner-${Date.now()}`,
                vendorKey: vendors[0]?.key || 'unknown',
                status: 'active',
                tier: 'strategic',
                contractStart: new Date().toISOString().split('T')[0],
                contractEnd: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                contractValue: 0,
                pricingTier: '',
                discountPct: 0,
                paymentTerms: 'NET30',
                autoRenew: true,
                primaryContact: '',
                primaryContactRole: '',
                primaryContactEmail: '',
                integrationStatus: 'planned',
                validatedProducts: [],
                integrationNotes: '',
                technicalContact: '',
                technicalContactRole: '',
                healthScore: 80,
                lastMeeting: new Date().toISOString().split('T')[0],
                nextReview: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                meetingNotes: [],
                pipelineActivities: [],
                riskFactors: [],
                categories: [],
              };
              setPartners([...partners, newPartner]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus size={18} />
            Add Partner
          </button>

          <div className="space-y-2">
            {partners.map((partner) => (
              <div key={partner.id} className="bg-gray-800 rounded p-4 grid grid-cols-6 gap-4">
                <select
                  value={partner.vendorKey}
                  onChange={(e) => {
                    const updated = partners.map((p) => (p.id === partner.id ? { ...p, vendorKey: e.target.value } : p));
                    setPartners(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  {vendors.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>

                <select
                  value={partner.status}
                  onChange={(e) => {
                    const updated = partners.map((p) => (p.id === partner.id ? { ...p, status: e.target.value as PartnerStatus } : p));
                    setPartners(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="active">Active</option>
                  <option value="evaluating">Evaluating</option>
                  <option value="prospect">Prospect</option>
                </select>

                <select
                  value={partner.tier}
                  onChange={(e) => {
                    const updated = partners.map((p) => (p.id === partner.id ? { ...p, tier: e.target.value as PartnerTier } : p));
                    setPartners(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  <option value="strategic">Strategic</option>
                  <option value="preferred">Preferred</option>
                  <option value="approved">Approved</option>
                  <option value="evaluating">Evaluating</option>
                </select>

                <input
                  type="number"
                  min="0"
                  max="100"
                  value={partner.healthScore}
                  onChange={(e) => {
                    const updated = partners.map((p) => (p.id === partner.id ? { ...p, healthScore: parseInt(e.target.value) } : p));
                    setPartners(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Health"
                />

                <input
                  type="number"
                  step="0.01"
                  value={partner.contractValue}
                  onChange={(e) => {
                    const updated = partners.map((p) =>
                      p.id === partner.id ? { ...p, contractValue: parseFloat(e.target.value) } : p
                    );
                    setPartners(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Value"
                />

                <button
                  onClick={() => {
                    const updated = partners.filter((p) => p.id !== partner.id);
                    setPartners(updated);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
