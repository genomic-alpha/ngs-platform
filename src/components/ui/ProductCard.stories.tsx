import type { Meta, StoryObj } from '@storybook/react';
import { ProductCard } from './ProductCard';
import type { Product } from '@/core/types';
import { DataProvider } from '@/store';

const meta = {
  title: 'UI/ProductCard',
  component: ProductCard,
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
} satisfies Meta<typeof ProductCard>;

export default meta;
type Story = StoryObj<typeof meta>;

const tierAProduct: Product = {
  id: 'prod_a1',
  vendor: 'illumina',
  name: 'NextSeq 2000',
  category: 'Sequencing',
  tier: 'A',
  share: 42,
  pricing: 2500,
  regulatory: 'FDA PMA',
  region: 'global',
  sampleTypes: ['ffpe', 'blood', 'cfdna'],
  nucleicAcids: ['dna', 'rna'],
  regionalShare: {
    na: 50,
    we: 25,
    hg: 15,
    od: 10,
  },
  growth: 'growing',
  indications: ['solid_tumor', 'liquid_biopsy', 'hereditary_cancer'],
  indicationShare: {
    solid_tumor: { global: 40, na: 50, we: 25, hg: 35, od: 20 },
    liquid_biopsy: { global: 45, na: 55, we: 30, hg: 40, od: 25 },
  },
  confidence: {
    share: {
      level: 'verified',
      source: 'FDA Database',
      date: '2024-03-15',
    },
    pricing: {
      level: 'estimated',
      source: 'Market Research',
      date: '2024-02-20',
    },
    regulatory: {
      level: 'verified',
      source: 'FDA Database',
      date: '2024-03-15',
    },
  },
};

const tierBProduct: Product = {
  id: 'prod_b1',
  vendor: 'thermo',
  name: 'Ion Proton System',
  category: 'Sequencing',
  tier: 'B',
  share: 28,
  pricing: 2100,
  regulatory: 'FDA 510(k)',
  region: 'global',
  sampleTypes: ['blood', 'tissue'],
  nucleicAcids: ['dna'],
  regionalShare: {
    na: 35,
    we: 30,
    hg: 25,
    od: 10,
  },
  growth: 'stable',
  indications: ['solid_tumor', 'heme_malig'],
  indicationShare: {
    solid_tumor: { global: 30, na: 35, we: 25, hg: 30, od: 20 },
  },
  confidence: {
    share: {
      level: 'estimated',
      source: 'Market Research',
      date: '2024-02-20',
    },
    pricing: {
      level: 'approximate',
      source: 'Internal Analysis',
      date: '2024-01-10',
    },
    regulatory: {
      level: 'verified',
      source: 'FDA Database',
      date: '2024-03-15',
    },
  },
};

const tierCProduct: Product = {
  id: 'prod_c1',
  vendor: 'oxford',
  name: 'Oxford Nanopore GridION',
  category: 'Sequencing',
  tier: 'C',
  share: 12,
  pricing: 1800,
  regulatory: 'RUO',
  region: 'global',
  sampleTypes: ['dna'],
  nucleicAcids: ['dna'],
  regionalShare: {
    na: 20,
    we: 25,
    hg: 40,
    od: 15,
  },
  growth: 'emerging',
  indications: ['rare_disease', 'infectious_disease'],
  indicationShare: {
    rare_disease: { global: 25, na: 20, we: 30, hg: 40, od: 20 },
  },
  confidence: {
    share: {
      level: 'approximate',
      source: 'Internal Analysis',
      date: '2024-01-10',
    },
    pricing: {
      level: 'estimated',
      source: 'Market Research',
      date: '2024-02-20',
    },
    regulatory: {
      level: 'unverified',
      source: 'User Submission',
      date: '2024-03-01',
    },
  },
};

const prelaunchProduct: Product = {
  id: 'prod_new1',
  vendor: 'new_vendor',
  name: 'NextGen Analyzer Pro',
  category: 'Analysis',
  tier: 'B',
  share: 0,
  pricing: 0,
  regulatory: 'In Development',
  region: 'global',
  sampleTypes: ['cfdna'],
  nucleicAcids: ['dna', 'rna'],
  regionalShare: {
    na: 0,
    we: 0,
    hg: 0,
    od: 0,
  },
  growth: 'pre-launch',
  indications: ['liquid_biopsy', 'hereditary_cancer', 'pharmacogenomics'],
  indicationShare: {},
  confidence: {
    share: {
      level: 'low',
      source: 'Industry Report',
      date: '2023-12-15',
    },
    pricing: {
      level: 'low',
      source: 'Industry Report',
      date: '2023-12-15',
    },
    regulatory: {
      level: 'low',
      source: 'Industry Report',
      date: '2023-12-15',
    },
  },
};

export const TierA: Story = {
  args: {
    product: tierAProduct,
  },
};

export const TierB: Story = {
  args: {
    product: tierBProduct,
  },
};

export const TierC: Story = {
  args: {
    product: tierCProduct,
  },
};

export const PreLaunch: Story = {
  args: {
    product: prelaunchProduct,
  },
};

export const WithHighConfidence: Story = {
  args: {
    product: tierAProduct,
  },
};

export const WithMixedConfidence: Story = {
  args: {
    product: tierBProduct,
  },
};

export const WithLowConfidence: Story = {
  args: {
    product: tierCProduct,
  },
};

export const AllTiers: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg w-full max-w-2xl">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Tier A - Market Leader</p>
        <ProductCard product={tierAProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Tier B - Established Player</p>
        <ProductCard product={tierBProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Tier C - Growing Challenger</p>
        <ProductCard product={tierCProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Pre-Launch - Future Product</p>
        <ProductCard product={prelaunchProduct} />
      </div>
    </div>
  ),
};

export const DifferentGrowthStages: Story = {
  render: () => (
    <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg w-full max-w-2xl">
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Growing Status</p>
        <ProductCard product={tierAProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Stable Status</p>
        <ProductCard product={tierBProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Emerging Status</p>
        <ProductCard product={tierCProduct} />
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold text-gray-400">Pre-Launch Status</p>
        <ProductCard product={prelaunchProduct} />
      </div>
    </div>
  ),
};

export const DifferentRegulations: Story = {
  render: () => {
    const products = [
      { ...tierAProduct, regulatory: 'FDA PMA', id: 'prod_fda_pma' },
      { ...tierBProduct, regulatory: 'FDA 510(k)', id: 'prod_fda_510' },
      { ...tierCProduct, regulatory: 'CE-IVDR', id: 'prod_ce_ivdr' },
    ];

    return (
      <div className="flex flex-col gap-6 p-6 bg-gray-950 rounded-lg w-full max-w-2xl">
        {products.map((product) => (
          <div key={product.id} className="space-y-2">
            <p className="text-xs font-semibold text-gray-400">{product.regulatory}</p>
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    );
  },
};
