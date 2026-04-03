import type { Meta, StoryObj } from '@storybook/react';
import { Sidebar } from './Sidebar';
import type { ViewId, IndicationKey } from '@/core/types';
import { useState } from 'react';

const meta = {
  title: 'UI/Sidebar',
  component: Sidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

const SidebarWithState = ({
  initialView = 'dashboard' as ViewId,
  initialFilter = [] as IndicationKey[],
}: {
  initialView?: ViewId;
  initialFilter?: IndicationKey[];
}) => {
  const [activeView, setActiveView] = useState<ViewId>(initialView);
  const [indicationFilter, setIndicationFilter] = useState<IndicationKey[]>(initialFilter);

  return (
    <div className="flex bg-gray-950 min-h-screen">
      <Sidebar activeView={activeView} setActiveView={setActiveView} indicationFilter={indicationFilter} />
      <div className="flex-1 p-6">
        <div className="text-gray-300">
          <h2 className="text-lg font-semibold mb-2">Active View: {activeView}</h2>
          <p className="text-sm text-gray-400">
            {indicationFilter.length > 0
              ? `Filtered by: ${indicationFilter.join(', ')}`
              : 'No indication filter applied'}
          </p>
        </div>
      </div>
    </div>
  );
};

export const Default: Story = {
  render: () => <SidebarWithState />,
};

export const ProductsView: Story = {
  render: () => <SidebarWithState initialView="products" />,
};

export const IndicationStrategyView: Story = {
  render: () => <SidebarWithState initialView="indication" />,
};

export const WithSingleFilter: Story = {
  render: () => <SidebarWithState initialFilter={['solid_tumor']} />,
};

export const WithMultipleFilters: Story = {
  render: () => <SidebarWithState initialFilter={['solid_tumor', 'liquid_biopsy', 'hereditary_cancer']} />,
};

export const AdminView: Story = {
  render: () => <SidebarWithState initialView="admin" />,
};

export const AllNavItems: Story = {
  render: () => (
    <div className="grid grid-cols-4 gap-4 p-6 bg-gray-950 rounded-lg">
      <div className="col-span-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-400 mb-4">Navigation Structure</h3>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Overview</p>
        <p className="text-xs text-gray-300">Dashboard</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Explore</p>
        <p className="text-xs text-gray-300">Products</p>
        <p className="text-xs text-gray-300">Vendors</p>
        <p className="text-xs text-gray-300">Compare</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Workflow</p>
        <p className="text-xs text-gray-300">Compatibility</p>
        <p className="text-xs text-gray-300">TCO Calculator</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Strategy</p>
        <p className="text-xs text-gray-300">Indication Strategy</p>
        <p className="text-xs text-gray-300">Scenarios</p>
        <p className="text-xs text-gray-300">Partners</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Intelligence</p>
        <p className="text-xs text-gray-300">Timeline</p>
        <p className="text-xs text-gray-300">Signals</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Meta</p>
        <p className="text-xs text-gray-300">Validation</p>
        <p className="text-xs text-gray-300">Data Quality</p>
        <p className="text-xs text-gray-300">Regulatory</p>
      </div>

      <div className="space-y-2 p-4 bg-gray-900 rounded border border-gray-800">
        <p className="text-xs font-semibold text-gray-400 uppercase mb-3">Admin</p>
        <p className="text-xs text-gray-300">Data Editor</p>
      </div>
    </div>
  ),
};
