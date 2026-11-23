import React, { useState } from 'react';
import {
  FileText,
  Table,
  Presentation,
  Image as ImageIcon,
  Music,
  Film,
  Code2,
  Archive,
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
  ListChecks,
  Award,
} from 'lucide-react';
import { CATEGORY_LABELS, FORMAT_REGISTRY, POPULAR_TOOLS } from '../data/formats';
import { FormatCategory, PopularToolPreset } from '../types/converter';

type ToolCategory = FormatCategory | 'pdf-suite';

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

const CATEGORY_ICON: Record<ToolCategory, { icon: React.ElementType; color: string }> = {
  document: { icon: FileText, color: 'text-rose-600 dark:text-rose-400' },
  spreadsheet: { icon: Table, color: 'text-emerald-600 dark:text-emerald-400' },
  presentation: { icon: Presentation, color: 'text-amber-600 dark:text-amber-400' },
  image: { icon: ImageIcon, color: 'text-sky-600 dark:text-sky-400' },
  audio: { icon: Music, color: 'text-purple-600 dark:text-purple-400' },
  video: { icon: Film, color: 'text-pink-600 dark:text-pink-400' },
  data: { icon: Code2, color: 'text-cyan-600 dark:text-cyan-400' },
  archive: { icon: Archive, color: 'text-amber-600 dark:text-amber-400' },
  'pdf-suite': { icon: Layers, color: 'text-accent' },
};

const CategoryIcon: React.FC<{ category: ToolCategory }> = ({ category }) => {
  const { icon: Icon, color } = CATEGORY_ICON[category] ?? CATEGORY_ICON.document;
  return <Icon className={`w-5 h-5 ${color}`} />;
};

interface SectionHeaderProps {
  id: string;
  eyebrow: string;
  eyebrowIcon: React.ReactNode;
  title: string;
  description: string;
}

/** One header style for every section: eyebrow pill, title, short description. */
const SectionHeader: React.FC<SectionHeaderProps> = ({ id, eyebrow, eyebrowIcon, title, description }) => (
  <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-10">
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-100/90 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
      {eyebrowIcon}
      {eyebrow}
    </span>
    <h2 id={`${id}-title`} className="mt-3 text-2xl sm:text-3xl font-extrabold tracking-tight text-fg">
      {title}
    </h2>
    <p className="mt-2 text-sm sm:text-base text-fg-muted font-medium leading-relaxed">{description}</p>
  </div>
);

const CARD = 'rounded-2xl smooth-theme bg-surface/85 border border-line shadow-sm';

/* ------------------------------------------------------------------ */
/* Data                                                                */
/* ------------------------------------------------------------------ */

const FILTERS: { id: string; label: string; icon: React.ReactNode; categories: ToolCategory[] | null }[] = [
  { id: 'all', label: 'Semua', icon: <LayoutGrid className="w-4 h-4" />, categories: null },
  { id: 'doc', label: 'PDF & Word', icon: <FileText className="w-4 h-4" />, categories: ['document'] },
  { id: 'sheet', label: 'Excel & Data', icon: <Table className="w-4 h-4" />, categories: ['spreadsheet', 'data'] },
  { id: 'ppt', label: 'PowerPoint', icon: <Presentation className="w-4 h-4" />, categories: ['presentation'] },
  { id: 'image', label: 'Gambar & Foto', icon: <ImageIcon className="w-4 h-4" />, categories: ['image'] },
  { id: 'media', label: 'Audio & Video', icon: <Music className="w-4 h-4" />, categories: ['audio', 'video'] },
  { id: 'suite', label: 'PDF Suite', icon: <Layers className="w-4 h-4" />, categories: ['pdf-suite'] },
];

const STEPS = [
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
];

const FEATURES = [
  {
    icon: <InfinityIcon className="w-6 h-6" />,
    tone: 'bg-emerald-100 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    title: 'Tanpa Batasan Ukuran File',
    desc: (
      <>
        Situs lain membatasi file gratis maksimal 100 MB. Di MyConvert, konversi dilakukan menggunakan memori
        perangkat Anda sendiri sehingga Anda bebas mengonversi file besar tanpa kuota harian.
      </>
    ),
  },
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    tone: 'bg-indigo-100 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20 text-accent',
    title: 'Privasi 100% Zero-Upload',
    desc: (
      <>
        Dokumen kontrak, laporan keuangan Excel, maupun foto pribadi Anda{' '}
        <strong className="text-fg">tidak pernah dikirim ke server pihak ketiga</strong>. Seluruh proses konversi
        terjadi lokal di dalam browser.
      </>
    ),
  },
  {
    icon: <Zap className="w-6 h-6" />,
    tone: 'bg-amber-100 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400',
    title: 'Instan Tanpa Antrean Upload',
    desc: (
      <>
        Tidak perlu menunggu waktu upload dan download file bergiga-byte. Begitu Anda memilih file, engine
        WebAssembly langsung memprosesnya dalam hitungan detik.
      </>
    ),
  },
];

/** Keep in sync with the FAQPage JSON-LD in index.html (Google expects them to match). */
const FAQS = [
  {
    q: 'Apakah MyConvert benar-benar tanpa batasan ukuran file (Unlimited Size)?',
    a: 'Benar! Karena MyConvert memproses file langsung menggunakan engine WebAssembly dan browser perangkat Anda, tidak ada batasan kuota upload server seperti 100MB pada Convertio atau FreeConvert versi gratis.',
  },
  {
    q: 'Apakah file saya aman saat dikonversi di MyConvert?',
    a: '100% aman. Berbeda dengan situs konversi tradisional yang mengunggah dokumen rahasia Anda ke server pihak ketiga, MyConvert memproses seluruh file langsung di dalam browser perangkat Anda (Zero-Upload Privacy).',
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
];

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

interface PopularToolsSectionProps {
  activePresetId: string | null;
  onSelectPreset: (preset: PopularToolPreset) => void;
}

export const PopularToolsSection: React.FC<PopularToolsSectionProps> = ({ activePresetId, onSelectPreset }) => {
  const [filterId, setFilterId] = useState('all');
  const activeFilter = FILTERS.find((f) => f.id === filterId) ?? FILTERS[0];
  const toolsIn = (categories: ToolCategory[] | null) =>
    categories ? POPULAR_TOOLS.filter((t) => categories.includes(t.category)) : POPULAR_TOOLS;
  const filteredTools = toolsIn(activeFilter.categories);

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* 1. Popular tools */}
      <section id="popular-tools" aria-labelledby="popular-tools-title" className="scroll-mt-24">
        <SectionHeader
          id="popular-tools"
          eyebrow="Konverter Terlengkap All-in-One"
          eyebrowIcon={<Sparkles className="w-3.5 h-3.5" />}
          title="Pilih Alat Konversi Cepat"
          description="Klik salah satu alat di bawah untuk mengatur format tujuan secara otomatis."
        />

        {/* Filter bar: one centered row from xl up; a swipeable row (never wrapping) below that */}
        <div className="-mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 xl:mx-0 xl:px-0 mb-8 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_88%,transparent)] xl:[mask-image:none]">
          <div
            role="group"
            aria-label="Filter kategori alat"
            className="flex w-max gap-2 mx-auto pr-6 xl:pr-0"
          >
            {FILTERS.map((f) => {
              const active = f.id === filterId;
              const count = toolsIn(f.categories).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setFilterId(f.id)}
                  className={`shrink-0 inline-flex items-center gap-2 pl-3.5 pr-2 py-2 rounded-xl text-sm font-bold whitespace-nowrap smooth-theme ${
                    active
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                      : 'bg-surface text-fg-muted border border-line hover:border-indigo-300 hover:text-fg dark:hover:border-indigo-500/40'
                  }`}
                >
                  {f.icon}
                  <span>{f.label}</span>
                  <span
                    className={`min-w-[1.5rem] px-1.5 py-0.5 rounded-md text-[11px] font-mono font-bold text-center ${
                      active ? 'bg-white/20 text-white' : 'bg-sunken text-fg-muted'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
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
                aria-current={isSelected ? 'true' : undefined}
                className={`group relative h-full p-5 rounded-2xl border text-left smooth-theme flex flex-col ${
                  isSelected
                    ? 'bg-indigo-50/95 dark:bg-indigo-600/15 border-indigo-500 shadow-lg shadow-indigo-500/15'
                    : 'bg-surface/85 border-line hover:border-indigo-400 dark:hover:border-indigo-500/50 hover:shadow-xl hover:shadow-purple-500/10 hover:-translate-y-1'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="p-2.5 rounded-xl bg-sunken border border-line group-hover:border-indigo-300 dark:group-hover:border-indigo-500/30 smooth-theme">
                    <CategoryIcon category={tool.category} />
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
                <h3 className="text-base font-extrabold text-fg group-hover:text-accent transition-colors flex items-center justify-between gap-2">
                  <span>{tool.title}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 text-accent" />
                </h3>
                <p className="text-[13px] text-fg-muted mt-1.5 leading-relaxed font-medium">{tool.subtitle}</p>
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. How it works */}
      <section id="how-it-works" aria-labelledby="how-it-works-title" className="scroll-mt-24">
        <SectionHeader
          id="how-it-works"
          eyebrow="3 Langkah Mudah"
          eyebrowIcon={<ListChecks className="w-3.5 h-3.5" />}
          title="Cara Kerja MyConvert"
          description="Tanpa daftar akun, tanpa upload ke server."
        />

        <ol className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {STEPS.map((step, i) => (
            <li key={step.title} className={`relative p-6 ${CARD}`}>
              <span
                className="absolute top-5 right-6 text-4xl font-extrabold leading-none text-purple-100 dark:text-slate-800 select-none"
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <div className="w-11 h-11 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 flex items-center justify-center text-accent mb-4">
                {step.icon}
              </div>
              <h3 className="text-lg font-extrabold text-fg">
                <span className="sr-only">Langkah {i + 1}: </span>
                {step.title}
              </h3>
              <p className="text-sm text-fg-muted leading-relaxed font-medium mt-1.5">{step.desc}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 3. Why MyConvert */}
      <section id="features" aria-labelledby="features-title" className="scroll-mt-24">
        <SectionHeader
          id="features"
          eyebrow="Kenapa MyConvert"
          eyebrowIcon={<Award className="w-3.5 h-3.5" />}
          title="Mengapa MyConvert Lebih Unggul?"
          description="Dirancang dengan arsitektur WebAssembly & client-side document engine untuk melampaui batasan konverter konvensional."
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {FEATURES.map((f) => (
            <div key={f.title} className={`p-6 ${CARD}`}>
              <div className={`w-11 h-11 rounded-xl border flex items-center justify-center mb-4 ${f.tone}`}>
                {f.icon}
              </div>
              <h3 className="text-lg font-extrabold text-fg">{f.title}</h3>
              <p className="text-sm text-fg-muted leading-relaxed font-medium mt-1.5">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Format directory */}
      <section id="formats" aria-labelledby="formats-title" className="scroll-mt-24">
        <SectionHeader
          id="formats"
          eyebrow="35+ Format"
          eyebrowIcon={<LayoutGrid className="w-3.5 h-3.5" />}
          title="Direktori Lengkap Format yang Didukung"
          description="Lintas dokumen, gambar, tabel, presentasi, audio, video, data, dan arsip."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {(Object.keys(CATEGORY_LABELS) as FormatCategory[]).map((cat) => {
            const formats = Object.values(FORMAT_REGISTRY).filter((f) => f.category === cat);
            return (
              <div key={cat} className={`p-5 ${CARD}`}>
                <div className="flex items-center justify-between gap-2 mb-3.5">
                  <h3 className="text-sm font-extrabold text-fg flex items-center gap-2">
                    <CategoryIcon category={cat} />
                    <span>{CATEGORY_LABELS[cat].name}</span>
                  </h3>
                  <span className="text-xs text-fg-muted font-mono font-bold whitespace-nowrap">
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
            );
          })}
        </div>
      </section>

      {/* 5. FAQ */}
      <section id="faq" aria-labelledby="faq-title" className="scroll-mt-24">
        <SectionHeader
          id="faq"
          eyebrow="FAQ"
          eyebrowIcon={<HelpCircle className="w-3.5 h-3.5" />}
          title="Pertanyaan yang Sering Diajukan"
          description="Jawaban singkat seputar ukuran file, keamanan, dan cara pakai MyConvert."
        />

        <div className="space-y-3">
          {FAQS.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className={`group ${CARD} open:border-indigo-300 dark:open:border-indigo-500/40 open:shadow-md open:shadow-indigo-500/5`}
            >
              <summary className="flex items-center gap-4 cursor-pointer list-none px-5 sm:px-6 py-4 sm:py-5 [&::-webkit-details-marker]:hidden rounded-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30">
                <span
                  className="hidden sm:inline-flex shrink-0 w-9 h-9 rounded-xl items-center justify-center bg-sunken border border-line text-xs font-mono font-extrabold text-fg-muted group-open:bg-indigo-600 group-open:border-indigo-600 group-open:text-white smooth-theme"
                  aria-hidden="true"
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="flex-1 text-sm sm:text-base font-extrabold text-fg">{item.q}</h3>
                <ChevronDown className="w-5 h-5 shrink-0 text-fg-muted transition-transform duration-300 group-open:rotate-180 group-open:text-accent" />
              </summary>
              <p className="px-5 sm:px-6 sm:pl-[4.75rem] pb-5 -mt-1 max-w-5xl text-sm sm:text-[15px] text-fg-muted leading-relaxed font-medium">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
};
