import React from 'react';
import { Layers, RefreshCw } from 'lucide-react';

export type WorkspaceTab = 'converter' | 'pdf-suite';

const TABS = [
  { id: 'converter', label: 'File Converter', icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'pdf-suite', label: 'PDF Power Suite', icon: <Layers className="w-4 h-4" /> },
] as const;

export const WorkspaceTabs: React.FC<{ active: WorkspaceTab; onChange: (tab: WorkspaceTab) => void }> = ({
  active,
  onChange,
}) => (
  <div className="flex justify-center">
    <div
      role="tablist"
      aria-label="Mode alat"
      className="inline-flex items-center p-1 rounded-2xl smooth-theme bg-surface border border-line shadow-sm"
    >
      {TABS.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          onClick={() => onChange(tab.id)}
          className={`px-4 sm:px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
            active === tab.id
              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
              : 'text-fg-muted hover:text-indigo-700 dark:hover:text-white'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  </div>
);
