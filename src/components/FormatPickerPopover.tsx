import React, { useState, useMemo } from 'react';
import { Search, Check, Sparkles } from 'lucide-react';
import { CATEGORY_LABELS, FORMAT_REGISTRY, getAvailableTargetFormats } from '../data/formats';
import { FormatCategory } from '../types/converter';

interface FormatPickerPopoverProps {
  sourceExt: string;
  currentTargetExt: string;
  onSelect: (newTargetExt: string) => void;
  onClose: () => void;
}

export const FormatPickerPopover: React.FC<FormatPickerPopoverProps> = ({
  sourceExt,
  currentTargetExt,
  onSelect,
  onClose,
}) => {
  const availableExts = useMemo(() => getAvailableTargetFormats(sourceExt), [sourceExt]);
  const [search, setSearch] = useState('');

  // Determine categories present among available target formats
  const availableCategories = useMemo(() => {
    const cats = new Set<FormatCategory>();
    for (const ext of availableExts) {
      const info = FORMAT_REGISTRY[ext];
      if (info) cats.add(info.category);
    }
    return Array.from(cats);
  }, [availableExts]);

  const currentCat = FORMAT_REGISTRY[currentTargetExt]?.category || availableCategories[0] || 'document';
  const [activeCategory, setActiveCategory] = useState<FormatCategory | 'all'>(currentCat);

  const filteredFormats = useMemo(() => {
    return availableExts
      .map((ext) => FORMAT_REGISTRY[ext] || {
        ext,
        label: ext.toUpperCase(),
        mime: 'application/octet-stream',
        category: 'document' as FormatCategory,
        description: `File .${ext.toUpperCase()}`,
        badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
      })
      .filter((fmt) => {
        if (search.trim()) {
          const q = search.toLowerCase();
          return (
            fmt.ext.toLowerCase().includes(q) ||
            fmt.label.toLowerCase().includes(q) ||
            fmt.description.toLowerCase().includes(q)
          );
        }
        if (activeCategory === 'all') return true;
        return fmt.category === activeCategory;
      });
  }, [availableExts, activeCategory, search]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-slate-900 shadow-2xl shadow-indigo-950/50 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header + Search */}
        <div className="p-3.5 border-b border-slate-800 flex items-center justify-between gap-3 bg-slate-900/90">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Cari format tujuan untuk .${sourceExt.toUpperCase()}...`}
              autoFocus
              className="w-full pl-9 pr-3 py-2 text-sm rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            Tutup
          </button>
        </div>

        <div className="flex flex-col sm:flex-row min-h-[260px] max-h-[380px]">
          {/* Left Category Sidebar */}
          <div className="sm:w-44 border-b sm:border-b-0 sm:border-r border-slate-800 bg-slate-950/50 p-2 flex sm:flex-col gap-1 overflow-x-auto">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
            >
              <span>Semua Format</span>
              <span className="text-[10px] opacity-75 ml-1.5">{availableExts.length}</span>
            </button>

            {availableCategories.map((cat) => {
              const count = availableExts.filter((e) => FORMAT_REGISTRY[e]?.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setActiveCategory(cat);
                    setSearch('');
                  }}
                  className={`px-3 py-2 rounded-xl text-left text-xs font-semibold transition flex items-center justify-between whitespace-nowrap ${
                    activeCategory === cat && !search
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
                  }`}
                >
                  <span>{CATEGORY_LABELS[cat]?.name || cat}</span>
                  <span className="text-[10px] opacity-75 ml-1.5">{count}</span>
                </button>
              );
            })}
          </div>

          {/* Right Format Grid */}
          <div className="flex-1 p-3.5 overflow-y-auto">
            {filteredFormats.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-400 text-sm">
                Format tidak ditemukan untuk pencarian "{search}"
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {filteredFormats.map((fmt) => {
                  const isSelected = fmt.ext === currentTargetExt;
                  return (
                    <button
                      key={fmt.ext}
                      type="button"
                      onClick={() => {
                        onSelect(fmt.ext);
                        onClose();
                      }}
                      className={`group relative p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                        isSelected
                          ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm'
                          : 'bg-slate-950/70 border-slate-800/90 text-slate-200 hover:border-indigo-500/50 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="text-sm font-bold tracking-wide uppercase font-mono">
                          .{fmt.ext}
                        </span>
                        {isSelected ? (
                          <Check className="w-4 h-4 text-indigo-400" />
                        ) : (
                          <Sparkles className="w-3.5 h-3.5 text-slate-600 group-hover:text-indigo-400 transition" />
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 truncate mt-1">
                        {fmt.description}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
