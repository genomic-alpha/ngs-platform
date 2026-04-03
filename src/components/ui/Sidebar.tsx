import { useState } from 'react';
import { INDICATIONS } from '@/core/constants';
import type { IndicationKey, ViewId } from '@/core/types';

interface NavItem {
  name: string;
  key: ViewId;
}

interface NavGroup {
  group: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    group: 'OVERVIEW',
    items: [{ name: 'Dashboard', key: 'dashboard' }],
  },
  {
    group: 'EXPLORE',
    items: [
      { name: 'Products', key: 'products' },
      { name: 'Vendors', key: 'vendors' },
      { name: 'Compare', key: 'compare' },
    ],
  },
  {
    group: 'WORKFLOW',
    items: [
      { name: 'Compatibility', key: 'compatibility' },
      { name: 'TCO Calculator', key: 'tco' },
    ],
  },
  {
    group: 'STRATEGY',
    items: [
      { name: 'Indication Strategy', key: 'indication' },
      { name: 'Scenarios', key: 'scenarios' },
      { name: 'Partners', key: 'partners' },
    ],
  },
  {
    group: 'INTELLIGENCE',
    items: [
      { name: 'Timeline', key: 'timeline' },
      { name: 'Signals', key: 'signals' },
    ],
  },
  {
    group: 'META',
    items: [
      { name: 'Validation', key: 'validation' },
      { name: 'Data Quality', key: 'data quality' },
      { name: 'Regulatory', key: 'regulatory' },
    ],
  },
  {
    group: 'ADMIN',
    items: [{ name: 'Data Editor', key: 'admin' }],
  },
];

interface SidebarProps {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  indicationFilter: IndicationKey[];
}

export function Sidebar({ activeView, setActiveView, indicationFilter }: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const navContent = (
    <>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-1">NGS Intel v5</h1>
        <p className="text-xs text-gray-400">Market Intelligence Platform</p>
      </div>

      <nav className="space-y-6" aria-label="Main navigation">
        {navGroups.map((group, i) => (
          <div key={i} role="group" aria-labelledby={`nav-group-${i}`}>
            <h2 id={`nav-group-${i}`} className="text-xs font-semibold text-gray-600 uppercase tracking-wide mb-2">{group.group}</h2>
            <div className="space-y-1" role="list">
              {group.items.map(item => (
                <button
                  key={item.key}
                  onClick={() => { setActiveView(item.key); setMobileOpen(false); }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 focus:ring-offset-gray-900 ${
                    activeView === item.key
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800'
                  }`}
                  role="listitem"
                  aria-current={activeView === item.key ? 'page' : undefined}
                >
                  {item.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {indicationFilter.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-800" role="status" aria-label="Active filters">
          <p className="text-xs text-gray-500 uppercase font-semibold tracking-wide mb-2">Filter:</p>
          <div className="flex flex-wrap gap-1">
            {indicationFilter.map(key => {
              const ind = INDICATIONS.find(i => i.key === key);
              return (
                <span
                  key={key}
                  className="text-xs px-2 py-1 rounded bg-gray-800"
                  style={{ color: ind?.color }}
                  role="status"
                >
                  {ind?.icon} {ind?.label}
                </span>
              );
            })}
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      {/* Mobile hamburger toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 bg-gray-800 rounded-lg border border-gray-700 text-gray-300 hover:text-white lg:hidden focus:outline-none focus:ring-2 focus:ring-blue-500"
        aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
        aria-expanded={mobileOpen}
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          {mobileOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          )}
        </svg>
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — desktop: static, mobile: slide-over */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-40
          w-56 bg-gray-900 border-r border-gray-800 p-6 overflow-y-auto
          transform transition-transform duration-200 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
        aria-label="Sidebar navigation"
      >
        {navContent}
      </aside>
    </>
  );
}
