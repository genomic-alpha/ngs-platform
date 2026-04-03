import type { Meta, StoryObj } from '@storybook/react';
import { GrowthBadge } from './GrowthBadge';
import type { GrowthStatus } from '@/core/types';

const meta = {
  title: 'UI/GrowthBadge',
  component: GrowthBadge,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof GrowthBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Growing: Story = {
  args: {
    growth: 'growing' as GrowthStatus,
  },
};

export const Stable: Story = {
  args: {
    growth: 'stable' as GrowthStatus,
  },
};

export const Declining: Story = {
  args: {
    growth: 'declining' as GrowthStatus,
  },
};

export const Emerging: Story = {
  args: {
    growth: 'emerging' as GrowthStatus,
  },
};

export const PreLaunch: Story = {
  args: {
    growth: 'pre-launch' as GrowthStatus,
  },
};

export const Null: Story = {
  args: {
    growth: null,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gray-950 rounded-lg">
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-400">Growing:</span>
        <GrowthBadge growth="growing" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-400">Stable:</span>
        <GrowthBadge growth="stable" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-400">Declining:</span>
        <GrowthBadge growth="declining" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-400">Emerging:</span>
        <GrowthBadge growth="emerging" />
      </div>
      <div className="flex gap-2 items-center flex-wrap">
        <span className="text-sm text-gray-400">Pre-Launch:</span>
        <GrowthBadge growth="pre-launch" />
      </div>
    </div>
  ),
};
