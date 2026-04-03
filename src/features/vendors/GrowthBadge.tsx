import React from 'react';

interface GrowthBadgeProps {
  status: string;
}

export const GrowthBadge: React.FC<GrowthBadgeProps> = ({ status }) => {
  const colors: Record<string, string> = {
    growing: '#22c55e',
    stable: '#3b82f6',
    declining: '#ef4444',
    emerging: '#f59e0b',
    'pre-launch': '#8b5cf6',
  };
  const labels: Record<string, string> = {
    growing: 'Growing',
    stable: 'Stable',
    declining: 'Declining',
    emerging: 'Emerging',
    'pre-launch': 'Pre-Launch',
  };

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '4px 8px',
        borderRadius: '4px',
        backgroundColor: colors[status] || '#9ca3af',
        color: '#fff',
        fontSize: '12px',
        fontWeight: 500,
      }}
    >
      {labels[status] || status}
    </span>
  );
};
