import { useMemo, useState } from 'react';
import type { Product, IndicationKey, IntelSignal } from '@/core/types';
import { useData } from '@/store';
import { DEFAULT_INTEL_SIGNALS } from '@/core/data/signals';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

interface IntelSignalsViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

const SIGNAL_TYPE_OPTIONS = [
  'regulatory',
  'pricing',
  'partnership',
  'product_launch',
  'market_entry',
  'acquisition',
  'clinical_data',
];

const PIE_COLORS = ['#ef4444', '#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#06b6d4'];

function getImpactBadgeStyle(impact: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    high: { bg: 'bg-red-900/30', text: 'text-red-300' },
    medium: { bg: 'bg-yellow-900/30', text: 'text-yellow-300' },
    low: { bg: 'bg-gray-700/30', text: 'text-gray-300' },
  };
  return styles[impact] || styles.low;
}

function getTypeBadgeStyle(type: string): { bg: string; text: string } {
  const styles: Record<string, { bg: string; text: string }> = {
    regulatory: { bg: 'bg-blue-900/30', text: 'text-blue-300' },
    pricing: { bg: 'bg-green-900/30', text: 'text-green-300' },
    partnership: { bg: 'bg-purple-900/30', text: 'text-purple-300' },
    product_launch: { bg: 'bg-cyan-900/30', text: 'text-cyan-300' },
    market_entry: { bg: 'bg-orange-900/30', text: 'text-orange-300' },
    acquisition: { bg: 'bg-pink-900/30', text: 'text-pink-300' },
    clinical_data: { bg: 'bg-violet-900/30', text: 'text-violet-300' },
    ma: { bg: 'bg-pink-900/30', text: 'text-pink-300' },
  };
  return styles[type] || { bg: 'bg-gray-700/30', text: 'text-gray-300' };
}

export function IntelSignalsView({ products, indicationFilter }: IntelSignalsViewProps) {
  const data = useData();
  const intelSignals = data?.intelSignals || DEFAULT_INTEL_SIGNALS;

  const [filterType, setFilterType] = useState('');
  const [filterVendor, setFilterVendor] = useState('');
  const [filterImpact, setFilterImpact] = useState('');

  const filteredSignals = useMemo(() => {
    let result = [...intelSignals];

    if (filterType) {
      result = result.filter((s) => s.type === filterType);
    }
    if (filterVendor) {
      result = result.filter((s) => s.vendor === filterVendor);
    }
    if (filterImpact) {
      result = result.filter((s) => s.impact === filterImpact);
    }

    return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [intelSignals, filterType, filterVendor, filterImpact]);

  const highImpactSignals = useMemo(() => {
    return intelSignals
      .filter((s) => s.impact === 'high')
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 3);
  }, [intelSignals]);

  const signalsByType = useMemo(() => {
    const counts: Record<string, number> = {};
    intelSignals.forEach((s) => {
      counts[s.type] = (counts[s.type] || 0) + 1;
    });
    return Object.entries(counts).map(([type, count]) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value: count,
      key: type,
    }));
  }, [intelSignals]);

  const signalsByVendor = useMemo(() => {
    const counts: Record<string, number> = {};
    intelSignals.forEach((s) => {
      counts[s.vendor] = (counts[s.vendor] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([vendor, count]) => ({
        name: vendor.charAt(0).toUpperCase() + vendor.slice(1),
        value: count,
      }));
  }, [intelSignals]);

  const uniqueVendors = Array.from(new Set(intelSignals.map((s) => s.vendor))).sort();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Intelligence Signals</h2>

      {/* High-Impact Alerts */}
      <div className="bg-gradient-to-r from-red-900/20 to-red-800/10 rounded-lg p-6 border border-red-800/30">
        <h3 className="text-lg font-bold text-red-300 mb-4">High-Impact Alerts</h3>
        <div className="grid grid-cols-3 gap-4">
          {highImpactSignals.map((signal) => (
            <div key={signal.id} className="bg-gray-800/50 rounded-lg p-4 border border-red-700/30">
              <div className="flex gap-2 mb-2">
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getImpactBadgeStyle(signal.impact).bg} ${getImpactBadgeStyle(signal.impact).text}`}>
                  {signal.impact.toUpperCase()}
                </span>
                <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeStyle(signal.type).bg} ${getTypeBadgeStyle(signal.type).text}`}>
                  {signal.type.replace(/_/g, ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-gray-400 mb-2">{signal.date}</p>
              <p className="text-white font-bold mb-2">{signal.title}</p>
              <p className="text-sm text-gray-300 mb-2">{signal.summary}</p>
              <p className="text-xs text-gray-500">{signal.source}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Intelligence Feed */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
        <h3 className="text-lg font-bold text-white mb-4">Intelligence Feed</h3>

        {/* Filters */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Signal Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Types</option>
              {SIGNAL_TYPE_OPTIONS.map((type) => (
                <option key={type} value={type}>
                  {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Vendor</label>
            <select
              value={filterVendor}
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Vendors</option>
              {uniqueVendors.map((vendor) => (
                <option key={vendor} value={vendor}>
                  {vendor.charAt(0).toUpperCase() + vendor.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Impact</label>
            <select
              value={filterImpact}
              onChange={(e) => setFilterImpact(e.target.value)}
              className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="">All Levels</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-2">Total</label>
            <div className="bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm font-semibold">
              {filteredSignals.length}
            </div>
          </div>
        </div>

        {/* Signals List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredSignals.map((signal) => (
            <div key={signal.id} className="bg-gray-700/30 rounded-lg p-4 border border-gray-600/30 hover:border-gray-500/50 transition">
              <div className="flex justify-between items-start mb-2">
                <div className="flex gap-2">
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getImpactBadgeStyle(signal.impact).bg} ${getImpactBadgeStyle(signal.impact).text}`}>
                    {signal.impact.toUpperCase()}
                  </span>
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${getTypeBadgeStyle(signal.type).bg} ${getTypeBadgeStyle(signal.type).text}`}>
                    {signal.type.replace(/_/g, ' ')}
                  </span>
                </div>
                <p className="text-xs text-gray-500">{signal.date}</p>
              </div>
              <p className="text-white font-bold mb-1">{signal.title}</p>
              <p className="text-sm text-gray-300 mb-2">{signal.summary}</p>
              <p className="text-xs text-gray-500">{signal.source}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6">
        {/* Pie Chart: Signals by Type */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Signals by Type</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={signalsByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {signalsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart: Signals by Vendor */}
        <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h3 className="text-lg font-bold text-white mb-4">Signals by Vendor (Top 8)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={signalsByVendor}
              margin={{ top: 20, right: 30, left: 0, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis dataKey="name" stroke="#999" fontSize={12} />
              <YAxis stroke="#999" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#374151',
                  border: '1px solid #555',
                  borderRadius: '4px',
                }}
              />
              <Bar dataKey="value" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
