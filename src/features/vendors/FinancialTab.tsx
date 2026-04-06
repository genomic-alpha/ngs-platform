import { useState, useMemo } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import type { FinancialProfile } from '@/core/types';
import { DEFAULT_FINANCIALS } from '@/core/data/financials';
import { useData } from '@/store';

function fmt(n: number | null | undefined, prefix = '$', suffix = ''): string {
  if (n == null) return '—';
  if (Math.abs(n) >= 1000) return `${prefix}${(n / 1000).toFixed(1)}B${suffix}`;
  return `${prefix}${n.toFixed(0)}M${suffix}`;
}

function pct(n: number | null | undefined): string {
  if (n == null) return '—';
  return `${(n * 100).toFixed(1)}%`;
}

function GrowthBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
      {positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {pct(value)}
    </span>
  );
}

export function FinancialTab() {
  const data = useData();
  const financials: Record<string, FinancialProfile> = data?.financials ?? DEFAULT_FINANCIALS;
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<'revenue' | 'revenueGrowth' | 'grossMargin' | 'rdSpend' | 'marketCap'>('revenue');
  const [sortAsc, setSortAsc] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const profiles = useMemo(() => {
    let list = Object.values(financials);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(f => f.ticker.toLowerCase().includes(q) || f.vendorKey.toLowerCase().includes(q));
    }
    list.sort((a, b) => {
      const av = a[sortKey] ?? 0;
      const bv = b[sortKey] ?? 0;
      return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return list;
  }, [financials, search, sortKey, sortAsc]);

  // Aggregate charts
  const revenueCompare = useMemo(() =>
    Object.values(financials)
      .filter(f => f.segmentRevenue || f.revenue < 10000)
      .sort((a, b) => (b.segmentRevenue ?? b.revenue) - (a.segmentRevenue ?? a.revenue))
      .slice(0, 12)
      .map(f => ({
        name: f.ticker,
        revenue: f.segmentRevenue ?? f.revenue,
        growth: f.revenueGrowth * 100,
      })),
    [financials]
  );

  const marginCompare = useMemo(() =>
    Object.values(financials)
      .sort((a, b) => b.grossMargin - a.grossMargin)
      .slice(0, 12)
      .map(f => ({
        name: f.ticker,
        gross: +(f.grossMargin * 100).toFixed(1),
        operating: +(f.opMargin * 100).toFixed(1),
        rd: +(f.rdPct * 100).toFixed(1),
      })),
    [financials]
  );

  const handleSort = (key: typeof sortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(false); }
  };

  const SortIcon = ({ field }: { field: typeof sortKey }) => {
    if (sortKey !== field) return null;
    return sortAsc ? <ChevronUp className="w-3 h-3 inline" /> : <ChevronDown className="w-3 h-3 inline" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="w-6 h-6 text-amber-400" />
          <h2 className="text-xl font-bold text-white">Financial Intelligence</h2>
          <span className="text-xs text-gray-500">{profiles.length} public vendors tracked</span>
        </div>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ticker or vendor..."
            className="pl-9 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 w-56"
          />
        </div>
      </div>

      {/* Revenue comparison chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">NGS-Relevant Revenue (Segment where applicable)</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueCompare} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `$${v >= 1000 ? `${(v/1000).toFixed(0)}B` : `${v}M`}`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={50} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => [fmt(value), 'Revenue']}
              />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {revenueCompare.map((entry, i) => (
                  <Cell key={i} fill={entry.growth >= 0 ? '#10B981' : '#EF4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-[10px] text-gray-500 mt-2">Green = positive YoY growth, Red = decline</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-5 border border-gray-700">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Margin & R&D Intensity Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={marginCompare} layout="vertical" margin={{ left: 50, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={v => `${v}%`} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={50} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px', color: '#fff' }}
                formatter={(value: number) => [`${value}%`]}
              />
              <Bar dataKey="gross" name="Gross Margin" fill="#3B82F6" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
              <Bar dataKey="operating" name="Op Margin" fill="#8B5CF6" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
              <Bar dataKey="rd" name="R&D %" fill="#F59E0B" fillOpacity={0.8} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-[10px] text-gray-500">
            <span><span className="inline-block w-2 h-2 rounded-full bg-blue-500 mr-1" />Gross Margin</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-purple-500 mr-1" />Operating Margin</span>
            <span><span className="inline-block w-2 h-2 rounded-full bg-amber-500 mr-1" />R&D Intensity</span>
          </div>
        </div>
      </div>

      {/* Sortable table */}
      <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-400 text-xs border-b border-gray-700">
                <th className="px-4 py-3 font-medium">Vendor</th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('revenue')}>
                  Revenue <SortIcon field="revenue" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('revenueGrowth')}>
                  YoY Growth <SortIcon field="revenueGrowth" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('grossMargin')}>
                  Gross Margin <SortIcon field="grossMargin" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('rdSpend')}>
                  R&D Spend <SortIcon field="rdSpend" />
                </th>
                <th className="px-4 py-3 font-medium cursor-pointer hover:text-white" onClick={() => handleSort('marketCap')}>
                  Market Cap <SortIcon field="marketCap" />
                </th>
                <th className="px-4 py-3 font-medium">Guidance</th>
                <th className="px-4 py-3 font-medium w-8" />
              </tr>
            </thead>
            <tbody>
              {profiles.map(f => (
                <>
                  <tr
                    key={f.vendorKey}
                    className="border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors"
                    onClick={() => setExpanded(expanded === f.vendorKey ? null : f.vendorKey)}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white">{f.vendorKey.charAt(0).toUpperCase() + f.vendorKey.slice(1)}</div>
                      <div className="text-[10px] text-gray-500">{f.ticker} · {f.lastFY}</div>
                    </td>
                    <td className="px-4 py-3 text-white font-medium">
                      {fmt(f.segmentRevenue ?? f.revenue)}
                      {f.segmentRevenue && <span className="text-[10px] text-gray-500 ml-1">seg</span>}
                    </td>
                    <td className="px-4 py-3"><GrowthBadge value={f.revenueGrowth} /></td>
                    <td className="px-4 py-3 text-white">{pct(f.grossMargin)}</td>
                    <td className="px-4 py-3 text-white">{fmt(f.rdSpend)} <span className="text-gray-500 text-[10px]">({pct(f.rdPct)})</span></td>
                    <td className="px-4 py-3 text-white">{fmt(f.marketCap)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {f.guidanceRevenue
                        ? `${fmt(f.guidanceRevenue[0])}–${fmt(f.guidanceRevenue[1])}`
                        : <span className="text-gray-600">N/A</span>
                      }
                    </td>
                    <td className="px-4 py-3 text-gray-500">
                      {expanded === f.vendorKey ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </td>
                  </tr>
                  {expanded === f.vendorKey && (
                    <tr key={`${f.vendorKey}-detail`} className="bg-gray-900/50">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                          {/* Quarterly revenue trend */}
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-400 mb-3">Revenue Trend</h4>
                            <ResponsiveContainer width="100%" height={140}>
                              <LineChart data={f.quarterly}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                                <XAxis dataKey="quarter" tick={{ fill: '#9CA3AF', fontSize: 9 }} />
                                <YAxis tick={{ fill: '#9CA3AF', fontSize: 9 }} tickFormatter={v => `$${v}M`} domain={['dataMin - 50', 'dataMax + 50']} />
                                <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '6px', color: '#fff', fontSize: '11px' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} dot={{ fill: '#3B82F6', r: 3 }} />
                              </LineChart>
                            </ResponsiveContainer>
                          </div>

                          {/* Balance sheet snapshot */}
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-400 mb-3">Balance Sheet</h4>
                            <div className="space-y-2 text-xs">
                              <div className="flex justify-between text-gray-300">
                                <span>Total Assets</span>
                                <span className="font-medium text-white">{fmt(f.balanceSheet.totalAssets)}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Total Liabilities</span>
                                <span className="font-medium text-white">{fmt(f.balanceSheet.totalLiabilities)}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Equity</span>
                                <span className="font-medium text-emerald-400">{fmt(f.balanceSheet.equity)}</span>
                              </div>
                              <hr className="border-gray-700" />
                              <div className="flex justify-between text-gray-300">
                                <span>Cash & Equivalents</span>
                                <span className="font-medium text-blue-400">{fmt(f.cash)}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>Total Debt</span>
                                <span className="font-medium text-orange-400">{fmt(f.totalDebt)}</span>
                              </div>
                              <div className="flex justify-between text-gray-300">
                                <span>EPS (Non-GAAP)</span>
                                <span className="font-medium text-white">{f.epsNonGaap != null ? `$${f.epsNonGaap.toFixed(2)}` : '—'}</span>
                              </div>
                              {f.installedBase && (
                                <div className="flex justify-between text-gray-300 pt-1">
                                  <span>Installed Base</span>
                                  <span className="font-medium text-white">{f.installedBase.total.toLocaleString()}</span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Commentary & source */}
                          <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                            <h4 className="text-xs font-semibold text-gray-400 mb-3">Key Commentary</h4>
                            <p className="text-xs text-gray-300 leading-relaxed">{f.keyCommentary}</p>
                            {f.guidanceEps && (
                              <div className="mt-3 text-xs">
                                <span className="text-gray-500">EPS Guidance: </span>
                                <span className="text-white">${f.guidanceEps[0].toFixed(2)}–${f.guidanceEps[1].toFixed(2)}</span>
                              </div>
                            )}
                            <div className="mt-3 pt-3 border-t border-gray-700 text-[10px] text-gray-500">
                              <div>Source: {f.filingSource}</div>
                              <div>Updated: {f.lastUpdated}</div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
