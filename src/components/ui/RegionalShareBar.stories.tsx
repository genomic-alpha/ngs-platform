import type { Meta, StoryObj } from '@storybook/react';
import { RegionalShareBar } from './RegionalShareBar';
import type { RegionalShareMap } from '@/core/types';

const meta = {
  title: 'UI/RegionalShareBar',
  component: RegionalShareBar,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof RegionalShareBar>;

export default meta;
type Story = StoryObj<typeof meta>;

const balancedShare: RegionalShareMap = {
  na: 25,
  we: 25,
  hg: 30,
  od: 20,
};

const naDominantShare: RegionalShareMap = {
  na: 50,
  we: 20,
  hg: 20,
  od: 10,
};

const hgDominantShare: RegionalShareMap = {
  na: 15,
  we: 20,
  hg: 50,
  od: 15,
};

const weHighShare: RegionalShareMap = {
  na: 10,
  we: 60,
  hg: 15,
  od: 15,
};

const singleRegionShare: RegionalShareMap = {
  na: 100,
  we: 0,
  hg: 0,
  od: 0,
};

export const Balanced: Story = {
  args: {
    regionalShare: balancedShare,
  },
};

export const NorthAmericaDominant: Story = {
  args: {
    regionalShare: naDominantShare,
  },
};

export const HighGrowthDominant: Story = {
  args: {
    regionalShare: hgDominantShare,
  },
};

export const WesternEuropeDominant: Story = {
  args: {
    regionalShare: weHighShare,
  },
};

export const SingleRegion: Story = {
  args: {
    regionalShare: singleRegionShare,
  },
};

export const Null: Story = {
  args: {
    regionalShare: null,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg w-96">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Balanced Distribution</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <RegionalShareBar regionalShare={balancedShare} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">North America Dominant (50%)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <RegionalShareBar regionalShare={naDominantShare} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">High-Growth Dominant (50%)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <RegionalShareBar regionalShare={hgDominantShare} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Western Europe Dominant (60%)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <RegionalShareBar regionalShare={weHighShare} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Single Region Only (100% NA)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <RegionalShareBar regionalShare={singleRegionShare} />
        </div>
      </div>
    </div>
  ),
};

export const Legend: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gray-950 rounded-lg">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Region Legend</h3>
        <div className="space-y-2 text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: '#ef4444' }}></div>
            <span>NA - North America</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: '#10b981' }}></div>
            <span>WE - Western Europe</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: '#f59e0b' }}></div>
            <span>HG - High-Growth</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-2 rounded-full" style={{ backgroundColor: '#8b5cf6' }}></div>
            <span>OD - Other Developed</span>
          </div>
        </div>
      </div>
    </div>
  ),
};
