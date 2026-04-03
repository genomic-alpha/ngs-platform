import React from 'react';
import { DollarSign } from 'lucide-react';

export const FinancialTab: React.FC = () => {
  return (
    <div
      style={{
        backgroundColor: '#fffbeb',
        border: '2px solid #fbbf24',
        borderRadius: '8px',
        padding: '32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
      }}
    >
      <DollarSign size={48} style={{ color: '#d97706' }} />
      <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#92400e' }}>
        Financial Intel Tab
      </h2>
      <p style={{ margin: 0, fontSize: '14px', color: '#b45309', maxWidth: '400px' }}>
        Financial Intel tab — coming in Phase 1 Week 2. This will include revenue analysis, margin
        trends, R&D spend, guidance data, and profitability metrics for selected vendors.
      </p>
    </div>
  );
};
