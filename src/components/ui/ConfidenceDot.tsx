import { useState } from 'react';
import type { ConfidenceMetadata } from '@/core/types';

interface ConfidenceDotProps {
  conf?: ConfidenceMetadata | null;
}

export function ConfidenceDot({ conf }: ConfidenceDotProps) {
  const [showTip, setShowTip] = useState(false);
  if (!conf) return null;
  const colors: Record<string, string> = { verified: '#34d399', estimated: '#6c8cff', approximate: '#fbbf24', unverified: '#ef4444', low: '#ef4444' };
  return (
    <span className="relative inline-block ml-1" onMouseEnter={() => setShowTip(true)} onMouseLeave={() => setShowTip(false)}>
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: colors[conf.level] || '#8b90a5' }} />
      {showTip && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2.5 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-xs whitespace-nowrap z-50 shadow-lg">
          <span className="font-bold capitalize" style={{ color: colors[conf.level] }}>{conf.level}</span>
          <br /><span className="text-gray-400">{conf.source}</span>
          <br /><span className="text-gray-500">{conf.date}</span>
        </span>
      )}
    </span>
  );
}
