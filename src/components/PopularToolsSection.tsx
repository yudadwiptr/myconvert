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
        return <FileText className="w-5 h-5 text-rose-400" />;
      case 'spreadsheet':
        return <Table className="w-5 h-5 text-emerald-400" />;
      case 'presentation':
        return <Presentation className="w-5 h-5 text-amber-400" />;
      case 'image':
        return <ImageIcon className="w-5 h-5 text-sky-400" />;
      case 'audio':
        return <Music className="w-5 h-5 text-purple-400" />;
      case 'video':
        return <Film className="w-5 h-5 text-pink-400" />;
      case 'data':
        return <Code2 className="w-5 h-5 text-cyan-400" />;
      case 'pdf-suite':
        return <Layers className="w-5 h-5 text-indigo-400" />;
      default:
        return <FileText className="w-5 h-5 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-20">
      {/* 1. Popular Conversion Tools Grid */}
      <section id="popular-tools" className="scroll-mt-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-2.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Konverter Terlengkap All-in-One</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Pilih Alat Konversi Cepat
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Klik salah satu alat di bawah untuk mengatur format tujuan secara otomatis
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'document', label: 'PDF & Word' },
              { id: 'spreadsheet', label: 'Excel & Tabel' },
              { id: 'presentation', label: 'PowerPoint' },
              { id: 'image', label: 'Gambar & Foto' },
              { id: 'audio', label: 'Audio & Video' },
              { id: 'pdf-suite', label: 'PDF Suite' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSelectedCat(tab.id as typeof selectedCat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  selectedCat === tab.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {tab.label}
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
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-200 flex flex-col justify-between ${
                  isSelected
                    ? 'bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-900/70 border-slate-800/90 hover:border-indigo-500/50 hover:bg-slate-900 hover:-translate-y-0.5'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 group-hover:border-indigo-500/30 transition">
                      {getCategoryIcon(tool.category)}
                    </div>
                    <div className="flex items-center gap-1.5">
                      {tool.badge && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {tool.badge}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-md bg-slate-950 border border-slate-800 text-[10px] font-mono font-bold text-slate-300 uppercase">
                        {tool.fromExt} &rarr; {tool.toExt}
                      </span>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition flex items-center justify-between">
                    <span>{tool.title}</span>
                    <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition text-indigo-400" />
                  </h3>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {tool.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Why MyConvert (Unlimited Size + Hybrid Engine Explanation) */}
      <section id="features" className="scroll-mt-24">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
            Mengapa MyConvert Lebih Unggul?
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Dirancang dengan arsitektur Modern WebAssembly & Client-Side Document Engine untuk melampaui batasan konverter konvensional.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <InfinityIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Tanpa Batasan Ukuran File</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Situs lain membatasi file gratis maksimal 100 MB. Di MyConvert, konversi dilakukan menggunakan memori perangkat Anda sendiri sehingga Anda bebas mengonversi file besar tanpa kuota harian.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Privasi 100% Zero-Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Dokumen kontrak, laporan keuangan Excel, maupun foto pribadi Anda <strong className="text-slate-200">tidak pernah dikirim ke server pihak ketiga</strong>. Seluruh proses konversi terjadi lokal di dalam browser.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/75 border border-slate-800 space-y-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Instan Tanpa Antrean Upload</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Tidak perlu menunggu waktu upload dan download file bergiga-byte. Begitu Anda memilih file, engine WebAssembly langsung memprosesnya dalam hitungan detik.
            </p>
          </div>
        </div>
      </section>

      {/* 3. Complete Supported Formats Directory (SEO Format Matrix) */}
      <section id="formats" className="scroll-mt-24">
        <div className="mb-7">
          <h2 className="text-2xl font-extrabold text-white">
            Direktori Lengkap Format yang Didukung
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Mendukung lebih dari 35+ format lintas dokumen, gambar, tabel, presentasi, audio, video, dan data.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_LABELS) as FormatCategory[]).map((cat) => {
            const formats = Object.values(FORMAT_REGISTRY).filter((f) => f.category === cat);
            return (
              <div
                key={cat}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-bold text-white">
                      {CATEGORY_LABELS[cat].name}
                    </span>
                    <span className="text-xs text-slate-500 font-mono">
                      {formats.length} format
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {formats.map((f) => (
                      <span
                        key={f.ext}
                        title={f.description}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold uppercase border ${f.badgeColor}`}
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
          <HelpCircle className="w-6 h-6 text-indigo-400" />
          <h2 className="text-2xl font-extrabold text-white">
            Pertanyaan yang Sering Diajukan (FAQ)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            {
              q: 'Apakah MyConvert benar-benar tanpa batasan ukuran file (Unlimited Size)?',
              a: 'Benar! Karena MyConvert memproses file langsung menggunakan engine WebAssembly dan browser perangkat Anda, tidak ada batasan kuota upload server seperti 100MB pada Convertio atau FreeConvert versi gratis.',
            },
            {
              q: 'Bagaimana cara mengubah PDF ke Word (.docx) agar rapi dan bisa diedit?',
              a: 'Cukup masukkan file PDF Anda, pilih format tujuan DOCX, lalu klik ikon roda gigi (Pengaturan) untuk memilih mode "Smart Hybrid", "100% Teks Editable", atau "Visual Presisi 1:1" sesuai jenis dokumen PDF Anda.',
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
            <div key={i} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2">{item.q}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
