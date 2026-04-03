import type { Product, IndicationKey } from '@/core/types';
import { useData } from '@/store';
import { DEFAULT_TIMELINE_EVENTS } from '@/core/data/timeline';
import { getGrowthIcon } from '@/components/ui/helpers';

interface TimelineViewProps {
  products: Product[];
  indicationFilter: IndicationKey[];
}

export function TimelineView({ products, indicationFilter }: TimelineViewProps) {
  const data = useData();
  const timelineEvents = data?.timelineEvents || DEFAULT_TIMELINE_EVENTS;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Timeline</h2>

      <div className="space-y-3">
        {timelineEvents.map((event, index) => (
          <div
            key={index}
            className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 pt-1">
                <div className="text-xl font-bold text-blue-400">{event.year}</div>
              </div>

              <div className="flex-grow">
                <p className="text-white font-medium">{event.event}</p>
              </div>

              <div className="flex items-center gap-3 flex-shrink-0">
                <span className="px-2.5 py-1 bg-gray-700/50 rounded text-xs font-medium text-gray-300">
                  {event.vendor}
                </span>

                <div className="flex items-center gap-2">
                  {getGrowthIcon(event.impact)}
                  <span className="text-xs font-medium text-gray-400">{event.impact}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
