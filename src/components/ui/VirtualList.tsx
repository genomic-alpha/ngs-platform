/**
 * Virtual Scrolling Component
 *
 * Lightweight windowed rendering for large lists (products, vendors, signals).
 * Renders only visible items + overscan buffer to maintain smooth scrolling.
 * No external dependencies — uses native IntersectionObserver.
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  overscan?: number;
  containerHeight?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  className?: string;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  overscan = 5,
  containerHeight = 600,
  renderItem,
  keyExtractor,
  className = '',
  emptyMessage = 'No items to display.',
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      setScrollTop(containerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const { visibleItems, startIndex, totalHeight, offsetY } = useMemo(() => {
    const totalHeight = items.length * itemHeight;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const visibleCount = Math.ceil(containerHeight / itemHeight) + 2 * overscan;
    const endIndex = Math.min(items.length, startIndex + visibleCount);

    return {
      visibleItems: items.slice(startIndex, endIndex),
      startIndex,
      totalHeight,
      offsetY: startIndex * itemHeight,
    };
  }, [items, itemHeight, scrollTop, containerHeight, overscan]);

  if (items.length === 0) {
    return (
      <div className={`flex items-center justify-center h-32 text-gray-500 text-sm ${className}`}>
        {emptyMessage}
      </div>
    );
  }

  // For small lists, skip virtualization
  if (items.length <= 50) {
    return (
      <div className={className}>
        {items.map((item, index) => (
          <div key={keyExtractor(item, index)}>{renderItem(item, index)}</div>
        ))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className}`}
      style={{ height: containerHeight }}
      role="list"
      aria-label={`Scrollable list with ${items.length} items`}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, i) => {
            const actualIndex = startIndex + i;
            return (
              <div
                key={keyExtractor(item, actualIndex)}
                style={{ height: itemHeight }}
                role="listitem"
              >
                {renderItem(item, actualIndex)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook for measuring container height dynamically (responsive)
 */
export function useContainerHeight(ref: React.RefObject<HTMLDivElement | null>, fallback = 600): number {
  const [height, setHeight] = useState(fallback);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setHeight(entry.contentRect.height);
      }
    });

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [ref]);

  return height;
}
