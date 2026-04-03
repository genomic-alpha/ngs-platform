import type { Meta, StoryObj } from '@storybook/react';
import { IndicationFilterBar } from './IndicationFilterBar';
import type { IndicationKey } from '@/core/types';
import { useState } from 'react';

const meta = {
  title: 'UI/IndicationFilterBar',
  component: IndicationFilterBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof IndicationFilterBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const IndicationFilterBarWithState = ({
  initialFilter = [] as IndicationKey[],
}: {
  initialFilter?: IndicationKey[];
}) => {
  const [indicationFilter, setIndicationFilter] = useState<IndicationKey[]>(initialFilter);

  return (
    <div className="w-full bg-gray-950 p-6 rounded-lg">
      <IndicationFilterBar indicationFilter={indicationFilter} setIndicationFilter={setIndicationFilter} />
      <div className="mt-4 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs text-gray-400 font-semibold mb-2">Selected Indications:</p>
        {indicationFilter.length === 0 ? (
          <p className="text-xs text-gray-500">All indications selected</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {indicationFilter.map((ind) => (
              <span key={ind} className="px-2 py-1 bg-gray-800 rounded text-xs text-gray-300">
                {ind}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const NoSelection: Story = {
  render: () => <IndicationFilterBarWithState />,
};

export const WithSingleSelection: Story = {
  render: () => <IndicationFilterBarWithState initialFilter={['solid_tumor']} />,
};

export const WithMultipleSelection: Story = {
  render: () => (
    <IndicationFilterBarWithState
      initialFilter={['solid_tumor', 'liquid_biopsy', 'hereditary_cancer', 'pharmacogenomics']}
    />
  ),
};

export const AllIndicationsSelected: Story = {
  render: () => (
    <IndicationFilterBarWithState
      initialFilter={[
        'solid_tumor',
        'liquid_biopsy',
        'hereditary_cancer',
        'heme_malig',
        'rare_disease',
        'pharmacogenomics',
        'hla_typing',
        'infectious_disease',
      ]}
    />
  ),
};

export const Interactive: Story = {
  render: () => {
    const [indicationFilter, setIndicationFilter] = useState<IndicationKey[]>([]);

    return (
      <div className="w-full max-w-4xl bg-gray-950 p-6 rounded-lg space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-300 mb-4">
            Interactive Filter - Click to toggle indications
          </h3>
          <IndicationFilterBar indicationFilter={indicationFilter} setIndicationFilter={setIndicationFilter} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-gray-900 rounded border border-gray-800">
            <p className="text-xs text-gray-400 font-semibold mb-2">Filter Count</p>
            <p className="text-lg font-bold text-emerald-400">{indicationFilter.length}</p>
          </div>
          <div className="p-4 bg-gray-900 rounded border border-gray-800">
            <p className="text-xs text-gray-400 font-semibold mb-2">Status</p>
            <p className="text-sm text-gray-300">
              {indicationFilter.length === 0 ? 'All indications' : `Filtered to ${indicationFilter.length}`}
            </p>
          </div>
        </div>

        {indicationFilter.length > 0 && (
          <div className="p-4 bg-gray-900 rounded border border-gray-800">
            <p className="text-xs text-gray-400 font-semibold mb-2">Active Filters</p>
            <div className="flex flex-wrap gap-2">
              {indicationFilter.map((ind) => (
                <span key={ind} className="px-2 py-1 bg-blue-900/30 rounded text-xs text-blue-300">
                  {ind.replace(/_/g, ' ')}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  },
};

export const AllIndicationLabels: Story = {
  render: () => (
    <div className="w-full max-w-2xl bg-gray-950 p-6 rounded-lg">
      <h3 className="text-sm font-semibold text-gray-300 mb-4">Available Indications</h3>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ef4444' }}></span>
          <span>🎯 Solid Tumor</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#f97316' }}></span>
          <span>🩸 Liquid Biopsy</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#a855f7' }}></span>
          <span>🧬 Hereditary Cancer</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#ec4899' }}></span>
          <span>🔬 Heme Malignancies</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#14b8a6' }}></span>
          <span>🔍 Rare Disease</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#6366f1' }}></span>
          <span>💊 Pharmacogenomics</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0ea5e9' }}></span>
          <span>🏥 HLA Typing</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <span className="w-4 h-4 rounded-full" style={{ backgroundColor: '#84cc16' }}></span>
          <span>🦠 Infectious Disease</span>
        </div>
      </div>
    </div>
  ),
};
