import type { Dispatch, SetStateAction } from 'react';
import { INDICATIONS } from '@/core/constants';
import type { IndicationKey } from '@/core/types';

interface IndicationFilterBarProps {
  indicationFilter: IndicationKey[];
  setIndicationFilter: Dispatch<SetStateAction<IndicationKey[]>>;
}

export function IndicationFilterBar({ indicationFilter, setIndicationFilter }: IndicationFilterBarProps) {
  const toggleIndication = (key: IndicationKey) => {
    setIndicationFilter(prev =>
      prev.includes(key)
        ? prev.filter(k => k !== key)
        : [...prev, key]
    );
  };

  return (
    <div className="mb-6 p-4 bg-gray-900 border border-gray-800 rounded-lg">
      <div className="flex flex-wrap gap-2 items-center">
        <button
          onClick={() => setIndicationFilter([])}
          className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
            indicationFilter.length === 0
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
          }`}
        >
          All Indications
        </button>
        {INDICATIONS.map(ind => (
          <button
            key={ind.key}
            onClick={() => toggleIndication(ind.key)}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all flex items-center gap-1"
            style={{
              backgroundColor: indicationFilter.includes(ind.key)
                ? `${ind.color}33`
                : '#1f2937',
              color: indicationFilter.includes(ind.key)
                ? ind.color
                : '#9ca3af',
              border: `1px solid ${indicationFilter.includes(ind.key) ? ind.color : 'transparent'}`,
            }}
          >
            <span>{ind.icon}</span>
            <span>{ind.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
