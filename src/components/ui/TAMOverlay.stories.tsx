import type { Meta, StoryObj } from '@storybook/react';
import { TAMOverlay } from './TAMOverlay';
import { DataProvider } from '@/store';

const meta = {
  title: 'UI/TAMOverlay',
  component: TAMOverlay,
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
} satisfies Meta<typeof TAMOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HighShare: Story = {
  args: {
    share: 45,
    category: 'Sequencing',
  },
};

export const MediumShare: Story = {
  args: {
    share: 25,
    category: 'Library Prep',
  },
};

export const LowShare: Story = {
  args: {
    share: 8,
    category: 'Analysis',
  },
};

export const ZeroShare: Story = {
  args: {
    share: 0,
    category: 'Reporting',
  },
};

export const NoShare: Story = {
  args: {
    share: undefined,
    category: 'Extraction',
  },
};

export const WithIndication: Story = {
  args: {
    share: 30,
    indication: 'solid_tumor',
  },
};

export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg">
      <div className="space-y-3">
        <p className="text-xs text-gray-400">High Share (45% of Sequencing)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          Product Share: 45%
          <TAMOverlay share={45} category="Sequencing" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-400">Medium Share (25% of Library Prep)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          Product Share: 25%
          <TAMOverlay share={25} category="Library Prep" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-400">Low Share (8% of Analysis)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          Product Share: 8%
          <TAMOverlay share={8} category="Analysis" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-400">With Indication Filter (30% of Solid Tumor)</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          Product Share: 30%
          <TAMOverlay share={30} indication="solid_tumor" />
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-gray-400">No Share Data</p>
        <div className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          Product Share: N/A
          <TAMOverlay share={undefined} category="Extraction" />
        </div>
      </div>
    </div>
  ),
};

export const DifferentCategories: Story = {
  render: () => (
    <div className="flex flex-col gap-4 p-6 bg-gray-950 rounded-lg">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">By Category TAM Values</p>
      </div>
      {['Extraction', 'Library Prep', 'Automation', 'Sequencing', 'Analysis', 'Reporting', 'Diagnostic Services'].map((cat) => (
        <div key={cat} className="p-3 bg-gray-900 rounded border border-gray-800 text-sm text-gray-300">
          {cat}: 35%
          <TAMOverlay share={35} category={cat} />
        </div>
      ))}
    </div>
  ),
};
