import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Upload,
  Sparkles,
  ChevronDown,
  Sliders,
  Trash2,
  Download,
  Eye,
  Play,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Infinity as InfinityIcon,
  ShieldCheck,
  Zap,
  Plus,
  Archive,
  Layers,
  RefreshCw,
  FileText,
  Image as ImageIcon,
  Table,
  Music,
  X,
  Sun,
  Moon,
  ArrowRight,
  Code2,
  Film,
  Presentation,
} from 'lucide-react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import {
  ConversionJob,
  ConversionSettings,
  FormatCategory,
  PdfSuiteMode,
  PopularToolPreset,
} from './types/converter';
import {
  DEFAULT_SETTINGS,
  FORMAT_REGISTRY,
  POPULAR_TOOLS,
  detectFileExtension,
  detectFormatCategory,
  getAvailableTargetFormats,
  getDefaultTargetFormat,
} from './data/formats';
import { executeConversionJob } from './engines';
import {
  createSampleAudioFile,
  createSampleExcelFile,
  createSampleImageFile,
  createSamplePdfFile,
  createSampleWordFile,
  formatBytes,
} from './utils/sampleGenerator';
import { FormatPickerPopover } from './components/FormatPickerPopover';
import { JobSettingsModal } from './components/JobSettingsModal';
import { PreviewModal } from './components/PreviewModal';
import { PdfSuitePanel } from './components/PdfSuitePanel';
import { PopularToolsSection } from './components/PopularToolsSection';
import { MyConvertLogo } from './components/MyConvertLogo';

function getCategorySvgIcon(cat: FormatCategory) {
  switch (cat) {
    case 'document':
      return <FileText className="w-4 h-4" />;
    case 'spreadsheet':
      return <Table className="w-4 h-4" />;
    case 'presentation':
      return <Presentation className="w-4 h-4" />;
    case 'image':
      return <ImageIcon className="w-4 h-4" />;
    case 'audio':
      return <Music className="w-4 h-4" />;
    case 'video':
      return <Film className="w-4 h-4" />;
    case 'data':
      return <Code2 className="w-4 h-4" />;
    case 'archive':
      return <Archive className="w-4 h-4" />;
    default:
      return <FileText className="w-4 h-4" />;
  }
}

export function App() {
  const [theme, setTheme] = useState<'pastel' | 'dark'>(() => {
    const saved = localStorage.getItem('myconvert_theme');
    return saved === 'dark' ? 'dark' : 'pastel';
  });
  const [activeTab, setActiveTab] = useState<'converter' | 'pdf-suite'>('converter');
  const [pdfSuiteMode, setPdfSuiteMode] = useState<PdfSuiteMode>('merge');
  const [activePreset, setActivePreset] = useState<PopularToolPreset | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('myconvert_theme', theme);
  }, [theme]);

  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [pickerJobId, setPickerJobId] = useState<string | null>(null);
  const [settingsJobId, setSettingsJobId] = useState<string | null>(null);
  const [previewJobId, setPreviewJobId] = useState<string | null>(null);
  const [isZippingAll, setIsZippingAll] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const workspaceRef = useRef<HTMLDivElement>(null);

  // Check URL query param ?tool=... on initial load for SEO landing pages
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toolId = params.get('tool');
    if (toolId) {
      const found = POPULAR_TOOLS.find((t) => t.id === toolId);
      if (found) {
        handleSelectPreset(found, false);
      }
    }
  }, []);

  // Dynamically update document title & meta description for SEO
  useEffect(() => {
    if (activePreset) {
      document.title = activePreset.seoTitle;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute('content', activePreset.seoDescription);
    } else {
      document.title =
        'MyConvert — Konversi File Online Terlengkap Tanpa Batas Size (PDF, Word, Excel, PPT, Gambar, Video)';
    }
  }, [activePreset]);

  const handleSelectPreset = (preset: PopularToolPreset, shouldScroll = true) => {
    setActivePreset(preset);
    if (preset.category === 'pdf-suite' && preset.pdfSuiteMode) {
      setActiveTab('pdf-suite');
      setPdfSuiteMode(preset.pdfSuiteMode);
    } else {
      setActiveTab('converter');
      setJobs((prev) =>
        prev.map((j) => {
          if (j.status === 'idle' && getAvailableTargetFormats(j.sourceExt).includes(preset.toExt)) {
            return { ...j, targetExt: preset.toExt };
          }
          return j;
        })
      );
    }
    if (shouldScroll) {
      workspaceRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const addFilesToQueue = (incoming: FileList | File[], forcedTargetExt?: string) => {
    const fileArray = Array.from(incoming);
    if (fileArray.length === 0) return;

    const preferredTarget = forcedTargetExt || activePreset?.toExt;

    const newJobs: ConversionJob[] = fileArray.map((file) => {
      const sourceExt = detectFileExtension(file);
      const sourceCategory = detectFormatCategory(sourceExt);
      const targetExt = getDefaultTargetFormat(sourceExt, preferredTarget);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        sourceExt,
        sourceCategory,
        targetExt,
        status: 'idle',
        progress: 0,
        settings: { ...DEFAULT_SETTINGS },
      };
    });

    setJobs((prev) => [...prev, ...newJobs]);
  };

  const updateJobTargetFormat = (jobId: string, newTargetExt: string) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              targetExt: newTargetExt,
              status: 'idle',
              progress: 0,
              resultBlob: undefined,
              resultUrl: undefined,
              errorMessage: undefined,
            }
          : j
      )
    );
  };

  const updateJobSettings = (
    jobId: string,
    newSettings: ConversionSettings,
    applyToAll: boolean
  ) => {
    setJobs((prev) =>
      prev.map((j) => {
        if (applyToAll || j.id === jobId) {
          return {
            ...j,
            settings: { ...newSettings },
            status: j.status === 'done' ? 'idle' : j.status,
            progress: j.status === 'done' ? 0 : j.progress,
          };
        }
        return j;
      })
    );
  };

  const removeJob = (jobId: string) => {
    setJobs((prev) => {
      const target = prev.find((j) => j.id === jobId);
      if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
      return prev.filter((j) => j.id !== jobId);
    });
  };

  const clearAllJobs = () => {
    jobs.forEach((j) => {
      if (j.resultUrl) URL.revokeObjectURL(j.resultUrl);
    });
    setJobs([]);
  };

  const runSingleJob = async (job: ConversionJob) => {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === job.id
          ? {
              ...j,
              status: 'converting',
              progress: 5,
              statusMessage: 'Memulai konversi...',
              errorMessage: undefined,
              startedAt: Date.now(),
            }
          : j
      )
    );

    try {
      const result = await executeConversionJob(job, (pct, msg) => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === job.id
              ? {
                  ...j,
                  progress: pct,
                  statusMessage: msg || j.statusMessage,
                }
              : j
          )
        );
      });

      const resultUrl = URL.createObjectURL(result.blob);
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: 'done',
                progress: 100,
                statusMessage: 'Konversi selesai',
                resultBlob: result.blob,
                resultUrl,
                resultFileName: result.outputFileName,
                resultSize: result.blob.size,
                completedAt: Date.now(),
              }
            : j
        )
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Gagal mengonversi file.';
      setJobs((prev) =>
        prev.map((j) =>
          j.id === job.id
            ? {
                ...j,
                status: 'error',
                progress: 0,
                errorMessage: message,
              }
            : j
        )
      );
    }
  };

  const handleConvertAll = async () => {
    const pendingJobs = jobs.filter((j) => j.status === 'idle' || j.status === 'error');
    for (const job of pendingJobs) {
      await runSingleJob(job);
    }
  };

  const handleDownloadJob = (job: ConversionJob) => {
    if (job.resultBlob && job.resultFileName) {
      saveAs(job.resultBlob, job.resultFileName);
    }
  };

  const handleDownloadAllZip = async () => {
    const completed = jobs.filter((j) => j.status === 'done' && j.resultBlob && j.resultFileName);
    if (completed.length === 0) return;
    setIsZippingAll(true);
    try {
      const zip = new JSZip();
      completed.forEach((j, idx) => {
        const bufferPromise = j.resultBlob!.arrayBuffer();
        zip.file(j.resultFileName || `hasil_${idx + 1}.${j.targetExt}`, bufferPromise);
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `MyConvert_Batch_${completed.length}_Files.zip`);
    } finally {
      setIsZippingAll(false);
    }
  };

  // Common formats shared by all queued files for "Convert All To" dropdown
  const commonTargetFormats = useMemo(() => {
    if (jobs.length === 0) return [];
    let intersection = getAvailableTargetFormats(jobs[0].sourceExt);
    for (let i = 1; i < jobs.length; i++) {
      const avail = new Set(getAvailableTargetFormats(jobs[i].sourceExt));
      intersection = intersection.filter((ext) => avail.has(ext));
    }
    return intersection;
  }, [jobs]);

  const pickerJob = useMemo(() => jobs.find((j) => j.id === pickerJobId) || null, [jobs, pickerJobId]);
  const settingsJob = useMemo(() => jobs.find((j) => j.id === settingsJobId) || null, [jobs, settingsJobId]);
  const previewJob = useMemo(() => jobs.find((j) => j.id === previewJobId) || null, [jobs, previewJobId]);

  const pendingCount = jobs.filter((j) => j.status === 'idle' || j.status === 'error').length;
  const convertingCount = jobs.filter((j) => j.status === 'converting').length;
  const completedCount = jobs.filter((j) => j.status === 'done').length;

  return (
    <div className="min-h-screen smooth-theme bg-[#FAF8FF] dark:bg-[#070B14] text-slate-900 dark:text-slate-100 flex flex-col relative overflow-x-hidden">
      {/* Smooth Cross-Fading Ambient Mesh Background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-10">
        {/* Pastel Gen-Z Mesh Layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            theme === 'pastel' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute -top-28 left-[12%] w-[620px] h-[440px] bg-gradient-to-br from-purple-200/70 via-pink-200/55 to-indigo-200/50 blur-[110px] rounded-full animate-float-slow" />
          <div className="absolute top-20 right-[8%] w-[540px] h-[420px] bg-gradient-to-bl from-rose-200/60 via-amber-100/55 to-pink-200/50 blur-[115px] rounded-full" />
          <div className="absolute top-[460px] -left-24 w-[540px] h-[460px] bg-gradient-to-tr from-emerald-200/50 via-teal-100/55 to-sky-200/50 blur-[120px] rounded-full" />
          <div className="absolute bottom-0 right-[15%] w-[600px] h-[440px] bg-gradient-to-tl from-violet-200/55 via-sky-200/45 to-pink-100/50 blur-[125px] rounded-full" />
        </div>

        {/* Cyber Dark Mesh Layer */}
        <div
          className={`absolute inset-0 transition-opacity duration-700 ease-out ${
            theme === 'dark' ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[450px] bg-indigo-600/15 blur-[140px] rounded-full" />
          <div className="absolute top-96 -left-32 w-[450px] h-[450px] bg-cyan-500/10 blur-[140px] rounded-full" />
          <div className="absolute top-80 -right-32 w-[450px] h-[450px] bg-violet-600/10 blur-[140px] rounded-full" />
        </div>
      </div>

      {/* Sticky Top Navbar */}
      <header className="sticky top-0 z-40 smooth-theme border-b border-purple-200/70 dark:border-slate-800/80 bg-white/75 dark:bg-[#070B14]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
          {/* Brand Logo */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setActivePreset(null);
              setActiveTab('converter');
            }}
            className="flex items-center gap-2.5 group"
          >
            <MyConvertLogo size="md" className="group-hover:scale-[1.02] transition-transform duration-300" />
            <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-700 border border-emerald-300/80 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30 smooth-theme">
              <InfinityIcon className="w-3 h-3" />
              UNLIMITED SIZE
            </span>
          </a>

          {/* Center Mode Switcher */}
          <div className="flex items-center p-1 rounded-2xl smooth-theme bg-purple-100/70 dark:bg-slate-900 border border-purple-200/80 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setActiveTab('converter')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'converter'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white'
              }`}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>File Converter</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pdf-suite')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-300 flex items-center gap-1.5 ${
                activeTab === 'pdf-suite'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:text-indigo-700 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>PDF Power Suite</span>
            </button>
          </div>

          {/* Right Quick Nav + Smooth Theme Switcher */}
          <div className="flex items-center gap-4">
            <nav className="hidden lg:flex items-center gap-5 text-xs font-bold text-slate-600 dark:text-slate-300">
              <a href="#popular-tools" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Alat Populer
              </a>
              <a href="#features" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                Keunggulan
              </a>
              <a href="#formats" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                35+ Format
              </a>
              <a href="#faq" className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                FAQ
              </a>
            </nav>

            <button
              type="button"
              onClick={() => setTheme((prev) => (prev === 'pastel' ? 'dark' : 'pastel'))}
              title="Ganti Tema Pastel Light / Cyber Dark"
              className="group relative inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl text-xs font-extrabold border smooth-theme bg-gradient-to-r from-pink-100/90 via-purple-100/90 to-teal-100/90 text-purple-900 border-purple-300/90 hover:shadow-md hover:shadow-purple-500/10 dark:from-slate-900 dark:via-slate-900 dark:to-slate-900 dark:text-amber-300 dark:border-slate-700"
            >
              {theme === 'pastel' ? (
                <>
                  <Sun className="w-3.5 h-3.5 text-pink-500 transition-transform duration-500 group-hover:rotate-90" />
                  <span>Pastel Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-3.5 h-3.5 text-amber-300 transition-transform duration-500 group-hover:-rotate-12" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-20 space-y-16">
        {/* Hero Header */}
        <section className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex flex-wrap items-center justify-center gap-3 px-4 py-1.5 rounded-full smooth-theme bg-white/85 dark:bg-slate-900/90 border border-purple-200/80 dark:border-slate-800 shadow-sm text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <InfinityIcon className="w-3.5 h-3.5" />
              <span>Tanpa Batas Size</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-slate-700" />
            <span className="inline-flex items-center gap-1.5 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Privasi 100% Aman</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-slate-700" />
            <span className="inline-flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Zap className="w-3.5 h-3.5" />
              <span>Gratis Tanpa Watermark</span>
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
            {activePreset ? (
              <>
                Konversi{' '}
                <span className="text-indigo-600 dark:text-indigo-400">{activePreset.title}</span>{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-fuchsia-600 to-pink-500 dark:from-cyan-300 dark:to-indigo-400 bg-clip-text text-transparent">
                  Tanpa Batas Ukuran
                </span>
              </>
            ) : (
              <>
                Konversi Semua Format File{' '}
                <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-300 dark:to-cyan-300 bg-clip-text text-transparent">
                  Tanpa Batasan Size
                </span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed font-medium">
            {activePreset
              ? activePreset.subtitle
              : 'Ubah PDF ke Word (.docx), Excel (.xlsx), PowerPoint (.pptx), Gambar (JPG, PNG, WebP, AVIF, SVG, ICO, HEIC), hingga Video & Audio (MP4, MP3, WAV, GIF) langsung dengan kecepatan tinggi.'}
          </p>

          {activePreset && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setActivePreset(null)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full smooth-theme bg-purple-100/80 dark:bg-slate-900 border border-purple-300 dark:border-slate-800 text-xs font-bold text-purple-900 dark:text-slate-300 hover:bg-purple-200/80 dark:hover:text-white"
              >
                <span>Mode Fokus: {activePreset.title}</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </section>

        {/* Active Workspace: Universal Converter OR PDF Power Suite */}
        <section ref={workspaceRef} className="scroll-mt-20">
          {activeTab === 'pdf-suite' ? (
            <PdfSuitePanel initialMode={pdfSuiteMode} />
          ) : (
            <div className="rounded-3xl smooth-theme border border-purple-200/90 dark:border-slate-800/90 bg-white/80 dark:bg-slate-900/75 backdrop-blur-2xl shadow-[0_20px_60px_-15px_rgba(139,92,246,0.14)] dark:shadow-2xl dark:shadow-indigo-950/30 overflow-hidden">
              {/* Hidden file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={(e) => {
                  if (e.target.files) addFilesToQueue(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />

              {/* Dropzone Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragging(false);
                  if (e.dataTransfer.files) addFilesToQueue(e.dataTransfer.files);
                }}
                className={`smooth-theme p-6 sm:p-10 text-center border-b border-purple-100 dark:border-slate-800/80 ${
                  isDragging
                    ? 'bg-indigo-500/10 border-indigo-500'
                    : 'bg-gradient-to-b from-purple-50/40 via-pink-50/25 to-sky-50/35 dark:from-slate-900/50 dark:to-slate-950/50'
                }`}
              >
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="cursor-pointer max-w-2xl mx-auto rounded-2xl border-2 border-dashed border-purple-300/90 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 bg-white/85 dark:bg-slate-950/60 hover:bg-purple-50/50 dark:hover:bg-indigo-950/20 smooth-theme p-7 sm:p-9 group shadow-sm"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-100 via-purple-100 to-pink-100 dark:from-indigo-600/20 dark:to-violet-600/20 border border-purple-200 dark:border-indigo-500/30 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Upload className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                  </div>

                  <div className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white">
                    Pilih File atau Tarik & Lepas (Drag & Drop) ke Sini
                  </div>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1.5 font-medium">
                    Mendukung PDF, Word, Excel, PPT, JPG, PNG, WebP, AVIF, HEIC, SVG, ICO, MP4, MP3, WAV, JSON, CSV, ZIP
                  </p>

                  <div className="mt-5 inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 group-hover:from-indigo-500 group-hover:to-purple-500 text-white text-sm font-bold shadow-lg shadow-indigo-500/25 transition-all duration-300">
                    <Plus className="w-4 h-4" />
                    <span>Pilih File dari Perangkat</span>
                  </div>
                </div>

                {/* Quick 1-Click Sample Demo Files Bar (All SVG Icons) */}
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400 mr-1 inline-flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" />
                    <span>Uji Coba Instan (1-Klik Sample):</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => addFilesToQueue([createSamplePdfFile()], 'docx')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-rose-100/90 text-rose-700 border border-rose-200 hover:bg-rose-200/80 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/25 dark:hover:bg-rose-500/20 smooth-theme"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sample PDF</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                    <span>Word</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addFilesToQueue([createSamplePdfFile()], 'xlsx')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100/90 text-emerald-700 border border-emerald-200 hover:bg-emerald-200/80 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/25 dark:hover:bg-emerald-500/20 smooth-theme"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Sample PDF</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                    <span>Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => addFilesToQueue([await createSampleWordFile()], 'pdf')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-100/90 text-blue-700 border border-blue-200 hover:bg-blue-200/80 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/25 dark:hover:bg-blue-500/20 smooth-theme"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Sample Word</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addFilesToQueue([createSampleExcelFile()], 'pdf')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-teal-100/90 text-teal-700 border border-teal-200 hover:bg-teal-200/80 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/25 dark:hover:bg-teal-500/20 smooth-theme"
                  >
                    <Table className="w-3.5 h-3.5" />
                    <span>Sample Excel</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                    <span>PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={async () => addFilesToQueue([await createSampleImageFile()], 'webp')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-100/90 text-sky-700 border border-sky-200 hover:bg-sky-200/80 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/25 dark:hover:bg-sky-500/20 smooth-theme"
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Sample PNG</span>
                    <ArrowRight className="w-3 h-3 opacity-75" />
                    <span>WebP / ICO</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => addFilesToQueue([createSampleAudioFile()], 'wav')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100/90 text-purple-700 border border-purple-200 hover:bg-purple-200/80 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/25 dark:hover:bg-purple-500/20 smooth-theme"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Sample Audio</span>
                  </button>
                </div>
              </div>

              {/* Queued Files List */}
              {jobs.length > 0 && (
                <div className="p-4 sm:p-6 space-y-4">
                  {/* Top Batch Toolbar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-purple-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-xs sm:text-sm font-extrabold text-slate-900 dark:text-white">
                        Antrean File ({jobs.length})
                      </span>
                      {completedCount > 0 && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>{completedCount} Selesai</span>
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {/* Convert All To Selector */}
                      {jobs.length > 1 && commonTargetFormats.length > 0 && (
                        <div className="flex items-center gap-2 bg-purple-50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 rounded-xl px-3 py-1.5">
                          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                            Ubah semua ke:
                          </span>
                          <select
                            value=""
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) return;
                              setJobs((prev) =>
                                prev.map((j) => ({
                                  ...j,
                                  targetExt: val,
                                  status: 'idle',
                                  progress: 0,
                                }))
                              );
                            }}
                            className="bg-transparent text-xs font-extrabold text-indigo-600 dark:text-indigo-400 focus:outline-none uppercase cursor-pointer"
                          >
                            <option value="" className="bg-white dark:bg-slate-900 text-slate-500">
                              Pilih...
                            </option>
                            {commonTargetFormats.map((ext) => (
                              <option key={ext} value={ext} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                                .{ext.toUpperCase()}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-100/80 hover:bg-purple-200/80 text-purple-900 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 smooth-theme"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Tambah File</span>
                      </button>

                      <button
                        type="button"
                        onClick={clearAllJobs}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-100/70 dark:hover:bg-rose-500/10 smooth-theme"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Hapus Semua</span>
                      </button>
                    </div>
                  </div>

                  {/* Individual File Rows */}
                  <div className="space-y-2.5">
                    {jobs.map((job) => {
                      const srcInfo = FORMAT_REGISTRY[job.sourceExt];
                      const dstInfo = FORMAT_REGISTRY[job.targetExt];

                      return (
                        <div
                          key={job.id}
                          className="rounded-2xl smooth-theme bg-purple-50/55 dark:bg-slate-950/85 border border-purple-200/80 dark:border-slate-800/90 hover:border-purple-300 dark:hover:border-slate-700/80 p-3.5 sm:px-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                        >
                          {/* Left: File icon, name & source badge */}
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-extrabold uppercase border shrink-0 ${
                                srcInfo?.badgeColor ||
                                'bg-slate-200 text-slate-700 border-slate-300 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                              }`}
                            >
                              {getCategorySvgIcon(job.sourceCategory)}
                              <span>.{job.sourceExt}</span>
                            </span>
                            <div className="min-w-0 flex-1">
                              <div
                                className="text-sm font-bold text-slate-900 dark:text-white truncate"
                                title={job.file.name}
                              >
                                {job.file.name}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 font-medium">
                                <span>{formatBytes(job.file.size)}</span>
                                {job.resultSize && (
                                  <>
                                    <ArrowRight className="w-3 h-3 text-slate-400" />
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                      {formatBytes(job.resultSize)}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Middle: Target Format Picker & Settings Gear */}
                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                              ubah ke
                            </span>
                            <button
                              type="button"
                              onClick={() => setPickerJobId(job.id)}
                              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-extrabold uppercase smooth-theme ${
                                dstInfo?.badgeColor ||
                                'bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30'
                              } hover:scale-105`}
                            >
                              <span>.{job.targetExt}</span>
                              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setSettingsJobId(job.id)}
                              title="Pengaturan Lanjutan (Kualitas, DPI, Mode PDF ke Word, Resize)"
                              className="p-2 rounded-xl smooth-theme bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:border-indigo-400"
                            >
                              <Sliders className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Right: Status / Progress / Actions */}
                          <div className="flex items-center justify-between lg:justify-end gap-3 lg:min-w-[270px]">
                            {job.status === 'idle' && (
                              <button
                                type="button"
                                onClick={() => runSingleJob(job)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-300 hover:bg-indigo-600 hover:text-white dark:bg-indigo-600/20 dark:text-indigo-300 dark:border-indigo-500/30 dark:hover:bg-indigo-600 dark:hover:text-white smooth-theme"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Konversi</span>
                              </button>
                            )}

                            {job.status === 'converting' && (
                              <div className="flex-1 max-w-[220px] space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="text-indigo-600 dark:text-indigo-300 font-semibold truncate">
                                    {job.statusMessage || 'Memproses...'}
                                  </span>
                                  <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                    {job.progress}%
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-purple-200/70 dark:bg-slate-800 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-300"
                                    style={{ width: `${job.progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            {job.status === 'done' && (
                              <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 mr-1">
                                  <CheckCircle2 className="w-4 h-4" />
                                  <span className="hidden sm:inline">Selesai</span>
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setPreviewJobId(job.id)}
                                  title="Lihat Pratinjau Hasil"
                                  className="inline-flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-bold smooth-theme bg-white dark:bg-slate-900 border border-purple-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-purple-50 dark:hover:bg-slate-800"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                  <span>Preview</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadJob(job)}
                                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 smooth-theme"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </button>
                              </div>
                            )}

                            {job.status === 'error' && (
                              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 text-xs">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span className="truncate max-w-[160px]" title={job.errorMessage}>
                                  {job.errorMessage || 'Gagal'}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => runSingleJob(job)}
                                  className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-500/20 text-rose-700 dark:text-rose-200 font-bold hover:bg-rose-200"
                                >
                                  Ulangi
                                </button>
                              </div>
                            )}

                            <button
                              type="button"
                              onClick={() => removeJob(job.id)}
                              title="Hapus dari daftar"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-900 smooth-theme"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bottom Master Action Bar */}
                  <div className="pt-3 flex flex-wrap items-center justify-between gap-4 border-t border-purple-100 dark:border-slate-800/80">
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span>Diproses 100% lokal di perangkat Anda • Tanpa batas ukuran file</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {completedCount > 1 && (
                        <button
                          type="button"
                          onClick={handleDownloadAllZip}
                          disabled={isZippingAll}
                          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/25 smooth-theme"
                        >
                          {isZippingAll ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Archive className="w-4 h-4" />
                          )}
                          <span>Download Semua ({completedCount} File .ZIP)</span>
                        </button>
                      )}

                      {pendingCount > 0 && (
                        <button
                          type="button"
                          onClick={handleConvertAll}
                          disabled={convertingCount > 0}
                          className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-sm font-extrabold bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white shadow-xl shadow-indigo-600/25 smooth-theme"
                        >
                          {convertingCount > 0 ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Mengonversi...</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>
                                Konversi {pendingCount > 1 ? `Semua (${pendingCount} File)` : 'Sekarang'}
                              </span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Popular Tools, Features, Format Directory & FAQ */}
        <PopularToolsSection
          activePresetId={activePreset?.id || null}
          onSelectPreset={(preset) => handleSelectPreset(preset, true)}
        />
      </main>

      {/* Footer */}
      <footer className="smooth-theme border-t border-purple-200/70 dark:border-slate-800/80 bg-white/75 dark:bg-slate-950/80 backdrop-blur-xl py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-3">
            <MyConvertLogo size="sm" />
            <span>— Platform Konversi File Tanpa Batas Size</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 font-medium">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Zero-Upload Privacy</span>
            </span>
            <span className="w-1 h-1 rounded-full bg-purple-300 dark:bg-slate-700" />
            <span>
              Build by{' '}
              <a
                href="https://yumastudio.digital/"
                target="_blank"
                rel="noopener noreferrer"
                className="font-extrabold text-indigo-600 dark:text-indigo-400 hover:text-fuchsia-600 dark:hover:text-indigo-300 underline decoration-indigo-500/40 underline-offset-4 transition-colors"
              >
                Yuma Studio
              </a>
            </span>
          </div>
        </div>
      </footer>

      {/* Popovers & Modals */}
      {pickerJob && (
        <FormatPickerPopover
          sourceExt={pickerJob.sourceExt}
          currentTargetExt={pickerJob.targetExt}
          onSelect={(newExt) => updateJobTargetFormat(pickerJob.id, newExt)}
          onClose={() => setPickerJobId(null)}
        />
      )}

      {settingsJob && (
        <JobSettingsModal
          job={settingsJob}
          onSave={updateJobSettings}
          onClose={() => setSettingsJobId(null)}
        />
      )}

      {previewJob && (
        <PreviewModal
          job={previewJob}
          onDownload={handleDownloadJob}
          onClose={() => setPreviewJobId(null)}
        />
      )}
    </div>
  );
}

export default App;
