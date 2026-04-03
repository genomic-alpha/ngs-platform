/**
 * Cross-View Navigation & Deep Linking
 *
 * Maps URL paths to ViewIds for bookmarkable, shareable links.
 * The app shell reads the current route and renders the matching view.
 *
 * Route structure:
 *   /                     → dashboard
 *   /products             → products
 *   /products/:id         → products (with product detail)
 *   /vendors              → vendors
 *   /vendors/:key         → vendors (with vendor detail)
 *   /compare              → compare
 *   /compatibility        → compatibility
 *   /tco                  → tco
 *   /indication           → indication
 *   /scenarios            → scenarios
 *   /scenarios/:id        → scenarios (load specific saved scenario)
 *   /signals              → signals
 *   /regulatory           → regulatory
 *   /timeline             → timeline
 *   /partners             → partners
 *   /data-quality         → data quality
 *   /validation           → validation
 *   /admin                → admin
 *   /admin/pipelines      → admin (pipelines tab)
 *   /admin/reports        → admin (reports tab)
 */

import type { ViewId } from '@/core/types';

export interface RouteConfig {
  path: string;
  viewId: ViewId;
  label: string;
}

export const ROUTE_MAP: RouteConfig[] = [
  { path: '/', viewId: 'dashboard', label: 'Dashboard' },
  { path: '/products', viewId: 'products', label: 'Products' },
  { path: '/vendors', viewId: 'vendors', label: 'Vendors' },
  { path: '/compare', viewId: 'compare', label: 'Compare' },
  { path: '/compatibility', viewId: 'compatibility', label: 'Compatibility' },
  { path: '/tco', viewId: 'tco', label: 'TCO Calculator' },
  { path: '/indication', viewId: 'indication', label: 'Indication Strategy' },
  { path: '/scenarios', viewId: 'scenarios', label: 'Scenarios' },
  { path: '/signals', viewId: 'signals', label: 'Intel Signals' },
  { path: '/regulatory', viewId: 'regulatory', label: 'Regulatory' },
  { path: '/timeline', viewId: 'timeline', label: 'Timeline' },
  { path: '/partners', viewId: 'partners', label: 'Partners' },
  { path: '/data-quality', viewId: 'data quality', label: 'Data Quality' },
  { path: '/validation', viewId: 'validation', label: 'Validation' },
  { path: '/admin', viewId: 'admin', label: 'Admin' },
];

/**
 * Convert a ViewId to a URL path
 */
export function viewIdToPath(viewId: ViewId): string {
  const route = ROUTE_MAP.find((r) => r.viewId === viewId);
  return route?.path || '/';
}

/**
 * Convert a URL path to a ViewId
 */
export function pathToViewId(pathname: string): ViewId {
  // Exact match first
  const exact = ROUTE_MAP.find((r) => r.path === pathname);
  if (exact) return exact.viewId;

  // Prefix match (for parameterized routes like /products/abc)
  const prefix = ROUTE_MAP
    .filter((r) => r.path !== '/')
    .find((r) => pathname.startsWith(r.path));
  if (prefix) return prefix.viewId;

  return 'dashboard';
}

/**
 * Build a deep link URL
 */
export function buildLink(viewId: ViewId, params?: Record<string, string>): string {
  let path = viewIdToPath(viewId);

  if (params) {
    // Append sub-path if specified
    if (params.id) path += `/${params.id}`;
    if (params.key) path += `/${params.key}`;

    // Append query params
    const query = Object.entries(params)
      .filter(([k]) => k !== 'id' && k !== 'key')
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    if (query) path += `?${query}`;
  }

  return path;
}

/**
 * Hook-like function to sync URL with view state.
 * Call from App.tsx to enable deep linking.
 */
export function syncUrlToView(
  activeView: ViewId,
  setActiveView: (view: ViewId) => void,
): void {
  // On mount, read URL and set view
  const currentPath = window.location.pathname;
  const urlView = pathToViewId(currentPath);

  if (urlView !== activeView) {
    setActiveView(urlView);
  }

  // Listen for popstate (back/forward navigation)
  const handlePopState = () => {
    const newView = pathToViewId(window.location.pathname);
    setActiveView(newView);
  };

  window.addEventListener('popstate', handlePopState);

  // Cleanup function (caller should handle this)
  // Return cleanup for useEffect pattern
}

/**
 * Navigate to a view and update the URL
 */
export function navigateToView(viewId: ViewId, params?: Record<string, string>): void {
  const path = buildLink(viewId, params);
  window.history.pushState({ viewId }, '', path);
}
