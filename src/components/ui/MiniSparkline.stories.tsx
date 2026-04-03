import type { Meta, StoryObj } from '@storybook/react';
import { MiniSparkline } from './MiniSparkline';
import { DataProvider } from '@/store';
import type { HistoricalSnapshot } from '@/core/types';

const meta = {
  title: 'UI/MiniSparkline',
  component: MiniSparkline,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <DataProvider>
        <Story />
      </DataProvider>
    ),
  ],
} satisfies Meta<typeof MiniSparkline>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Uptrend: Story = {
  args: {
    productId: 'product_1',
    metric: 'share',
    width: 80,
    height: 24,
  },
};

export const Downtrend: Story = {
  args: {
    productId: 'product_2',
    metric: 'share',
    width: 80,
    height: 24,
  },
};

export const Flat: Story = {
  args: {
    productId: 'product_3',
    metric: 'share',
    width: 80,
    height: 24,
  },
};

export const Volatile: Story = {
  args: {
    productId: 'product_4',
    metric: 'share',
    width: 80,
    height: 24,
  },
};

export const PricingMetric: Story = {
  args: {
    productId: 'product_1',
    metric: 'pricing',
    width: 80,
    height: 24,
  },
};

export const DifferentSizes: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg">
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Small (60x18)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <MiniSparkline productId="product_1" metric="share" width={60} height={18} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Medium (80x24)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <MiniSparkline productId="product_1" metric="share" width={80} height={24} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Large (120x32)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <MiniSparkline productId="product_1" metric="share" width={120} height={32} />
        </div>
      </div>
    </div>
  ),
};

export const AllMetrics: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gray-950 rounded-lg">
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Share Metric</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <MiniSparkline productId="product_1" metric="share" width={80} height={24} />
        </div>
      </div>
      <div className="space-y-2">
        <p className="text-xs text-gray-400">Pricing Metric</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800">
          <MiniSparkline productId="product_1" metric="pricing" width={80} height={24} />
        </div>
      </div>
    </div>
  ),
};
