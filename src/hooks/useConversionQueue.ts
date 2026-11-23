import { useMemo, useState } from 'react';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';
import { ConversionJob, ConversionSettings } from '../types/converter';
import {
  DEFAULT_SETTINGS,
  detectFileExtension,
  detectFormatCategory,
  getAvailableTargetFormats,
  getDefaultTargetFormat,
} from '../data/formats';
import { executeConversionJob } from '../engines';

/** Reset a job to "idle" with a new target format, freeing any previous result. */
function retarget(job: ConversionJob, targetExt: string): ConversionJob {
  if (job.resultUrl) URL.revokeObjectURL(job.resultUrl);
  return {
    ...job,
    targetExt,
    status: 'idle',
    progress: 0,
    resultBlob: undefined,
    resultUrl: undefined,
    resultFileName: undefined,
    resultSize: undefined,
    errorMessage: undefined,
  };
}

/** State and actions for the file conversion queue. */
export function useConversionQueue() {
  const [jobs, setJobs] = useState<ConversionJob[]>([]);
  const [isZippingAll, setIsZippingAll] = useState(false);

  const patchJob = (jobId: string, patch: Partial<ConversionJob> | ((j: ConversionJob) => Partial<ConversionJob>)) =>
    setJobs((prev) =>
      prev.map((j) => (j.id === jobId ? { ...j, ...(typeof patch === 'function' ? patch(j) : patch) } : j))
    );

  const addFiles = (incoming: FileList | File[], preferredTargetExt?: string) => {
    const fileArray = Array.from(incoming);
    if (fileArray.length === 0) return;

    const newJobs: ConversionJob[] = fileArray.map((file) => {
      const sourceExt = detectFileExtension(file);
      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        sourceExt,
        sourceCategory: detectFormatCategory(sourceExt),
        targetExt: getDefaultTargetFormat(sourceExt, preferredTargetExt),
        status: 'idle',
        progress: 0,
        settings: { ...DEFAULT_SETTINGS },
      };
    });

    setJobs((prev) => [...prev, ...newJobs]);
  };

  const setJobTarget = (jobId: string, targetExt: string) =>
    setJobs((prev) =>
      prev.map((j) => (j.id !== jobId || j.targetExt === targetExt ? j : retarget(j, targetExt)))
    );

  const setAllTargets = (targetExt: string) =>
    setJobs((prev) =>
      prev.map((j) => (j.status === 'converting' || j.targetExt === targetExt ? j : retarget(j, targetExt)))
    );

  /** Point idle jobs at a preset's target format when they support it. */
  const retargetIdleJobs = (targetExt: string) =>
    setJobs((prev) =>
      prev.map((j) =>
        j.status === 'idle' && getAvailableTargetFormats(j.sourceExt).includes(targetExt)
          ? { ...j, targetExt }
          : j
      )
    );

  const updateSettings = (jobId: string, settings: ConversionSettings, applyToAll: boolean) =>
    setJobs((prev) =>
      prev.map((j) =>
        applyToAll || j.id === jobId
          ? {
              ...j,
              settings: { ...settings },
              status: j.status === 'done' ? 'idle' : j.status,
              progress: j.status === 'done' ? 0 : j.progress,
            }
          : j
      )
    );

  const removeJob = (jobId: string) =>
    setJobs((prev) => {
      const target = prev.find((j) => j.id === jobId);
      if (target?.resultUrl) URL.revokeObjectURL(target.resultUrl);
      return prev.filter((j) => j.id !== jobId);
    });

  const clearAll = () => {
    jobs.forEach((j) => {
      if (j.resultUrl) URL.revokeObjectURL(j.resultUrl);
    });
    setJobs([]);
  };

  const runJob = async (job: ConversionJob) => {
    patchJob(job.id, {
      status: 'converting',
      progress: 5,
      statusMessage: 'Memulai konversi...',
      errorMessage: undefined,
      startedAt: Date.now(),
    });

    try {
      const result = await executeConversionJob(job, (pct, msg) =>
        patchJob(job.id, (j) => ({ progress: pct, statusMessage: msg || j.statusMessage }))
      );
      patchJob(job.id, {
        status: 'done',
        progress: 100,
        statusMessage: 'Konversi selesai',
        resultBlob: result.blob,
        resultUrl: URL.createObjectURL(result.blob),
        resultFileName: result.outputFileName,
        resultSize: result.blob.size,
        completedAt: Date.now(),
      });
    } catch (err) {
      patchJob(job.id, {
        status: 'error',
        progress: 0,
        errorMessage: err instanceof Error ? err.message : 'Gagal mengonversi file.',
      });
    }
  };

  const runAll = async () => {
    const pending = jobs.filter((j) => j.status === 'idle' || j.status === 'error');
    for (const job of pending) {
      await runJob(job);
    }
  };

  const downloadJob = (job: ConversionJob) => {
    if (job.resultBlob && job.resultFileName) saveAs(job.resultBlob, job.resultFileName);
  };

  const downloadAllZip = async () => {
    const completed = jobs.filter((j) => j.status === 'done' && j.resultBlob && j.resultFileName);
    if (completed.length === 0) return;
    setIsZippingAll(true);
    try {
      const zip = new JSZip();
      completed.forEach((j, idx) => {
        zip.file(j.resultFileName || `hasil_${idx + 1}.${j.targetExt}`, j.resultBlob!.arrayBuffer());
      });
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      saveAs(zipBlob, `MyConvert_Batch_${completed.length}_Files.zip`);
    } finally {
      setIsZippingAll(false);
    }
  };

  /** Formats every queued file can be converted to (for "Ubah semua ke"). */
  const commonTargetFormats = useMemo(() => {
    if (jobs.length === 0) return [];
    let intersection = getAvailableTargetFormats(jobs[0].sourceExt);
    for (let i = 1; i < jobs.length; i++) {
      const avail = new Set(getAvailableTargetFormats(jobs[i].sourceExt));
      intersection = intersection.filter((ext) => avail.has(ext));
    }
    return intersection;
  }, [jobs]);

  const allSameTarget = jobs.length > 0 && jobs.every((j) => j.targetExt === jobs[0].targetExt);
  const pendingCount = jobs.filter((j) => j.status === 'idle' || j.status === 'error').length;
  const convertingCount = jobs.filter((j) => j.status === 'converting').length;
  const completedCount = jobs.filter((j) => j.status === 'done').length;

  return {
    jobs,
    isZippingAll,
    commonTargetFormats,
    allSameTarget,
    pendingCount,
    convertingCount,
    completedCount,
    addFiles,
    setJobTarget,
    setAllTargets,
    retargetIdleJobs,
    updateSettings,
    removeJob,
    clearAll,
    runJob,
    runAll,
    downloadJob,
    downloadAllZip,
  };
}

export type ConversionQueue = ReturnType<typeof useConversionQueue>;
