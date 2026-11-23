import React, { useState } from 'react';
import {
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Music,
  Film,
  Code2,
  Layers,
  ArrowRight,
  ShieldCheck,
  Infinity as InfinityIcon,
  Zap,
  Sparkles,
  HelpCircle,
  LayoutGrid,
  Upload,
  MousePointerClick,
  Download,
  ChevronDown,
} from 'lucide-react';
import { CATEGORY_LABELS, FORMAT_REGISTRY, POPULAR_TOOLS } from '../data/formats';
import { FormatCategory, PopularToolPreset } from '../types/converter';

interface PopularToolsSectionProps {
  activePresetId: string | null;
  onSelectPreset: (preset: PopularToolPreset) => void;
}

export const PopularToolsSection: React.FC<PopularToolsSectionProps> = ({
  activePresetId,
  onSelectPreset,
}) => {
  const [selectedCat, setSelectedCat] = useState<FormatCategory | 'all' | 'pdf-suite'>('all');

  const filteredTools = POPULAR_TOOLS.filter((tool) => {
    if (selectedCat === 'all') return true;
    return tool.category === selectedCat;
  });

  const getCategoryIcon = (cat: FormatCategory | 'pdf-suite') => {
    switch (cat) {
      case 'document':
        return <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />;
      case 'spreadsheet':
        return <Table className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />;
      case 'presentation':
        return <Presentation className="w-5 h-5 text-amber-600 dark:text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-sky-600 dark:text-sky-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-600 dark:text-purple-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-pink-600 dark:text-pink-400" />;
      case 'data':
        return <Code2 className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />;
      case 'pdf-suite':
        return <Layers className="w-5 h-5 text-accent" />;
      default:
        return <FileText className="w-5 h-5 text-accent" />;
    }
  };

  const filterTabs: {
    id: FormatCategory | 'all' | 'pdf-suite';
    label: string;
    icon: React.ReactNode;
  }[] = [
    { id: 'all', label: 'Semua', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
    { id: 'document', label: 'PDF & Word', icon: <FileText className="w-3.5 h-3.5" /> },
    { id: 'spreadsheet', label: 'Excel & Tabel', icon: <Table className="w-3.5 h-3.5" /> },
    { id: 'presentation', label: 'PowerPoint', icon: <Presentation className="w-3.5 h-3.5" /> },
    { id: 'image', label: 'Gambar & Foto', icon: <ImageIcon className="w-3.5 h-3.5" /> },
    { id: 'audio', label: 'Audio & Video', icon: <Music className="w-3.5 h-3.5" /> },
    { id: 'pdf-suite', label: 'PDF Suite', icon: <Layers className="w-3.5 h-3.5" /> },
  ];

  return (
    <div className="space-y-20">
      {/* 1. Popular Conversion Tools Grid */}
      <section id="popular-tools" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100/90 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Konverter Terlengkap All-in-One</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-fg tracking-tight">
              Pilih Alat Konversi Cepat
            </h2>
            <p className="text-sm text-fg-muted mt-1 font-medium">
              Klik salah satu alat di bawah untuk mengatur format tujuan secara otomatis
            </p>
          </div>

          {/* Filter Pills with SVG Icons */}
          <div className="flex flex-wrap gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCat(tab.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold smooth-theme ${
                  selectedCat === tab.id
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                    : 'bg-surface text-fg-muted border border-line hover:border-purple-300 dark:hover:text-white'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filteredTools.map((tool) => {
            const isSelected = activePresetId === tool.id;
            return (
              <button
                key={tool.id}
                type="button"
                onClick={() => onSelectPreset(tool)}
                className={`group relative p-5 rounded-2xl border text-left smooth-theme flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-50/95 dark:bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/15'
                    : 'bg-surface/85 border-line/80 hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="p-2.5 rounded-xl bg-sunken border border-line group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 smooth-theme">
                      {getCategoryIcon(tool.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-100 text-indigo-700 border border-indigo-200 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30">
                          {tool.badge}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-sunken border border-line text-[10px] font-mono font-extrabold text-fg-soft uppercase">
                        <span>{tool.fromExt}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-indigo-500" />
                        <span>{tool.toExt}</span>
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-extrabold text-fg group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors flex items-center justify-between">
                    <span>{tool.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent" />
                  </h3>
                  <p className="text-xs text-fg-muted mt-1.5 leading-relaxed font-medium">
                    {tool.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fg">
            Cara Kerja MyConvert
          </h2>
          <p className="text-sm text-fg-muted mt-2 font-medium">
            Tiga langkah, tanpa daftar akun, tanpa upload ke server.
          </p>
        </div>

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: <Upload className="w-6 h-6" />,
              title: 'Pilih file',
              desc: 'Tarik & lepas atau pilih satu maupun banyak file sekaligus dari perangkat Anda.',
            },
            {
              icon: <MousePointerClick className="w-6 h-6" />,
              title: 'Tentukan format',
              desc: 'Pilih format tujuan per file atau ubah semuanya sekaligus. Atur kualitas lewat ikon pengaturan.',
            },
            {
              icon: <Download className="w-6 h-6" />,
              title: 'Konversi & unduh',
              desc: 'Proses berjalan langsung di browser. Unduh per file atau semua hasil dalam satu ZIP.',
            },
          ].map((step, i) => (
            <li
              key={step.title}
              className="relative p-6 rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm"
            >
              <span className="absolute top-5 right-5 text-4xl font-extrabold text-purple-100 dark:text-slate-800 select-none" aria-hidden="true">
                {i + 1}
              </span>
              <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-accent mb-3">
                {step.icon}
              </div>
              <h3 className="text-lg font-extrabold text-fg">
                <span className="sr-only">Langkah {i + 1}: </span>
                {step.title}
              </h3>
              <p className="text-sm text-fg-muted leading-relaxed font-medium mt-1.5">
                {step.desc}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* 2. Why MyConvert (Unlimited Size + Hybrid Engine Explanation) */}
      <section id="features" className="scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-fg">
            Mengapa MyConvert Lebih Unggul?
          </h2>
          <p className="text-sm text-fg-muted mt-2 font-medium">
            Dirancang dengan arsitektur Modern WebAssembly & Client-Side Document Engine untuk melampaui batasan konverter konvensional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <InfinityIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-fg">
              Tanpa Batasan Ukuran File
            </h3>
            <p className="text-xs text-fg-muted leading-relaxed font-medium">
              Situs lain membatasi file gratis maksimal 100 MB. Di MyConvert, konversi dilakukan menggunakan memori perangkat Anda sendiri sehingga Anda bebas mengonversi file besar tanpa kuota harian.
            </p>
          </div>

          <div className="p-6 rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-accent">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-fg">
              Privasi 100% Zero-Upload
            </h3>
            <p className="text-xs text-fg-muted leading-relaxed font-medium">
              Dokumen kontrak, laporan keuangan Excel, maupun foto pribadi Anda{' '}
              <strong className="text-fg">
                tidak pernah dikirim ke server pihak ketiga
              </strong>
              . Seluruh proses konversi terjadi lokal di dalam browser.
            </p>
          </div>

          <div className="p-6 rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-100 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-fg">
              Instan Tanpa Antrean Upload
            </h3>
            <p className="text-xs text-fg-muted leading-relaxed font-medium">
              Tidak perlu menunggu waktu upload dan download file bergiga-byte. Begitu Anda memilih file, engine WebAssembly langsung memprosesnya dalam hitungan detik.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Complete Supported Formats Directory (SEO Format Matrix) */}
      <section id="formats" className="scroll-mt-24">
        <div className="mb-7">
          <h2 className="text-2xl font-extrabold text-fg">
            Direktori Lengkap Format yang Didukung
          </h2>
          <p className="text-sm text-fg-muted mt-1 font-medium">
            Mendukung lebih dari 35+ format lintas dokumen, gambar, tabel, presentasi, audio, video, dan data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_LABELS) as FormatCategory[]).map((cat) => {
            const formats = Object.values(FORMAT_REGISTRY).filter((f) => f.category === cat);
            return (
              <div
                key={cat}
                className="p-5 rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-extrabold text-fg flex items-center gap-2">
                      {getCategoryIcon(cat)}
                      <span>{CATEGORY_LABELS[cat].name}</span>
                    </span>
                    <span className="text-xs text-slate-500 font-mono font-bold">
                      {formats.length} format
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formats.map((f) => (
                      <span
                        key={f.ext}
                        title={f.description}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-extrabold uppercase border smooth-theme ${f.badgeColor}`}
                      >
                        .{f.ext}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. SEO FAQ Section */}
      <section id="faq" className="scroll-mt-24">
        <div className="flex items-center gap-2.5 mb-6">
          <HelpCircle className="w-6 h-6 text-accent" />
          <h2 className="text-2xl font-extrabold text-fg">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
        </div>

        <div className="max-w-3xl space-y-3">
          {[
            {
              q: 'Apakah MyConvert benar-benar tanpa batasan ukuran file (Unlimited Size)?',
              a: 'Benar! Karena MyConvert memproses file langsung menggunakan engine WebAssembly dan browser perangkat Anda, tidak ada batasan kuota upload server seperti 100MB pada Convertio atau FreeConvert versi gratis.',
            },
            {
              q: 'Bagaimana cara mengubah PDF ke Word (.docx) agar rapi dan bisa diedit?',
              a: 'Cukup masukkan file PDF Anda, pilih format tujuan DOCX, lalu klik ikon pengaturan untuk memilih mode "Smart Hybrid", "100% Teks Editable", atau "Visual Presisi 1:1" sesuai jenis dokumen PDF Anda.',
            },
            {
              q: 'Bisakah saya mengonversi banyak file sekaligus (Batch Conversion)?',
              a: 'Bisa! Anda dapat menarik puluhan atau ratusan file sekaligus ke area konversi, mengatur format tujuan secara massal ("Ubah Semua ke"), lalu mengunduh seluruh hasilnya dalam 1 klik file .ZIP.',
            },
            {
              q: 'Apakah foto HEIC dari iPhone bisa diubah ke JPG atau PNG?',
              a: 'Ya, MyConvert dilengkapi dekoder HEIC/HEIF terintegrasi yang dapat langsung mengubah foto iPhone menjadi JPG, PNG, WebP, atau PDF.',
            },
          ].map((item, i) => (
            <details
              key={i}
              open={i === 0}
              className="group rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm open:border-indigo-300 dark:open:border-indigo-500/40"
            >
              <summary className="flex items-center justify-between gap-4 cursor-pointer list-none p-5 [&::-webkit-details-marker]:hidden rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30">
                <h3 className="text-sm sm:text-base font-extrabold text-fg">{item.q}</h3>
                <ChevronDown className="w-5 h-5 shrink-0 text-slate-400 transition-transform duration-300 group-open:rotate-180" />
              </summary>
              <p className="px-5 pb-5 -mt-1 text-sm text-fg-muted leading-relaxed font-medium">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
