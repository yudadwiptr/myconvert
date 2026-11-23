import React, { useEffect, useState } from 'react';
import { useDialog } from '../hooks/useDialog';
import { X, Download, Eye, FileText } from 'lucide-react';
import { ConversionJob } from '../types/converter';
import { formatBytes } from '../utils/formatBytes';

interface PreviewModalProps {
  job: ConversionJob;
  onDownload: (job: ConversionJob) => void;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({ job, onDownload, onClose }) => {
  const [textPreview, setTextPreview] = useState<string | null>(null);
  const ext = (job.resultFileName?.split('.').pop() || job.targetExt).toLowerCase();

  const isImage = ['png', 'jpg', 'jpeg', 'webp', 'avif', 'gif', 'svg', 'bmp', 'ico'].includes(ext);
  const isPdf = ext === 'pdf';
  const isAudio = ['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(ext);
  const isVideo = ['mp4', 'webm'].includes(ext);
  const isTextReadable = ['txt', 'md', 'html', 'csv', 'json', 'xml', 'yaml', 'sql', 'rtf'].includes(ext);

  useEffect(() => {
    if (isTextReadable && job.resultBlob) {
      job.resultBlob.text().then((t) => {
        setTextPreview(t.slice(0, 15000));
      });
    }
  }, [job.resultBlob, isTextReadable]);

  const dialogRef = useDialog<HTMLDivElement>(onClose);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 dark:bg-slate-950/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-line bg-surface text-fg shadow-2xl overflow-hidden flex flex-col max-h-[85vh] smooth-theme"
        onClick={(e) => e.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Pratinjau hasil konversi"
        tabIndex={-1}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-line-soft flex items-center justify-between bg-sunken/50">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-extrabold text-fg truncate">
                Pratinjau Hasil: {job.resultFileName}
              </h3>
              <p className="text-xs text-fg-muted">
                Ukuran hasil: {formatBytes(job.resultSize)} • Format .{ext.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(job)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
            <button
              aria-label="Tutup"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-purple-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-auto flex-1 flex items-center justify-center bg-sunken/30 min-h-[320px]">
          {isImage && job.resultUrl && (
            <img
              src={job.resultUrl}
              alt={job.resultFileName}
              className="max-h-[62vh] max-w-full object-contain rounded-xl border border-line shadow-lg"
            />
          )}

          {isPdf && job.resultUrl && (
            <iframe
              src={job.resultUrl}
              title={job.resultFileName}
              className="w-full h-[62vh] rounded-xl border border-line bg-white"
            />
          )}

          {isAudio && job.resultUrl && (
            <div className="w-full max-w-md p-6 rounded-2xl bg-surface border border-line text-center space-y-4">
              <div className="text-sm font-bold text-fg">{job.resultFileName}</div>
              <audio controls src={job.resultUrl} className="w-full" autoPlay />
            </div>
          )}

          {isVideo && job.resultUrl && (
            <video controls src={job.resultUrl} className="max-h-[60vh] max-w-full rounded-xl" autoPlay />
          )}

          {isTextReadable && (
            <pre className="w-full h-[58vh] overflow-auto p-4 rounded-xl bg-white dark:bg-slate-950 border border-line text-xs font-mono text-fg-soft leading-relaxed">
              {textPreview ?? 'Memuat pratinjau teks...'}
            </pre>
          )}

          {!isImage && !isPdf && !isAudio && !isVideo && !isTextReadable && (
            <div className="text-center py-12 space-y-3 max-w-md">
              <FileText className="w-12 h-12 text-accent mx-auto" />
              <div className="text-base font-extrabold text-fg">
                {job.resultFileName}
              </div>
              <p className="text-xs text-fg-muted leading-relaxed">
                File dokumen biner (.{ext.toUpperCase()}) sebesar{' '}
                <strong className="text-fg">
                  {formatBytes(job.resultSize)}
                </strong>{' '}
                telah selesai dibuat dan siap dibuka di aplikasi Microsoft Office / LibreOffice / perangkat Anda.
              </p>
              <button
                onClick={() => onDownload(job)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Download Sekarang</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
