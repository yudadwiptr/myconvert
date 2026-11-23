import React, { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { PdfSuiteMode, PopularToolPreset } from './types/converter';
import { POPULAR_TOOLS } from './data/formats';
import { useTheme } from './hooks/useTheme';
import { useConversionQueue } from './hooks/useConversionQueue';
import { AmbientBackground } from './components/layout/AmbientBackground';
import { Navbar } from './components/layout/Navbar';
import { Footer } from './components/layout/Footer';
import { Hero } from './components/Hero';
import { WorkspaceTabs, WorkspaceTab } from './components/WorkspaceTabs';
import { ConverterPanel } from './components/converter/ConverterPanel';
import { PopularToolsSection } from './components/PopularToolsSection';

const PdfSuitePanel = lazy(() =>
  import('./components/PdfSuitePanel').then((m) => ({ default: m.PdfSuitePanel }))
);

const DEFAULT_TITLE =
  'MyConvert — Konversi File Online Terlengkap Tanpa Batas Size (PDF, Word, Excel, PPT, Gambar, Video)';

export function App() {
  const { theme, toggleTheme } = useTheme();
  const queue = useConversionQueue();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('converter');
  const [pdfSuiteMode, setPdfSuiteMode] = useState<PdfSuiteMode>('merge');
  const [activePreset, setActivePreset] = useState<PopularToolPreset | null>(null);
  const workspaceRef = useRef<HTMLElement>(null);

  const selectPreset = (preset: PopularToolPreset, shouldScroll = true) => {
    setActivePreset(preset);
    try {
      window.history.replaceState(null, '', `/?tool=${preset.id}`);
    } catch {
      // ignore
    }
    if (preset.category === 'pdf-suite' && preset.pdfSuiteMode) {
      setActiveTab('pdf-suite');
      setPdfSuiteMode(preset.pdfSuiteMode);
    } else {
      setActiveTab('converter');
      queue.retargetIdleJobs(preset.toExt);
    }
    if (shouldScroll) {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // ?tool=... landing pages
  useEffect(() => {
    const toolId = new URLSearchParams(window.location.search).get('tool');
    const found = toolId ? POPULAR_TOOLS.find((t) => t.id === toolId) : undefined;
    if (found) selectPreset(found, false);
  }, []);

  // Per-tool title & meta description
  useEffect(() => {
    if (activePreset) {
      document.title = activePreset.seoTitle;
      document.querySelector('meta[name="description"]')?.setAttribute('content', activePreset.seoDescription);
    } else {
      if (window.location.search.includes('tool=')) {
        window.history.replaceState(null, '', '/');
      }
      document.title = DEFAULT_TITLE;
    }
  }, [activePreset]);

  return (
    <div className="min-h-screen smooth-theme bg-canvas text-fg flex flex-col relative overflow-x-hidden">
      <AmbientBackground theme={theme} />

      <Navbar
        theme={theme}
        onToggleTheme={toggleTheme}
        onHome={() => {
          setActivePreset(null);
          setActiveTab('converter');
        }}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-16">
        <Hero activePreset={activePreset} onClearPreset={() => setActivePreset(null)} />

        <section ref={workspaceRef} className="scroll-mt-20 space-y-5">
          <WorkspaceTabs active={activeTab} onChange={setActiveTab} />

          {activeTab === 'pdf-suite' ? (
            <Suspense
              fallback={
                <div className="rounded-3xl border border-line/90 bg-surface/80 p-16 flex items-center justify-center gap-2 text-sm font-semibold text-fg-muted">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Memuat PDF Power Suite...</span>
                </div>
              }
            >
              <PdfSuitePanel initialMode={pdfSuiteMode} />
            </Suspense>
          ) : (
            <ConverterPanel queue={queue} preferredTargetExt={activePreset?.toExt} />
          )}
        </section>

        <PopularToolsSection
          activePresetId={activePreset?.id || null}
          onSelectPreset={(preset) => selectPreset(preset, true)}
        />
      </main>

      <Footer onSelectPreset={(preset) => selectPreset(preset, true)} />
    </div>
  );
}

export default App;
