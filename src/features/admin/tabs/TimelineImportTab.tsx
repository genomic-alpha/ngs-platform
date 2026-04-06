import React from 'react';
import { Plus, Trash2, Download, Upload, Copy, RefreshCw } from 'lucide-react';
import type { TimelineEvent, Vendor, Product, Partner, CompatibilityEntry, IntelSignal } from '@/core/types';

interface TimelineImportTabProps {
  timelineEvents: TimelineEvent[];
  setTimelineEvents: (events: TimelineEvent[]) => void;
  vendors: Vendor[];
  products: Product[];
  partners: Partner[];
  compatibility: CompatibilityEntry[];
  intelSignals: IntelSignal[];
  onExport: () => void;
  onImport: () => void;
  onGenerateConstants: () => void;
  onReset: () => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onFileUpload: (file: File) => void;
  activeSubTab: 'timeline' | 'importexport';
  setActiveSubTab: (tab: 'timeline' | 'importexport') => void;
}

export function TimelineImportTab({
  timelineEvents,
  setTimelineEvents,
  vendors,
  products,
  partners,
  compatibility,
  intelSignals,
  onExport,
  onImport,
  onGenerateConstants,
  onReset,
  fileInputRef,
  onFileUpload,
  activeSubTab,
  setActiveSubTab,
}: TimelineImportTabProps): React.ReactElement {
  return (
    <div className="space-y-4">
      {/* Sub-tab selector */}
      <div className="flex gap-2 border-b border-gray-700">
        <button
          onClick={() => setActiveSubTab('timeline')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'timeline' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveSubTab('importexport')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeSubTab === 'importexport' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400'
          }`}
        >
          Import/Export
        </button>
      </div>

      {activeSubTab === 'timeline' && (
        <div className="space-y-4">
          <button
            onClick={() => {
              const newEvent: TimelineEvent = {
                year: new Date().getFullYear(),
                event: 'New Event',
                vendor: vendors[0]?.key || 'unknown',
                impact: '',
              };
              setTimelineEvents([...timelineEvents, newEvent]);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
          >
            <Plus size={18} />
            Add Event
          </button>

          <div className="space-y-2">
            {timelineEvents.map((event, idx) => (
              <div key={idx} className="bg-gray-800 rounded p-4 grid grid-cols-5 gap-4">
                <input
                  type="number"
                  value={event.year}
                  onChange={(e) => {
                    const updated = timelineEvents.map((ev, i) => (i === idx ? { ...ev, year: parseInt(e.target.value) } : ev));
                    setTimelineEvents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />
                <input
                  type="text"
                  value={event.event}
                  onChange={(e) => {
                    const updated = timelineEvents.map((ev, i) => (i === idx ? { ...ev, event: e.target.value } : ev));
                    setTimelineEvents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                />
                <select
                  value={event.vendor}
                  onChange={(e) => {
                    const updated = timelineEvents.map((ev, i) => (i === idx ? { ...ev, vendor: e.target.value } : ev));
                    setTimelineEvents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                >
                  {vendors.map((v) => (
                    <option key={v.key} value={v.key}>
                      {v.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={event.impact}
                  onChange={(e) => {
                    const updated = timelineEvents.map((ev, i) => (i === idx ? { ...ev, impact: e.target.value } : ev));
                    setTimelineEvents(updated);
                  }}
                  className="bg-gray-700 text-white rounded px-2 py-1 text-sm"
                  placeholder="Impact"
                />
                <button
                  onClick={() => {
                    const updated = timelineEvents.filter((_, i) => i !== idx);
                    setTimelineEvents(updated);
                  }}
                  className="text-red-400 hover:text-red-300"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeSubTab === 'importexport' && (
        <div className="space-y-6">
          <div className="bg-gray-800 rounded p-6">
            <h3 className="text-white font-medium mb-4">Data Statistics</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-gray-400">Products</span>
                <div className="text-2xl font-bold text-white">{products.length}</div>
              </div>
              <div>
                <span className="text-gray-400">Vendors</span>
                <div className="text-2xl font-bold text-white">{vendors.length}</div>
              </div>
              <div>
                <span className="text-gray-400">Partners</span>
                <div className="text-2xl font-bold text-white">{partners.length}</div>
              </div>
              <div>
                <span className="text-gray-400">Compatibility Entries</span>
                <div className="text-2xl font-bold text-white">{compatibility.length}</div>
              </div>
              <div>
                <span className="text-gray-400">Timeline Events</span>
                <div className="text-2xl font-bold text-white">{timelineEvents.length}</div>
              </div>
              <div>
                <span className="text-gray-400">Intel Signals</span>
                <div className="text-2xl font-bold text-white">{intelSignals.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 rounded p-6">
            <h3 className="text-white font-medium mb-4">Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={onExport}
                className="flex items-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
              >
                <Download size={18} />
                Export Data (JSON)
              </button>

              <button
                onClick={onImport}
                className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
              >
                <Upload size={18} />
                Import Data (JSON)
              </button>

              <button
                onClick={onGenerateConstants}
                className="flex items-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded transition-colors"
              >
                <Copy size={18} />
                Generate Code Constants
              </button>

              <button
                onClick={onReset}
                className="flex items-center gap-2 px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
              >
                <RefreshCw size={18} />
                Reset to Defaults
              </button>
            </div>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                onFileUpload(e.target.files[0]);
              }
            }}
            style={{ display: 'none' }}
          />
        </div>
      )}
    </div>
  );
}
