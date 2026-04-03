/**
 * OpenAPI 3.1 Specification
 *
 * Public API documentation for the NGS Intelligence Platform.
 * Serves the spec as JSON at GET /api/docs/openapi.json
 */

export const openApiSpec = {
  openapi: '3.1.0',
  info: {
    title: 'NGS Intelligence Platform API',
    version: '5.0.0',
    description:
      'REST API for the Next-Generation Sequencing competitive intelligence platform. Provides market data, vendor analytics, pipeline intelligence, scenario modeling, and report generation.',
    contact: { name: 'Platform Team' },
  },
  servers: [
    { url: 'http://localhost:3001', description: 'Local development' },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and user management' },
    { name: 'Vendors', description: 'Vendor profiles and analytics' },
    { name: 'Products', description: 'Product catalog and details' },
    { name: 'Financials', description: 'Vendor financial profiles' },
    { name: 'Market Data', description: 'TAM, cost components, and market sizing' },
    { name: 'Intelligence', description: 'Signals and timeline events' },
    { name: 'Compatibility', description: 'Product compatibility matrix' },
    { name: 'Partners', description: 'Partner ecosystem management' },
    { name: 'Pipelines', description: 'Data pipeline orchestration (SEC, FDA, ClinicalTrials)' },
    { name: 'Scenarios', description: 'What-if scenario modeling' },
    { name: 'Reports', description: 'Report generation and retrieval' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from POST /api/auth/login',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
      Vendor: {
        type: 'object',
        properties: {
          key: { type: 'string', example: 'illumina' },
          name: { type: 'string', example: 'Illumina' },
          hq: { type: 'string', example: 'San Diego, CA' },
          founded: { type: 'integer', example: 1998 },
          employees: { type: 'string', example: '~10,000' },
          publicPrivate: { type: 'string', enum: ['Public', 'Private'] },
          tier: { type: 'string', enum: ['Tier 1', 'Tier 2', 'Tier 3'] },
          categories: { type: 'array', items: { type: 'string' } },
          indications: { type: 'array', items: { type: 'string' } },
          strengths: { type: 'array', items: { type: 'string' } },
          weaknesses: { type: 'array', items: { type: 'string' } },
        },
      },
      Product: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string', example: 'NovaSeq X Plus' },
          vendor: { type: 'string', example: 'illumina' },
          category: { type: 'string', example: 'Sequencing' },
          share: { type: 'number', example: 8.5 },
          cost: { type: 'number', example: 985000 },
          trend: { type: 'string', enum: ['growing', 'stable', 'declining', 'emerging'] },
          regulatoryStatus: { type: 'string', enum: ['FDA Cleared', 'CE-IVD', 'RUO', 'LDT'] },
          indications: { type: 'array', items: { type: 'string' } },
          sampleTypes: { type: 'array', items: { type: 'string' } },
          regions: { type: 'object', additionalProperties: { type: 'number' } },
        },
      },
      FinancialProfile: {
        type: 'object',
        properties: {
          vendorKey: { type: 'string' },
          revenue2023: { type: 'number' },
          revenue2024: { type: 'number' },
          yoyGrowth: { type: 'number' },
          grossMargin: { type: 'number' },
          rndSpend: { type: 'number' },
          marketCap: { type: 'number' },
        },
      },
      IntelSignal: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          title: { type: 'string' },
          type: { type: 'string', enum: ['partnership', 'funding', 'acquisition', 'regulatory', 'product_launch', 'clinical_data', 'market_shift'] },
          impact: { type: 'string', enum: ['high', 'medium', 'low'] },
          date: { type: 'string', format: 'date' },
          vendors: { type: 'array', items: { type: 'string' } },
          summary: { type: 'string' },
          source: { type: 'string' },
        },
      },
      PipelineRun: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          pipeline_name: { type: 'string', enum: ['sec_edgar', 'fda', 'clinical_trials'] },
          status: { type: 'string', enum: ['running', 'completed', 'failed'] },
          started_at: { type: 'string', format: 'date-time' },
          completed_at: { type: 'string', format: 'date-time', nullable: true },
          records_found: { type: 'integer' },
          records_updated: { type: 'integer' },
          error_message: { type: 'string', nullable: true },
        },
      },
      SecFiling: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          vendor_key: { type: 'string' },
          cik: { type: 'string' },
          fiscal_year: { type: 'integer' },
          fiscal_quarter: { type: 'string', nullable: true },
          filing_type: { type: 'string' },
          revenue: { type: 'number', nullable: true },
          net_income: { type: 'number', nullable: true },
          r_and_d: { type: 'number', nullable: true },
          review_status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'auto_approved'] },
        },
      },
      FdaSubmission: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          submission_type: { type: 'string', enum: ['510k', 'pma', 'de_novo', 'eua'] },
          submission_number: { type: 'string' },
          device_name: { type: 'string' },
          applicant: { type: 'string' },
          decision: { type: 'string' },
          decision_date: { type: 'string', format: 'date' },
          matched_vendor_key: { type: 'string', nullable: true },
          matched_product_id: { type: 'string', nullable: true },
        },
      },
      ClinicalTrial: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          nct_id: { type: 'string', example: 'NCT05000001' },
          title: { type: 'string' },
          status: { type: 'string' },
          phase: { type: 'string' },
          sponsor: { type: 'string' },
          conditions: { type: 'array', items: { type: 'string' } },
          matched_vendor_key: { type: 'string', nullable: true },
          matched_product_id: { type: 'string', nullable: true },
        },
      },
      Scenario: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          description: { type: 'string' },
          adjustments: {
            type: 'object',
            description: 'JSONB map of product/vendor adjustments',
            additionalProperties: { type: 'number' },
          },
          is_shared: { type: 'boolean' },
          created_by: { type: 'integer' },
          created_at: { type: 'string', format: 'date-time' },
          updated_at: { type: 'string', format: 'date-time' },
        },
      },
      GeneratedReport: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          report_type: { type: 'string', enum: ['quarterly_update', 'vendor_deep_dive', 'indication_landscape', 'competitive_battlecard'] },
          format: { type: 'string', enum: ['json', 'pdf'] },
          status: { type: 'string', enum: ['pending', 'generating', 'completed', 'failed'] },
          file_path: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time' },
        },
      },
      Partner: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          type: { type: 'string', enum: ['academic', 'government', 'commercial', 'consortium'] },
          status: { type: 'string', enum: ['active', 'pending', 'expired'] },
          healthScore: { type: 'integer', minimum: 0, maximum: 100 },
          contractEnd: { type: 'string', format: 'date', nullable: true },
        },
      },
    },
  },
  security: [{ bearerAuth: [] }],
  paths: {
    // ── Auth ──────────────────────────────────────────
    '/api/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'name'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  name: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created, returns JWT token' },
          '400': { description: 'Validation error' },
          '409': { description: 'Email already registered' },
        },
      },
    },
    '/api/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Authenticate and receive JWT',
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'JWT token returned' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/api/auth/profile': {
      get: {
        tags: ['Auth'],
        summary: 'Get current user profile',
        responses: {
          '200': { description: 'User profile data' },
          '401': { description: 'Not authenticated' },
        },
      },
    },

    // ── Vendors ──────────────────────────────────────
    '/api/vendors': {
      get: {
        tags: ['Vendors'],
        summary: 'List all vendors',
        parameters: [
          { name: 'tier', in: 'query', schema: { type: 'string' }, description: 'Filter by tier' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
        ],
        responses: { '200': { description: 'Array of vendors' } },
      },
    },
    '/api/vendors/{key}': {
      get: {
        tags: ['Vendors'],
        summary: 'Get vendor by key',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Vendor details' },
          '404': { description: 'Vendor not found' },
        },
      },
      put: {
        tags: ['Vendors'],
        summary: 'Update vendor (admin only)',
        parameters: [{ name: 'key', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Vendor' } } } },
        responses: { '200': { description: 'Updated vendor' }, '403': { description: 'Forbidden' } },
      },
    },

    // ── Products ─────────────────────────────────────
    '/api/products': {
      get: {
        tags: ['Products'],
        summary: 'List all products',
        parameters: [
          { name: 'vendor', in: 'query', schema: { type: 'string' }, description: 'Filter by vendor key' },
          { name: 'category', in: 'query', schema: { type: 'string' }, description: 'Filter by category' },
          { name: 'indication', in: 'query', schema: { type: 'string' }, description: 'Filter by indication' },
        ],
        responses: { '200': { description: 'Array of products with joined indications, sample types, regions' } },
      },
    },
    '/api/products/{id}': {
      get: {
        tags: ['Products'],
        summary: 'Get product by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Product details' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Products'],
        summary: 'Update product (admin only)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/Product' } } } },
        responses: { '200': { description: 'Updated product' }, '403': { description: 'Forbidden' } },
      },
    },

    // ── Financials ────────────────────────────────────
    '/api/financials': {
      get: {
        tags: ['Financials'],
        summary: 'List all financial profiles',
        responses: { '200': { description: 'Array of financial profiles' } },
      },
    },
    '/api/financials/{vendorKey}': {
      get: {
        tags: ['Financials'],
        summary: 'Get financial profile for a vendor',
        parameters: [{ name: 'vendorKey', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Financial profile' }, '404': { description: 'Not found' } },
      },
    },

    // ── Market Data ──────────────────────────────────
    '/api/market-data/size': {
      get: {
        tags: ['Market Data'],
        summary: 'Get market sizing (TAM, CAGR, category breakdowns)',
        responses: { '200': { description: 'Market size data' } },
      },
    },
    '/api/market-data/costs': {
      get: {
        tags: ['Market Data'],
        summary: 'Get cost components by category',
        responses: { '200': { description: 'Array of cost components' } },
      },
    },

    // ── Intelligence ─────────────────────────────────
    '/api/intelligence/signals': {
      get: {
        tags: ['Intelligence'],
        summary: 'List intelligence signals',
        parameters: [
          { name: 'impact', in: 'query', schema: { type: 'string', enum: ['high', 'medium', 'low'] } },
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'vendor', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 50 } },
        ],
        responses: { '200': { description: 'Array of signals' } },
      },
    },
    '/api/intelligence/timeline': {
      get: {
        tags: ['Intelligence'],
        summary: 'Get timeline events',
        responses: { '200': { description: 'Array of timeline events' } },
      },
    },

    // ── Compatibility ────────────────────────────────
    '/api/compatibility': {
      get: {
        tags: ['Compatibility'],
        summary: 'Get product compatibility matrix',
        responses: { '200': { description: 'Compatibility entries and layers' } },
      },
    },

    // ── Partners ─────────────────────────────────────
    '/api/partners': {
      get: {
        tags: ['Partners'],
        summary: 'List all partners',
        responses: { '200': { description: 'Array of partners' } },
      },
    },
    '/api/partners/{id}': {
      get: {
        tags: ['Partners'],
        summary: 'Get partner by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Partner details' }, '404': { description: 'Not found' } },
      },
    },

    // ── Pipelines ────────────────────────────────────
    '/api/pipelines/runs': {
      get: {
        tags: ['Pipelines'],
        summary: 'List pipeline runs',
        parameters: [
          { name: 'pipeline', in: 'query', schema: { type: 'string', enum: ['sec_edgar', 'fda', 'clinical_trials'] } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['running', 'completed', 'failed'] } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Array of pipeline runs' } },
      },
    },
    '/api/pipelines/runs/{id}': {
      get: {
        tags: ['Pipelines'],
        summary: 'Get pipeline run details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Pipeline run details' }, '404': { description: 'Not found' } },
      },
    },
    '/api/pipelines/sec-edgar/run': {
      post: {
        tags: ['Pipelines'],
        summary: 'Trigger SEC EDGAR pipeline (analyst+)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  vendorKeys: { type: 'array', items: { type: 'string' }, description: 'Specific vendors to fetch (default: all mapped)' },
                  yearsBack: { type: 'integer', default: 3 },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Pipeline run started, returns run ID' },
          '403': { description: 'Insufficient role' },
        },
      },
    },
    '/api/pipelines/sec-edgar/filings': {
      get: {
        tags: ['Pipelines'],
        summary: 'List SEC filings',
        parameters: [
          { name: 'vendor', in: 'query', schema: { type: 'string' } },
          { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected', 'auto_approved'] } },
        ],
        responses: { '200': { description: 'Array of SEC filings' } },
      },
    },
    '/api/pipelines/sec-edgar/filings/{id}/approve': {
      post: {
        tags: ['Pipelines'],
        summary: 'Approve SEC filing and propagate to financials (analyst+)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { notes: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Filing approved' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/pipelines/sec-edgar/filings/{id}/reject': {
      post: {
        tags: ['Pipelines'],
        summary: 'Reject SEC filing (analyst+)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        requestBody: {
          content: { 'application/json': { schema: { type: 'object', properties: { reason: { type: 'string' } } } } },
        },
        responses: { '200': { description: 'Filing rejected' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/pipelines/sec-edgar/vendors': {
      get: {
        tags: ['Pipelines'],
        summary: 'List SEC vendor CIK mappings',
        responses: { '200': { description: 'Array of CIK-to-vendor mappings' } },
      },
    },
    '/api/pipelines/fda/run': {
      post: {
        tags: ['Pipelines'],
        summary: 'Trigger FDA pipeline (analyst+)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  daysBack: { type: 'integer', default: 90, description: 'Fetch submissions from the last N days' },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Pipeline run started' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/pipelines/fda/submissions': {
      get: {
        tags: ['Pipelines'],
        summary: 'List FDA submissions',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string', enum: ['510k', 'pma', 'de_novo', 'eua'] } },
          { name: 'vendor', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Array of FDA submissions' } },
      },
    },
    '/api/pipelines/clinical-trials/run': {
      post: {
        tags: ['Pipelines'],
        summary: 'Trigger ClinicalTrials.gov pipeline (analyst+)',
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  daysBack: { type: 'integer', default: 90 },
                },
              },
            },
          },
        },
        responses: { '200': { description: 'Pipeline run started' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/pipelines/clinical-trials': {
      get: {
        tags: ['Pipelines'],
        summary: 'List clinical trials',
        parameters: [
          { name: 'vendor', in: 'query', schema: { type: 'string' } },
          { name: 'phase', in: 'query', schema: { type: 'string' } },
        ],
        responses: { '200': { description: 'Array of clinical trials' } },
      },
    },

    // ── Scenarios ────────────────────────────────────
    '/api/scenarios': {
      get: {
        tags: ['Scenarios'],
        summary: 'List own + shared scenarios',
        responses: { '200': { description: 'Array of scenarios with creator name' } },
      },
      post: {
        tags: ['Scenarios'],
        summary: 'Create a new scenario (analyst+)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['name', 'adjustments'],
                properties: {
                  name: { type: 'string', maxLength: 100 },
                  description: { type: 'string', maxLength: 500 },
                  adjustments: { type: 'object', additionalProperties: { type: 'number' } },
                  is_shared: { type: 'boolean', default: false },
                },
              },
            },
          },
        },
        responses: { '201': { description: 'Created scenario' }, '403': { description: 'Forbidden' } },
      },
    },
    '/api/scenarios/{id}': {
      get: {
        tags: ['Scenarios'],
        summary: 'Get scenario by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '200': { description: 'Scenario details' }, '404': { description: 'Not found' } },
      },
      put: {
        tags: ['Scenarios'],
        summary: 'Update scenario (owner or admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/Scenario' } } },
        },
        responses: { '200': { description: 'Updated scenario' }, '403': { description: 'Forbidden' } },
      },
      delete: {
        tags: ['Scenarios'],
        summary: 'Delete scenario (owner or admin)',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { '204': { description: 'Deleted' }, '403': { description: 'Forbidden' } },
      },
    },

    // ── Reports ──────────────────────────────────────
    '/api/reports/generate': {
      post: {
        tags: ['Reports'],
        summary: 'Generate a report (analyst+)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['reportType'],
                properties: {
                  reportType: { type: 'string', enum: ['quarterly_update', 'vendor_deep_dive', 'indication_landscape', 'competitive_battlecard'] },
                  format: { type: 'string', enum: ['json', 'pdf'], default: 'json' },
                  params: {
                    type: 'object',
                    properties: {
                      vendorKey: { type: 'string', description: 'Required for vendor_deep_dive and competitive_battlecard' },
                      indication: { type: 'string', description: 'Required for indication_landscape' },
                    },
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Report generation started, returns report record' },
          '403': { description: 'Forbidden' },
        },
      },
    },
    '/api/reports': {
      get: {
        tags: ['Reports'],
        summary: 'List generated reports',
        parameters: [
          { name: 'type', in: 'query', schema: { type: 'string' } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: { '200': { description: 'Array of generated reports' } },
      },
    },
    '/api/reports/{id}': {
      get: {
        tags: ['Reports'],
        summary: 'Get report metadata',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: { '200': { description: 'Report metadata' }, '404': { description: 'Not found' } },
      },
    },
    '/api/reports/{id}/data': {
      get: {
        tags: ['Reports'],
        summary: 'Get report JSON data for rendering',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'integer' } }],
        responses: {
          '200': { description: 'Report data (JSON)' },
          '404': { description: 'Not found or not yet generated' },
        },
      },
    },

    // ── Health ───────────────────────────────────────
    '/health': {
      get: {
        tags: ['Auth'],
        summary: 'Health check',
        security: [],
        responses: { '200': { description: 'Server healthy' } },
      },
    },
  },
};
