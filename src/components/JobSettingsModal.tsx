import React, { useState } from 'react';
import { useDialog } from '../hooks/useDialog';
import { Sliders, X, RotateCcw, Check, ArrowRight } from 'lucide-react';
import { ConversionJob, ConversionSettings } from '../types/converter';
import { DEFAULT_SETTINGS } from '../data/formats';

interface JobSettingsModalProps {
  job: ConversionJob;
  onSave: (jobId: string, updatedSettings: ConversionSettings, applyToAllSameCategory: boolean) => void;
  onClose: () => void;
}

export const JobSettingsModal: React.FC<JobSettingsModalProps> = ({ job, onSave, onClose }) => {
  const [settings, setSettings] = useState<ConversionSettings>({ ...job.settings });
  const [applyToAll, setApplyToAll] = useState(false);

  const inExt = job.sourceExt.toLowerCase();
  const outExt = job.targetExt.toLowerCase();
  const isImageJob =
    job.sourceCategory === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'avif', 'ico', 'bmp', 'gif', 'svg'].includes(outExt);
  const isPdfSource = inExt === 'pdf';
  const isPdfTarget = outExt === 'pdf';
  const isMediaJob = job.sourceCategory === 'audio' || job.sourceCategory === 'video';

  const dialogRef = useDialog<HTMLDivElement>(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-slate-950/70 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-purple-200 dark:border-slate-700/80 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-2xl overflow-hidden smooth-theme"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pengaturan konversi"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-purple-100 dark:border-slate-800 flex items-center justify-between bg-purple-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Pengaturan Lanjutan Konversi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm inline-flex items-center gap-1.5">
                <span className="truncate">{job.file.name}</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400 inline-flex items-center gap-1">
                  ({inExt.toUpperCase()} <ArrowRight className="w-3 h-3" /> {outExt.toUpperCase()})
                </span>
              </p>
            </div>
          </div>
          <button
            aria-label="Tutup"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* PDF -> Word Mode */}
          {isPdfSource && outExt === 'docx' && (
            <div className="space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-indigo-600 dark:text-indigo-300">
                Mode Konversi PDF ke Word (.DOCX)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {[
                  {
                    id: 'hybrid',
                    title: 'Smart Hybrid',
                    desc: 'Teks bisa diedit + gambar halaman otomatis jika ada diagram',
                  },
                  {
                    id: 'editable',
                    title: '100% Teks Editable',
                    desc: 'Fokus paragraf & heading murni untuk pengeditan cepat',
                  },
                  {
                    id: 'visual',
                    title: 'Visual Presisi 1:1',
                    desc: 'Tata letak persis 100% seperti halaman PDF asli',
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      setSettings((s) => ({ ...s, pdfToWordMode: m.id as ConversionSettings['pdfToWordMode'] }))
                    }
                    className={`p-3 rounded-xl border text-left smooth-theme ${
                      settings.pdfToWordMode === m.id
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-slate-900 dark:text-white'
                        : 'bg-purple-50/40 dark:bg-slate-950/60 border-purple-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
                    }`}
                  >
                    <div className="text-xs font-extrabold">{m.title}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {m.desc}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PDF Source Options: Page Range & DPI */}
          {isPdfSource && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Rentang Halaman PDF
                </label>
                <input
                  type="text"
                  value={settings.pageRange}
                  onChange={(e) => setSettings((s) => ({ ...s, pageRange: e.target.value }))}
                  placeholder="all atau contoh: 1-3, 5"
                  className="w-full px-3 py-2 text-sm rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Ketik <code className="text-indigo-600 dark:text-indigo-400 font-bold">all</code> untuk semua halaman, atau{' '}
                  <code className="text-indigo-600 dark:text-indigo-400 font-bold">1-3, 5</code>
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Ketajaman Render PDF (DPI)
                </label>
                <select
                  value={settings.pdfDpiScale}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      pdfDpiScale: Number(e.target.value) as ConversionSettings['pdfDpiScale'],
                    }))
                  }
                  className="w-full px-3 py-2 text-sm rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value={1.5}>Standar Cepat (150 DPI)</option>
                  <option value={2}>Tinggi / HD (300 DPI - Direkomendasikan)</option>
                  <option value={3}>Ultra HD Cetak (450 DPI)</option>
                </select>
              </div>
            </div>
          )}

          {/* PDF Target Orientation */}
          {isPdfTarget && !isPdfSource && (
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Orientasi Halaman PDF
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {(['portrait', 'landscape'] as const).map((ori) => (
                  <button
                    key={ori}
                    type="button"
                    onClick={() => setSettings((s) => ({ ...s, pdfOrientation: ori }))}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold capitalize smooth-theme ${
                      settings.pdfOrientation === ori
                        ? 'bg-indigo-50 dark:bg-indigo-600/20 border-indigo-500 text-indigo-900 dark:text-white'
                        : 'bg-purple-50/40 dark:bg-slate-950 border-purple-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {ori === 'portrait' ? 'Potret (Tegak)' : 'Lanskap (Mendatar)'}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Image Controls */}
          {isImageJob && (
            <div className="space-y-4">
              {/* Quality Slider */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold mb-1.5">
                  <span className="text-slate-700 dark:text-slate-300">Kualitas & Kompresi Gambar</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-mono">{settings.quality}%</span>
                </div>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={settings.quality}
                  onChange={(e) => setSettings((s) => ({ ...s, quality: Number(e.target.value) }))}
                  className="w-full accent-indigo-600"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-0.5">
                  <span>Ukuran Kecil (10%)</span>
                  <span>Seimbang (85%)</span>
                  <span>Maksimal (100%)</span>
                </div>
              </div>

              {/* ICO Size Picker */}
              {outExt === 'ico' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Dimensi Favicon (.ICO)
                  </label>
                  <div className="grid grid-cols-6 gap-2">
                    {([16, 32, 48, 64, 128, 256] as const).map((sz) => (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSettings((s) => ({ ...s, icoSize: sz }))}
                        className={`py-2 rounded-xl border text-xs font-mono font-bold smooth-theme ${
                          settings.icoSize === sz
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-purple-50/50 dark:bg-slate-950 border-purple-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {sz}px
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Scale & Filter */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Skala Resolusi
                  </label>
                  <select
                    value={settings.scale}
                    onChange={(e) => setSettings((s) => ({ ...s, scale: Number(e.target.value) }))}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={25}>25% (Thumbnail)</option>
                    <option value={50}>50% (Setengah)</option>
                    <option value={75}>75%</option>
                    <option value={100}>100% (Resolusi Asli)</option>
                    <option value={150}>150% (Upscale)</option>
                    <option value={200}>200% (2x Lipat)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Filter Efek Warna
                  </label>
                  <select
                    value={settings.filter}
                    onChange={(e) =>
                      setSettings((s) => ({ ...s, filter: e.target.value as ConversionSettings['filter'] }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="none">Tanpa Filter (Normal)</option>
                    <option value="grayscale">Hitam Putih (Grayscale)</option>
                    <option value="sepia">Vintage Sepia</option>
                    <option value="contrast">Auto-Pertajam Kontras</option>
                    <option value="invert">Negatif / Invert</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    Rotasi Gambar
                  </label>
                  <select
                    value={settings.rotation}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        rotation: Number(e.target.value) as ConversionSettings['rotation'],
                      }))
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={0}>0° (Normal)</option>
                    <option value={90}>Putar 90° Kanan</option>
                    <option value={180}>Putar 180°</option>
                    <option value={270}>Putar 270° Kiri</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Media Audio & Video Settings */}
          {isMediaJob && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(outExt) && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Audio Sample Rate
                    </label>
                    <select
                      value={settings.audioSampleRate}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          audioSampleRate: Number(e.target.value) as ConversionSettings['audioSampleRate'],
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={22050}>22.050 Hz (Voice / Ukuran Kecil)</option>
                      <option value={44100}>44.100 Hz (Standar CD Musik)</option>
                      <option value={48000}>48.000 Hz (Studio DVD/Video)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kanal Suara (Channel)
                    </label>
                    <select
                      value={settings.audioChannels}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          audioChannels: Number(e.target.value) as ConversionSettings['audioChannels'],
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={2}>Stereo (2 Kanal)</option>
                      <option value={1}>Mono (1 Kanal)</option>
                    </select>
                  </div>
                </>
              )}

              {outExt === 'gif' && (
                <>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Kecepatan Frame GIF (FPS)
                    </label>
                    <select
                      value={settings.gifFps}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          gifFps: Number(e.target.value) as ConversionSettings['gifFps'],
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={8}>8 FPS (Ringan)</option>
                      <option value={10}>10 FPS (Seimbang)</option>
                      <option value={15}>15 FPS (Halus)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                      Lebar Resolusi GIF
                    </label>
                    <select
                      value={settings.gifWidth}
                      onChange={(e) =>
                        setSettings((s) => ({
                          ...s,
                          gifWidth: Number(e.target.value) as ConversionSettings['gifWidth'],
                        }))
                      }
                      className="w-full px-3 py-2 text-xs rounded-xl bg-purple-50/50 dark:bg-slate-950 border border-purple-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value={320}>320 px (Chat / Sticker)</option>
                      <option value={480}>480 px (Standar Web)</option>
                      <option value={640}>640 px (HD GIF)</option>
                    </select>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Apply to all checkbox */}
          <label className="flex items-center gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={applyToAll}
              onChange={(e) => setApplyToAll(e.target.checked)}
              className="w-4 h-4 rounded accent-indigo-600"
            />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Terapkan pengaturan ini ke semua file dalam antrean
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-purple-100 dark:border-slate-800 bg-purple-50/40 dark:bg-slate-950/60 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setSettings({ ...DEFAULT_SETTINGS })}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(job.id, settings, applyToAll);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Pengaturan</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
