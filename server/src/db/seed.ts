import pool from './pool';
import { DEFAULT_VENDORS } from '../../../src/core/data/vendors';
import { DEFAULT_PRODUCTS } from '../../../src/core/data/products';
import { DEFAULT_TIMELINE_EVENTS } from '../../../src/core/data/timeline';
import { DEFAULT_COMPATIBILITY_LAYERS, COMPATIBILITY_ENTRIES_PART_A } from '../../../src/core/data/compatibility-layers';
import { COMPATIBILITY_ENTRIES_PART_B } from '../../../src/core/data/compatibility-entries';
import { DEFAULT_HISTORICAL_SNAPSHOTS } from '../../../src/core/data/historical';
import { DEFAULT_MARKET_SIZE } from '../../../src/core/data/market-size';
import { DEFAULT_INTEL_SIGNALS } from '../../../src/core/data/signals';
import { DEFAULT_COST_COMPONENTS } from '../../../src/core/data/costs';
import { DEFAULT_PARTNERS } from '../../../src/core/data/partners';
import { DEFAULT_FINANCIALS } from '../../../src/core/data/financials';

async function seedVendors() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const vendor of DEFAULT_VENDORS) {
      await client.query(
        `INSERT INTO vendors (key, label, color, strength, weakness, recent_move, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (key) DO UPDATE SET
         label = $2, color = $3, strength = $4, weakness = $5, recent_move = $6, updated_at = NOW()`,
        [vendor.key, vendor.label, vendor.color, vendor.strength, vendor.weakness, vendor.recentMove]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_VENDORS.length} vendors`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedProducts() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const product of DEFAULT_PRODUCTS) {
      await client.query(
        `INSERT INTO products (id, vendor_key, name, category, tier, share, pricing, regulatory, region, growth, regional_share, confidence, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
         name = $3, tier = $5, share = $6, pricing = $7, regulatory = $8, growth = $10, regional_share = $11, confidence = $12, updated_at = NOW()`,
        [
          product.id,
          product.vendor,
          product.name,
          product.category,
          product.tier || null,
          product.share,
          product.pricing,
          product.regulatory || null,
          product.region,
          product.growth || null,
          JSON.stringify(product.regionalShare || {}),
          JSON.stringify(product.confidence || {}),
        ]
      );

      // Insert sample types
      if (product.sampleTypes && product.sampleTypes.length > 0) {
        for (const sampleType of product.sampleTypes) {
          await client.query(
            `INSERT INTO product_sample_types (product_id, sample_type) VALUES ($1, $2)
             ON CONFLICT (product_id, sample_type) DO NOTHING`,
            [product.id, sampleType]
          );
        }
      }

      // Insert nucleic acids
      if (product.nucleicAcids && product.nucleicAcids.length > 0) {
        for (const nucleicAcid of product.nucleicAcids) {
          await client.query(
            `INSERT INTO product_nucleic_acids (product_id, nucleic_acid) VALUES ($1, $2)
             ON CONFLICT (product_id, nucleic_acid) DO NOTHING`,
            [product.id, nucleicAcid]
          );
        }
      }

      // Insert indications if indicationShare exists
      if (product.indications && product.indications.length > 0) {
        for (const indication of product.indications) {
          const indicationShare = (product.indicationShare as any)?.[indication] || null;
          await client.query(
            `INSERT INTO product_indications (product_id, indication_key, indication_share) VALUES ($1, $2, $3)
             ON CONFLICT (product_id, indication_key) DO UPDATE SET indication_share = $3`,
            [product.id, indication, indicationShare ? JSON.stringify(indicationShare) : null]
          );
        }
      }
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_PRODUCTS.length} products with junction tables`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedCompatibility() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Seed compatibility layers first
    for (const layer of DEFAULT_COMPATIBILITY_LAYERS) {
      await client.query(
        `INSERT INTO compatibility_layers (key, label, source_category, target_category) VALUES ($1, $2, $3, $4)
         ON CONFLICT (key) DO UPDATE SET label = $2, source_category = $3, target_category = $4`,
        [layer.key, layer.label, layer.source, layer.target]
      );
    }

    // Combine both parts of compatibility entries
    const allEntries = [...COMPATIBILITY_ENTRIES_PART_A, ...COMPATIBILITY_ENTRIES_PART_B];

    for (const entry of allEntries) {
      await client.query(
        `INSERT INTO compatibility (source_product, target_product, layer, level, notes, protocol, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
         ON CONFLICT (source_product, target_product, layer) DO UPDATE SET
         level = $4, notes = $5, protocol = $6, updated_at = NOW()`,
        [entry.source, entry.target, entry.layer, entry.level || null, entry.notes || null, entry.protocol || null]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_COMPATIBILITY_LAYERS.length} compatibility layers and ${allEntries.length} entries`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedMarketSize() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const marketData = DEFAULT_MARKET_SIZE;
    await client.query(
      `INSERT INTO market_size (year, total_ngs, cagr, by_category, by_indication, by_region, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (year) DO UPDATE SET
       total_ngs = $2, cagr = $3, by_category = $4, by_indication = $5, by_region = $6, updated_at = NOW()`,
      [
        marketData.year,
        marketData.totalNGS || null,
        marketData.cagr || null,
        JSON.stringify(marketData.byCategory || {}),
        JSON.stringify(marketData.byIndication || {}),
        JSON.stringify(marketData.byRegion || {}),
      ]
    );
    await client.query('COMMIT');
    console.log(`✓ Seeded market size for year ${marketData.year}`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedFinancials() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [vendorKey, profile] of Object.entries(DEFAULT_FINANCIALS)) {
      await client.query(
        `INSERT INTO financial_profiles (vendor_key, ticker, last_fy, revenue, segment_revenue, revenue_growth, gross_margin, op_margin, rd_spend, rd_pct, eps_non_gaap, cash, total_debt, market_cap, guidance_revenue, guidance_eps, key_commentary, filing_source, profitable, quarterly, balance_sheet, installed_base, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, NOW())
         ON CONFLICT (vendor_key) DO UPDATE SET
         ticker = $2, last_fy = $3, revenue = $4, segment_revenue = $5, revenue_growth = $6, gross_margin = $7, op_margin = $8, rd_spend = $9, rd_pct = $10, eps_non_gaap = $11, cash = $12, total_debt = $13, market_cap = $14, guidance_revenue = $15, guidance_eps = $16, key_commentary = $17, filing_source = $18, profitable = $19, quarterly = $20, balance_sheet = $21, installed_base = $22, updated_at = NOW()`,
        [
          vendorKey,
          (profile as any).ticker || null,
          (profile as any).lastFy || null,
          (profile as any).revenue || null,
          (profile as any).segmentRevenue || null,
          (profile as any).revenueGrowth || null,
          (profile as any).grossMargin || null,
          (profile as any).opMargin || null,
          (profile as any).rdSpend || null,
          (profile as any).rdPct || null,
          (profile as any).epsNonGaap || null,
          (profile as any).cash || null,
          (profile as any).totalDebt || null,
          (profile as any).marketCap || null,
          JSON.stringify((profile as any).guidanceRevenue || {}),
          JSON.stringify((profile as any).guidanceEps || {}),
          (profile as any).keyCommentary || null,
          (profile as any).filingSource || null,
          (profile as any).profitable || null,
          JSON.stringify((profile as any).quarterly || {}),
          JSON.stringify((profile as any).balanceSheet || {}),
          (profile as any).installedBase ? JSON.stringify((profile as any).installedBase) : null,
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${Object.keys(DEFAULT_FINANCIALS).length} financial profiles`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedIntelSignals() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const signal of DEFAULT_INTEL_SIGNALS) {
      await client.query(
        `INSERT INTO intel_signals (id, date, type, vendor, title, impact, summary, source, products, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
         date = $2, type = $3, vendor = $4, title = $5, impact = $6, summary = $7, source = $8, products = $9, updated_at = NOW()`,
        [
          signal.id,
          signal.date,
          signal.type,
          signal.vendor || null,
          signal.title,
          signal.impact || null,
          signal.summary || null,
          signal.source || null,
          JSON.stringify(signal.products || []),
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_INTEL_SIGNALS.length} intel signals`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedCostComponents() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    let count = 0;
    for (const [productId, component] of Object.entries(DEFAULT_COST_COMPONENTS)) {
      await client.query(
        `INSERT INTO cost_components (id, category, component, per_sample, per_run, annual, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET
         category = $2, component = $3, per_sample = $4, per_run = $5, annual = $6, notes = $7`,
        [
          productId,
          'cost_breakdown',
          JSON.stringify(component),
          (component as any).total || null,
          null,
          null,
          null,
        ]
      );
      count++;
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${count} cost components`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedTimelineEvents() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const event of DEFAULT_TIMELINE_EVENTS) {
      await client.query(
        `INSERT INTO timeline_events (year, event, vendor, impact)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (year, event) DO UPDATE SET vendor = $3, impact = $4`,
        [event.year, event.event, event.vendor || null, event.impact || null]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_TIMELINE_EVENTS.length} timeline events`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedHistoricalSnapshots() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const snapshot of DEFAULT_HISTORICAL_SNAPSHOTS) {
      await client.query(
        `INSERT INTO historical_snapshots (quarter, data, created_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (quarter) DO UPDATE SET data = $2, created_at = NOW()`,
        [snapshot.quarter, JSON.stringify(snapshot.data || {})]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_HISTORICAL_SNAPSHOTS.length} historical snapshots`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedPartners() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const partner of DEFAULT_PARTNERS) {
      await client.query(
        `INSERT INTO partners (id, name, vendor_key, status, tier, health_score, contract_start, contract_end, annual_value, products_used, integration_status, notes, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
         name = $2, vendor_key = $3, status = $4, tier = $5, health_score = $6, contract_start = $7, contract_end = $8, annual_value = $9, products_used = $10, integration_status = $11, notes = $12, updated_at = NOW()`,
        [
          partner.id,
          (partner as any).primaryContact || null,
          (partner as any).vendorKey || null,
          partner.status || null,
          partner.tier || null,
          (partner as any).healthScore || null,
          (partner as any).contractStart || null,
          (partner as any).contractEnd || null,
          (partner as any).contractValue || null,
          JSON.stringify((partner as any).validatedProducts || []),
          (partner as any).integrationStatus || null,
          (partner as any).integrationNotes || null,
        ]
      );
    }
    await client.query('COMMIT');
    console.log(`✓ Seeded ${DEFAULT_PARTNERS.length} partners`);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function seedAdminUser() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Simple hash for demo (in production, use bcrypt)
    const hashedPassword = Buffer.from('admin123').toString('base64');
    await client.query(
      `INSERT INTO users (id, email, password_hash, display_name, role, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (email) DO UPDATE SET password_hash = $3, role = $5, updated_at = NOW()`,
      ['admin-00000000-0000-0000-0000-000000000000', 'admin@ngs-platform.local', hashedPassword, 'Admin User', 'admin']
    );
    await client.query('COMMIT');
    console.log('✓ Seeded default admin user (admin@ngs-platform.local)');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function truncateTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const tables = [
      'audit_logs',
      'partners',
      'historical_snapshots',
      'timeline_events',
      'cost_components',
      'intel_signals',
      'financial_profiles',
      'market_size',
      'compatibility',
      'compatibility_layers',
      'product_nucleic_acids',
      'product_sample_types',
      'product_indications',
      'products',
      'vendors',
    ];
    for (const table of tables) {
      await client.query(`TRUNCATE TABLE ${table} CASCADE`);
    }
    await client.query('COMMIT');
    console.log('✓ Cleared existing data');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

async function printSummary() {
  const tables = [
    'vendors',
    'products',
    'product_indications',
    'product_sample_types',
    'product_nucleic_acids',
    'compatibility_layers',
    'compatibility',
    'market_size',
    'financial_profiles',
    'intel_signals',
    'cost_components',
    'timeline_events',
    'historical_snapshots',
    'partners',
  ];

  console.log('\n=== SEED SUMMARY ===');
  for (const table of tables) {
    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
    const count = result.rows[0].count;
    console.log(`${table}: ${count} rows`);
  }
}

async function seed() {
  try {
    console.log('Starting database seeding...\n');
    await truncateTables();
    await seedVendors();
    await seedProducts();
    await seedCompatibility();
    await seedMarketSize();
    await seedFinancials();
    await seedIntelSignals();
    await seedCostComponents();
    await seedTimelineEvents();
    await seedHistoricalSnapshots();
    await seedPartners();
    await seedAdminUser();
    await printSummary();
    console.log('\n✓ Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
