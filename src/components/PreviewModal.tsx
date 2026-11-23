import React, { useEffect, useState } from 'react';
import { X, Download, Eye, FileText } from 'lucide-react';
import { ConversionJob } from '../types/converter';
import { formatBytes } from '../utils/sampleGenerator';

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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl rounded-2xl border border-slate-700/80 bg-slate-900 text-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Eye className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">
                Pratinjau Hasil: {job.resultFileName}
              </h3>
              <p className="text-xs text-slate-400">
                Ukuran hasil: {formatBytes(job.resultSize)} • Format .{ext.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownload(job)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition"
            >
              <Download className="w-3.5 h-3.5" />
              Download File
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 overflow-auto flex-1 flex items-center justify-center bg-slate-950/50 min-h-[320px]">
          {isImage && job.resultUrl && (
            <img
              src={job.resultUrl}
              alt={job.resultFileName}
              className="max-h-[62vh] max-w-full object-contain rounded-xl border border-slate-800 shadow-lg bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]"
            />
          )}

          {isPdf && job.resultUrl && (
            <iframe
              src={job.resultUrl}
              title={job.resultFileName}
              className="w-full h-[62vh] rounded-xl border border-slate-800 bg-white"
            />
          )}

          {isAudio && job.resultUrl && (
            <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 text-center space-y-4">
              <div className="text-sm font-semibold text-slate-200">{job.resultFileName}</div>
              <audio controls src={job.resultUrl} className="w-full" autoPlay />
            </div>
          )}

          {isVideo && job.resultUrl && (
            <video controls src={job.resultUrl} className="max-h-[60vh] max-w-full rounded-xl" autoPlay />
          )}

          {isTextReadable && (
            <pre className="w-full h-[58vh] overflow-auto p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-200 leading-relaxed">
              {textPreview ?? 'Memuat pratinjau teks...'}
            </pre>
          )}

          {!isImage && !isPdf && !isAudio && !isVideo && !isTextReadable && (
            <div className="text-center py-12 space-y-3 max-w-md">
              <FileText className="w-12 h-12 text-indigo-400 mx-auto" />
              <div className="text-base font-bold text-white">{job.resultFileName}</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                File dokumen biner (.{ext.toUpperCase()}) sebesar{' '}
                <strong className="text-slate-200">{formatBytes(job.resultSize)}</strong> telah selesai dibuat dan siap dibuka di aplikasi Microsoft Office / LibreOffice / perangkat Anda.
              </p>
              <button
                onClick={() => onDownload(job)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition"
              >
                <Download className="w-4 h-4" />
                Download Sekarang
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
