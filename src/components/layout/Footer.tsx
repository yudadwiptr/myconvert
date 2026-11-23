import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { MyConvertLogo } from '../MyConvertLogo';
import { POPULAR_TOOLS } from '../../data/formats';
import { PopularToolPreset } from '../../types/converter';

const FOOTER_GROUPS: { title: string; match: (t: PopularToolPreset) => boolean }[] = [
  {
    title: 'Dokumen & PDF',
    match: (t) => ['document', 'spreadsheet', 'presentation', 'data', 'pdf-suite'].includes(t.category),
  },
  { title: 'Gambar & Media', match: (t) => ['image', 'audio', 'video'].includes(t.category) },
];

export const Footer: React.FC<{ onSelectPreset: (preset: PopularToolPreset) => void }> = ({ onSelectPreset }) => (
  <footer className="smooth-theme border-t border-line/70 bg-surface/75 backdrop-blur-xl">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
      <div className="col-span-2 space-y-3">
        <MyConvertLogo size="sm" />
        <p className="text-sm text-fg-muted leading-relaxed max-w-xs">
          Konversi dokumen, gambar, audio & video langsung di browser. Gratis, tanpa watermark, file tidak pernah
          diunggah.
        </p>
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
          <ShieldCheck className="w-3.5 h-3.5" />
          Zero-Upload Privacy
        </span>
      </div>

      {FOOTER_GROUPS.map((group) => (
        <nav key={group.title} aria-label={group.title}>
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-fg mb-3">{group.title}</h2>
          <ul className="space-y-2">
            {POPULAR_TOOLS.filter(group.match).map((tool) => (
              <li key={tool.id}>
                <a
                  href={`/?tool=${tool.id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    onSelectPreset(tool);
                  }}
                  className="text-sm text-fg-muted hover:text-accent transition-colors"
                >
                  {tool.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      ))}
    </div>

    <div className="border-t border-line/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-fg-muted">
        <span>© {new Date().getFullYear()} MyConvert</span>
        <span>
          Dibuat oleh{' '}
          <a
            href="https://yumastudio.digital/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-extrabold text-accent hover:text-fuchsia-600 dark:hover:text-indigo-300 underline decoration-indigo-500/40 underline-offset-4 transition-colors"
          >
            Yuma Studio
          </a>
        </span>
      </div>
    </div>
  </footer>
);
