/**
 * Accessibility Components
 *
 * WCAG 2.1 AA compliance utilities:
 * - Skip to main content link
 * - Screen reader announcements
 * - Focus trap for modals
 * - Keyboard navigation helpers
 */

import { useEffect, useRef } from 'react';

// ============================================
// Skip Navigation Link
// ============================================

/**
 * Renders a skip-to-main-content link that's visible only on keyboard focus.
 * Place at the top of the DOM, before the Sidebar.
 */
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:text-sm focus:font-semibold focus:outline-none"
    >
      Skip to main content
    </a>
  );
}

// ============================================
// Screen Reader Announcer
// ============================================

/**
 * Announces a message to screen readers using a live region.
 * Useful for dynamic content changes (view switches, filter updates, etc.)
 */
export function ScreenReaderAnnouncer({ message }: { message: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// ============================================
// Focus Trap Hook (for modals/dialogs)
// ============================================

/**
 * Traps keyboard focus within a container element.
 * Press Escape to call onClose.
 */
export function useFocusTrap(
  ref: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose?: () => void,
) {
  useEffect(() => {
    if (!isActive || !ref.current) return;

    const container = ref.current;
    const focusable = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
        return;
      }

      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    // Focus the first element
    first?.focus();

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, ref, onClose]);
}

// ============================================
// Keyboard Navigation Hook
// ============================================

/**
 * Arrow key navigation for list items (menus, grids, etc.)
 */
export function useArrowNavigation(
  containerRef: React.RefObject<HTMLElement | null>,
  options: {
    selector?: string;
    orientation?: 'horizontal' | 'vertical' | 'both';
    wrap?: boolean;
  } = {},
) {
  const {
    selector = '[role="listitem"], [role="option"], button',
    orientation = 'vertical',
    wrap = true,
  } = options;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const items = Array.from(container.querySelectorAll<HTMLElement>(selector));
      const current = document.activeElement as HTMLElement;
      const index = items.indexOf(current);
      if (index === -1) return;

      let nextIndex = index;

      if ((orientation === 'vertical' || orientation === 'both') && e.key === 'ArrowDown') {
        e.preventDefault();
        nextIndex = wrap ? (index + 1) % items.length : Math.min(index + 1, items.length - 1);
      }
      if ((orientation === 'vertical' || orientation === 'both') && e.key === 'ArrowUp') {
        e.preventDefault();
        nextIndex = wrap ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0);
      }
      if ((orientation === 'horizontal' || orientation === 'both') && e.key === 'ArrowRight') {
        e.preventDefault();
        nextIndex = wrap ? (index + 1) % items.length : Math.min(index + 1, items.length - 1);
      }
      if ((orientation === 'horizontal' || orientation === 'both') && e.key === 'ArrowLeft') {
        e.preventDefault();
        nextIndex = wrap ? (index - 1 + items.length) % items.length : Math.max(index - 1, 0);
      }

      if (e.key === 'Home') { e.preventDefault(); nextIndex = 0; }
      if (e.key === 'End') { e.preventDefault(); nextIndex = items.length - 1; }

      items[nextIndex]?.focus();
    };

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
  }, [containerRef, selector, orientation, wrap]);
}

// ============================================
// Live Region for View Changes
// ============================================

/**
 * Announces view changes to screen readers.
 */
export function useViewAnnouncer(viewName: string) {
  const announcerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (announcerRef.current) {
      announcerRef.current.textContent = `Navigated to ${viewName}`;
    }
  }, [viewName]);

  return announcerRef;
}
