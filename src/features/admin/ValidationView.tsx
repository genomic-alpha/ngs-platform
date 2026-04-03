import React, { useState, useMemo } from 'react';
import { RefreshCw, CheckCircle } from 'lucide-react';
import { CATEGORIES, DEFAULT_VENDORS, DEFAULT_COMPATIBILITY, DEFAULT_PARTNERS } from '@/core';
import { useData } from '@/store';
import type {
  Product,
  Vendor,
  CompatibilityEntry,
  Partner,
  Category,
} from '@/core/types';

interface ValidationFinding {
  id: string;
  rule: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  message: string;
  items: string[];
}

interface ValidationHistoryEntry {
  timestamp: string;
  findingsCount: number;
  criticalCount: number;
  severityScore: number;
}

interface ValidationViewProps {
  products: Product[];
}

function getSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: '#ef4444',
    high: '#f97316',
    medium: '#f59e0b',
    low: '#3b82f6',
  };
  return colors[severity] || '#6b7280';
}

function getSeverityBgColor(severity: string): string {
  const colors: Record<string, string> = {
    critical: 'rgba(239, 68, 68, 0.1)',
    high: 'rgba(249, 115, 22, 0.1)',
    medium: 'rgba(245, 158, 11, 0.1)',
    low: 'rgba(59, 130, 246, 0.1)',
  };
  return colors[severity] || '#1f2937';
}

export function ValidationView({ products }: ValidationViewProps): React.ReactElement {
  const data = useData();
  const [validationHistory, setValidationHistory] = useState<ValidationHistoryEntry[]>([]);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const vendors = data?.vendors ?? DEFAULT_VENDORS;
  const compatibility = data?.compatibility ?? DEFAULT_COMPATIBILITY;
  const partners = data?.partners ?? DEFAULT_PARTNERS;

  // Validation rules
  const validationFindings = useMemo((): ValidationFinding[] => {
    const findings: ValidationFinding[] = [];

    // 1. Share sum validation (±5% from 100)
    const shareByCategory: Record<string, number> = {};
    CATEGORIES.forEach((cat) => {
      shareByCategory[cat] = products.filter((p) => p.category === cat).reduce((sum, p) => sum + p.share, 0);
    });

    CATEGORIES.forEach((category) => {
      const total = shareByCategory[category];
      if (total < 95 || total > 105) {
        findings.push({
          id: `share-sum-${category}`,
          rule: 'share-sum',
          severity: total < 50 || total > 150 ? 'critical' : total < 90 || total > 110 ? 'high' : 'medium',
          category,
          message: `${category} shares sum to ${total.toFixed(1)}% (expected ~100%)`,
          items: products.filter((p) => p.category === category).map((p) => p.name),
        });
      }
    });

    // 2. Regional share sanity check
    products.forEach((product) => {
      const regionalSum = Object.values(product.regionalShare).reduce((a, b) => a + b, 0);
      if (regionalSum < 50 || regionalSum > 150) {
        findings.push({
          id: `regional-sum-${product.id}`,
          rule: 'regional-sum',
          severity: 'high',
          category: product.category,
          message: `${product.name} regional shares sum to ${regionalSum.toFixed(1)}% (expected ~100%)`,
          items: [product.name],
        });
      }
    });

    // 3. Pricing outlier detection (2σ per category)
    CATEGORIES.forEach((category) => {
      const catProducts = products.filter((p) => p.category === category);
      if (catProducts.length > 2) {
        const prices = catProducts.map((p) => p.pricing);
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const variance = prices.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / prices.length;
        const stdDev = Math.sqrt(variance);
        const threshold = mean + 2 * stdDev;

        catProducts.forEach((product) => {
          if (product.pricing > threshold) {
            findings.push({
              id: `pricing-outlier-${product.id}`,
              rule: 'pricing-outlier',
              severity: 'medium',
              category,
              message: `${product.name} pricing (${product.pricing}) is an outlier (mean: ${mean.toFixed(1)}, σ: ${stdDev.toFixed(1)})`,
              items: [product.name],
            });
          }
        });
      }
    });

    // 4. Orphan products (no compatibility entries)
    products.forEach((product) => {
      const hasCompat = compatibility.some((c) => c.source === product.id || c.target === product.id);
      if (!hasCompat) {
        findings.push({
          id: `orphan-product-${product.id}`,
          rule: 'orphan-product',
          severity: 'low',
          category: product.category,
          message: `${product.name} has no compatibility entries`,
          items: [product.name],
        });
      }
    });

    // 5. Missing confidence metadata
    products.forEach((product) => {
      if (!product.confidence.share.date || !product.confidence.pricing.date || !product.confidence.regulatory.date) {
        findings.push({
          id: `missing-conf-${product.id}`,
          rule: 'missing-confidence',
          severity: 'high',
          category: product.category,
          message: `${product.name} is missing confidence metadata`,
          items: [product.name],
        });
      }
    });

    // 6. Vendor orphan (vendors with no products)
    vendors.forEach((vendor) => {
      const hasProducts = products.some((p) => p.vendor === vendor.key);
      if (!hasProducts) {
        findings.push({
          id: `vendor-orphan-${vendor.key}`,
          rule: 'vendor-orphan',
          severity: 'low',
          category: 'N/A',
          message: `Vendor '${vendor.label}' has no products`,
          items: [vendor.label],
        });
      }
    });

    // 7. Partner contract expiry (within 90 days)
    partners.forEach((partner) => {
      const expiryDate = new Date(partner.contractEnd);
      const today = new Date();
      const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (daysUntilExpiry < 90 && daysUntilExpiry >= 0 && partner.status === 'active') {
        findings.push({
          id: `partner-expiry-${partner.id}`,
          rule: 'partner-contract-expiry',
          severity: daysUntilExpiry < 30 ? 'critical' : 'high',
          category: 'N/A',
          message: `Partner contract expires in ${daysUntilExpiry} days`,
          items: [partner.id],
        });
      }
    });

    // 8. Partner health low (< 60)
    partners.forEach((partner) => {
      if (partner.healthScore < 60 && partner.status === 'active') {
        findings.push({
          id: `partner-health-${partner.id}`,
          rule: 'partner-health-low',
          severity: partner.healthScore < 40 ? 'high' : 'medium',
          category: 'N/A',
          message: `Partner has low health score: ${partner.healthScore}`,
          items: [partner.id],
        });
      }
    });

    return findings;
  }, [products, vendors, compatibility, partners]);

  // Filter findings
  const filteredFindings = useMemo((): ValidationFinding[] => {
    return validationFindings.filter((f) => {
      if (filterSeverity !== 'all' && f.severity !== filterSeverity) return false;
      if (filterCategory !== 'all' && f.category !== filterCategory) return false;
      return true;
    });
  }, [validationFindings, filterSeverity, filterCategory]);

  // Severity counts
  const severityCounts = useMemo(() => {
    const counts = {
      critical: validationFindings.filter((f) => f.severity === 'critical').length,
      high: validationFindings.filter((f) => f.severity === 'high').length,
      medium: validationFindings.filter((f) => f.severity === 'medium').length,
      low: validationFindings.filter((f) => f.severity === 'low').length,
    };
    return counts;
  }, [validationFindings]);

  // Integrity score
  const integrityScore = useMemo(() => {
    const total = validationFindings.length;
    if (total === 0) return 100;
    const weighted = severityCounts.critical * 40 + severityCounts.high * 25 + severityCounts.medium * 10 + severityCounts.low * 5;
    return Math.max(0, 100 - weighted);
  }, [severityCounts, validationFindings]);

  // Handle run validation
  const handleRunValidation = (): void => {
    const entry: ValidationHistoryEntry = {
      timestamp: new Date().toISOString(),
      findingsCount: validationFindings.length,
      criticalCount: severityCounts.critical,
      severityScore: integrityScore,
    };
    setValidationHistory((prev) => [entry, ...prev.slice(0, 9)]);
  };

  const categories = ['all', ...CATEGORIES];
  const severities = ['all', 'critical', 'high', 'medium', 'low'];

  return (
    <div className="space-y-6">
      {/* Header Score */}
      <div
        style={{
          background: `linear-gradient(135deg, ${integrityScore > 80 ? '#10b981' : integrityScore > 60 ? '#f59e0b' : '#ef4444'} 0%, ${integrityScore > 80 ? '#059669' : integrityScore > 60 ? '#d97706' : '#dc2626'} 100%)`,
        }}
        className="rounded-lg p-6 text-white flex items-center justify-between"
      >
        <div>
          <h3 className="text-sm font-medium opacity-90 mb-2">Data Integrity Score</h3>
          <div className="text-5xl font-bold">{integrityScore}</div>
        </div>
        <button
          onClick={handleRunValidation}
          className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
        >
          <RefreshCw size={18} />
          Run Validation
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="bg-gray-900 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-white">{validationFindings.length}</div>
          <div className="text-xs text-gray-400 mt-1">Total Issues</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center" style={{ borderTopColor: getSeverityColor('critical'), borderTopWidth: '3px' }}>
          <div className="text-2xl font-bold" style={{ color: getSeverityColor('critical') }}>
            {severityCounts.critical}
          </div>
          <div className="text-xs text-gray-400 mt-1">Critical</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center" style={{ borderTopColor: getSeverityColor('high'), borderTopWidth: '3px' }}>
          <div className="text-2xl font-bold" style={{ color: getSeverityColor('high') }}>
            {severityCounts.high}
          </div>
          <div className="text-xs text-gray-400 mt-1">High</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center" style={{ borderTopColor: getSeverityColor('medium'), borderTopWidth: '3px' }}>
          <div className="text-2xl font-bold" style={{ color: getSeverityColor('medium') }}>
            {severityCounts.medium}
          </div>
          <div className="text-xs text-gray-400 mt-1">Medium</div>
        </div>
        <div className="bg-gray-900 rounded-lg p-4 text-center" style={{ borderTopColor: getSeverityColor('low'), borderTopWidth: '3px' }}>
          <div className="text-2xl font-bold" style={{ color: getSeverityColor('low') }}>
            {severityCounts.low}
          </div>
          <div className="text-xs text-gray-400 mt-1">Low</div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-gray-300 mb-2">Filter by Severity</label>
          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
          >
            {severities.map((sev) => (
              <option key={sev} value={sev}>
                {sev === 'all' ? 'All Severities' : sev.charAt(0).toUpperCase() + sev.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm text-gray-300 mb-2">Filter by Category</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full bg-gray-800 text-white rounded px-3 py-2 border border-gray-700"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Findings List */}
      {filteredFindings.length > 0 ? (
        <div className="space-y-3">
          {filteredFindings.map((finding) => (
            <div
              key={finding.id}
              style={{
                backgroundColor: getSeverityBgColor(finding.severity),
                borderLeftColor: getSeverityColor(finding.severity),
                borderLeftWidth: '4px',
              }}
              className="rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <div
                  style={{ color: getSeverityColor(finding.severity) }}
                  className="font-semibold text-sm mt-1"
                >
                  {finding.severity.toUpperCase()}
                </div>
                <div className="flex-1">
                  <h4 className="text-white font-medium">{finding.message}</h4>
                  <p className="text-gray-400 text-xs mt-1">Rule: {finding.rule}</p>
                  {finding.items.length > 0 && (
                    <div className="text-gray-400 text-xs mt-2">
                      Affected: {finding.items.slice(0, 3).join(', ')}
                      {finding.items.length > 3 && ` +${finding.items.length - 3} more`}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 rounded-lg p-8 text-center">
          <CheckCircle size={32} className="mx-auto text-green-500 mb-3" />
          <h3 className="text-white font-medium mb-1">No Issues Found</h3>
          <p className="text-gray-400 text-sm">All data passes validation checks</p>
        </div>
      )}

      {/* Validation History */}
      {validationHistory.length > 0 && (
        <div className="bg-gray-900 rounded-lg p-6">
          <h3 className="text-white font-medium mb-4">Validation History</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {validationHistory.map((entry, idx) => (
              <div key={idx} className="text-sm text-gray-300 flex justify-between items-center">
                <span>{new Date(entry.timestamp).toLocaleString()}</span>
                <span className="text-right">
                  {entry.findingsCount} issues ({entry.criticalCount} critical) • Score: {entry.severityScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
