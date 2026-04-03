import type { Meta, StoryObj } from '@storybook/react';
import { ConfidenceDot } from './ConfidenceDot';
import type { ConfidenceMetadata } from '@/core/types';

const meta = {
  title: 'UI/ConfidenceDot',
  component: ConfidenceDot,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof ConfidenceDot>;

export default meta;
type Story = StoryObj<typeof meta>;

const verifiedConf: ConfidenceMetadata = {
  level: 'verified',
  source: 'FDA Database',
  date: '2024-03-15',
};

const estimatedConf: ConfidenceMetadata = {
  level: 'estimated',
  source: 'Market Research',
  date: '2024-02-20',
};

const approximateConf: ConfidenceMetadata = {
  level: 'approximate',
  source: 'Internal Analysis',
  date: '2024-01-10',
};

const unverifiedConf: ConfidenceMetadata = {
  level: 'unverified',
  source: 'User Submission',
  date: '2024-03-01',
};

const lowConf: ConfidenceMetadata = {
  level: 'low',
  source: 'Industry Report',
  date: '2023-12-15',
};

export const Verified: Story = {
  args: {
    conf: verifiedConf,
  },
};

export const Estimated: Story = {
  args: {
    conf: estimatedConf,
  },
};

export const Approximate: Story = {
  args: {
    conf: approximateConf,
  },
};

export const Unverified: Story = {
  args: {
    conf: unverifiedConf,
  },
};

export const Low: Story = {
  args: {
    conf: lowConf,
  },
};

export const Null: Story = {
  args: {
    conf: null,
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-8 bg-gray-950 rounded-lg">
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Verified</h3>
        <div className="text-sm text-gray-400">
          Market Share: 35%
          <ConfidenceDot conf={verifiedConf} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Estimated</h3>
        <div className="text-sm text-gray-400">
          Pricing: $250
          <ConfidenceDot conf={estimatedConf} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Approximate</h3>
        <div className="text-sm text-gray-400">
          Regional Share: 42%
          <ConfidenceDot conf={approximateConf} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Unverified</h3>
        <div className="text-sm text-gray-400">
          Regulatory: FDA PMA
          <ConfidenceDot conf={unverifiedConf} />
        </div>
      </div>
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Low</h3>
        <div className="text-sm text-gray-400">
          Clinical Data: Updated
          <ConfidenceDot conf={lowConf} />
        </div>
      </div>
    </div>
  ),
};
