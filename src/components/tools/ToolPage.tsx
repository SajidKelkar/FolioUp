import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertCircle, ArrowLeft, ArrowRight, CheckCircle2, Download, FileText,
  RotateCcw, Sparkles,
} from 'lucide-react';
import { getToolBySlug, getToolIcon } from '@/lib/tools';
import {
  processors,
  type ProcessResult,
} from '@/lib/processors';
import { loadPdf } from '@/lib/pdf/document';
import DropZone from '@/components/upload/DropZone';
import FileList from '@/components/upload/FileList';
import ConfigPanel from '@/components/tools/ConfigPanel';
import { Badge, Button, LinkButton } from '@/components/ui/Button';
import { ProcessingVisual } from '@/components/animations/Primitives';

type Stage = 'upload' | 'processing' | 'success' | 'error';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
}

const documentInfoLabels: Record<string, string> = {
  pages: 'Pages',
  fileSize: 'File size',
  title: 'Title',
  author: 'Author',
  creator: 'Creator',
  producer: 'Producer',
  creationDate: 'Created',
};

function formatDocumentInfo(key: string, value: string | number): string {
  return key === 'fileSize' ? formatSize(Number(value)) : String(value);
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatKilobytes(bytes: number): string {
  return `${(bytes / 1024).toFixed(2)} KB`;
}

let idCounter = 0;
function makeId() {
  idCounter += 1;
  return `f-${Date.now()}-${idCounter}`;
}

const stageVariants = {
  initial: { opacity: 0, y: 8, scale: 0.99 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8, scale: 0.99 },
};
const processingAnimationMs = 360;

function defaultsFor(tool: { configOptions: { id: string; default: string | boolean | number }[] }) {
  const values: Record<string, string> = {};
  for (const opt of tool.configOptions) values[opt.id] = String(opt.default);
  return values;
}

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const tool = slug ? getToolBySlug(slug) : undefined;
  const [files, setFiles] = useState<FileItem[]>([]);
  const [config, setConfig] = useState<Record<string, string>>({});
  const [stage, setStage] = useState<Stage>('upload');
  const [progress, setProgress] = useState({ stage: '', percent: 0 });
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [error, setError] = useState('');

  const Icon = useMemo(() => (tool ? getToolIcon(tool.iconName) : FileText), [tool]);

  useEffect(() => {
    setFiles([]);
    setResult(null);
    setError('');
    setStage('upload');
    setProgress({ stage: '', percent: 0 });
    if (tool) setConfig(defaultsFor(tool));
  }, [tool]);

  const handleFilesAdded = useCallback(
    async (incoming: File[]) => {
      if (!tool) return;
      const nextItems: FileItem[] = tool.multiple
        ? incoming.map((file) => ({ id: makeId(), file }))
        : [{ id: makeId(), file: incoming[0] }];

      const withCounts = await Promise.all(
        nextItems.map(async (item) => {
          if (!item.file.type.includes('pdf') && !item.file.name.toLowerCase().endsWith('.pdf')) {
            return item;
          }
          try {
            const doc = await loadPdf(await item.file.arrayBuffer());
            return { ...item, pageCount: doc.getPageCount() };
          } catch {
            return item;
          }
        }),
      );

      if (!tool.multiple) {
        setError('');
        setFiles(withCounts.slice(0, 1));
        return;
      }

      const remainingSlots = Math.max(0, tool.maxFiles - files.length);
      const acceptedFiles = withCounts.slice(0, remainingSlots);
      const rejectedCount = withCounts.length - acceptedFiles.length;
      setError(
        rejectedCount > 0
          ? `You can add up to ${tool.maxFiles} files. ${rejectedCount} file${
              rejectedCount === 1 ? ' was' : 's were'
            } not added.`
          : '',
      );
      setFiles((prev) => {
        return [...prev, ...acceptedFiles].slice(0, tool.maxFiles);
      });
    },
    [tool, files.length],
  );

  const handleProcess = async () => {
    if (!tool || files.length === 0) return;
    const fn = processors[tool.id];
    if (!fn) {
      setError('This tool is not yet available. Check back soon.');
      setStage('error');
      return;
    }
    const startedAt = performance.now();
    setStage('processing');
    setProgress({ stage: 'Starting…', percent: 5 });
    setError('');
    try {
      const res = await fn(
        files.map((f) => f.file),
        config,
        {
          onProgress: (stageName, percent) => {
            setProgress({ stage: stageName, percent: percent ?? 40 });
          },
        },
      );
      const remainingAnimationTime = processingAnimationMs - (performance.now() - startedAt);
      if (remainingAnimationTime > 0) {
        await new Promise<void>((resolve) => window.setTimeout(resolve, remainingAnimationTime));
      }
      setProgress({ stage: 'Done', percent: 100 });
      setResult(res);
      setStage('success');
    } catch (err) {
    console.error('FolioUp processing error:', err);

    const message = err instanceof Error ? err.message : '';
    setError(
      message && !/internal error|undefined|null/i.test(message)
        ? message
        : 'Something went wrong while processing your file. Please try again with a valid PDF.',
    );
    setStage('error');
  }
  };

  const handleReset = () => {
    setFiles([]);
    setResult(null);
    setError('');
    setStage('upload');
    setProgress({ stage: '', percent: 0 });
    if (tool) setConfig(defaultsFor(tool));
  };

  const handleDownload = () => {
  if (!result || result.outputSize === 0) return;

  const url = URL.createObjectURL(result.blob);
  const a = document.createElement('a');

  a.href = url;
  a.download = result.outputName;
  a.style.display = 'none';

  document.body.appendChild(a);
  a.click();
  a.remove();

  // Give the browser time to start the download before cleanup.
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
  };

  if (!tool) return <Navigate to="/all-tools" replace />;
  if (tool.status === 'planned') return <PlannedTool tool={tool} Icon={Icon} />;

  const showReorder = tool.multiple;
  const showConfig = tool.configOptions.length > 0 && files.length > 0;
  const showsDocumentInfo = tool.id === 'page-count' || tool.id === 'metadata';
  const compressionDidNotReduce =
    tool.id === 'compress' && result?.meta?.method === 'original-retained-no-savings';
  const optimizationDidNotReduce =
    tool.id === 'optimize' && result?.meta?.method === 'original-retained-no-savings';
  const stepLabels = showsDocumentInfo ? ['Add files', 'Process', 'Results'] : ['Add files', 'Process', 'Download'];
  const activeStep = stage === 'success' ? 3 : stage === 'processing' || files.length > 0 ? 2 : 1;
  const originalSize = files.reduce((sum, f) => sum + f.file.size, 0);
  const savedRatio = result?.meta?.originalSize
    ? 1 - result.outputSize / Number(result.meta.originalSize)
    : 0;
  const sizeReductionBytes = result?.meta?.originalSize
    ? Number(result.meta.originalSize) - result.outputSize
    : 0;
  const imageSizeReduction =
    result?.meta?.originalSize !== undefined && result.meta.compressedSize !== undefined
      ? Number(result.meta.originalSize) - Number(result.meta.compressedSize)
      : 0;
  const resizedImageSize =
    result?.meta?.originalSize !== undefined && result.meta.resizedSize !== undefined
      ? Number(result.meta.resizedSize)
      : undefined;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to="/all-tools"
        className="group mb-5 inline-flex items-center gap-1.5 text-sm font-medium text-navy-500 transition-colors hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        All tools
      </Link>

      <motion.header
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative mb-5 overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50 p-5 text-navy-900 shadow-card sm:p-6"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_85%_10%,rgba(20,184,166,.13),transparent_42%),radial-gradient(ellipse_at_15%_100%,rgba(45,212,191,.10),transparent_42%)]" />
        <div className="absolute -right-10 -top-24 h-64 w-64 rounded-full border border-brand-200/50 transition-transform duration-700 group-hover:scale-110" />
        <div className="absolute -right-2 -top-16 h-48 w-48 rounded-full border border-brand-200/40" />
        <div className="relative flex items-start gap-3.5 sm:gap-4">
          <motion.div
            initial={{ scale: 0.8, rotate: -8, opacity: 0 }}
            animate={{ scale: 1, rotate: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.12 }}
            whileHover={{ y: -3, rotate: 3 }}
            className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-brand-100 bg-white text-brand-600 shadow-soft sm:h-14 sm:w-14"
          >
            <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
          </motion.div>
          <div className="min-w-0 pt-0.5">
            <h1 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">{tool.name}</h1>
            <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-navy-600">{tool.description}</p>
          </div>
        </div>

        <ol aria-label="Tool steps" className="relative mt-5 grid grid-cols-3 gap-2 border-t border-brand-100 pt-4 sm:gap-4">
          {stepLabels.map((label, index) => {
            const step = index + 1;
            const complete = activeStep >= step;
            return (
              <li key={label} aria-current={activeStep === step ? 'step' : undefined} className="flex min-w-0 items-center gap-2 sm:gap-2.5">
                <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-[11px] font-bold transition-all duration-300 sm:h-8 sm:w-8 ${complete ? 'bg-brand-gradient text-white shadow-glow' : 'border border-brand-100 bg-white text-navy-400'}`}>
                  {activeStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                </span>
                <span className={`truncate text-[11px] font-semibold sm:text-xs ${complete ? 'text-navy-800' : 'text-navy-400'}`}>{label}</span>
              </li>
            );
          })}
        </ol>
      </motion.header>

      <AnimatePresence mode="wait">
        {stage === 'upload' && (
          <motion.div
            key="upload"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="space-y-4"
          >
            {(files.length === 0 || tool.multiple) && (
              <motion.div layout transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}>
                <DropZone
                  onFiles={handleFilesAdded}
                  accept={tool.acceptTypes}
                  acceptLabel={tool.acceptLabel}
                  multiple={tool.multiple}
                  maxSizeMB={tool.maxSizeMB}
                  compact={files.length > 0}
                />
              </motion.div>
            )}
            {error && (
              <p role="alert" className="flex items-center gap-2 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </p>
            )}
            <AnimatePresence>
              {files.length > 0 && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <FileList
                    items={files}
                    onRemove={(id) => {
                      setError('');
                      setFiles((prev) => prev.filter((f) => f.id !== id));
                    }}
                    onReorder={
                      showReorder
                        ? (from, to) =>
                            setFiles((prev) => {
                              const next = [...prev];
                              const [moved] = next.splice(from, 1);
                              next.splice(to, 0, moved);
                              return next;
                            })
                        : undefined
                    }
                    showDragHandle={showReorder}
                  />
                </motion.div>
              )}
            </AnimatePresence>
            {showConfig && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                className="rounded-2xl border border-brand-100 bg-gradient-to-br from-white via-white to-brand-50/40 p-5 shadow-[0_12px_32px_-24px_rgba(13,148,136,0.45)] sm:p-6"
              >
                <div className="mb-4 border-b border-brand-100/80 pb-4">
                  <h3 className="text-base font-bold tracking-tight text-navy-900">Choose your settings</h3>
                  <p className="mt-1 text-xs leading-relaxed text-navy-500">These settings are applied to your output.</p>
                </div>
                <ConfigPanel
                  options={tool.configOptions}
                  values={config}
                  onChange={(id, value) => setConfig((c) => ({ ...c, [id]: value }))}
                />
              </motion.div>
            )}
            {files.length > 0 && (
              <motion.div layout className="relative flex flex-col justify-between gap-3 overflow-hidden rounded-2xl border border-brand-100 bg-white px-4 py-3.5 shadow-soft sm:flex-row sm:items-center">
                <div className="text-sm text-navy-900">
                  <p className="font-semibold">{files.length} file{files.length > 1 ? 's' : ''} ready · {formatSize(originalSize)}</p>
                  <p className="text-xs text-navy-500">Ready to process on this device</p>
                </div>
                <Button
                  onClick={handleProcess}
                  size="lg"
                  className="w-full justify-center sm:w-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  {tool.name}
                </Button>
              </motion.div>
            )}
          </motion.div>
        )}

        {stage === 'processing' && (
          <motion.div
            key="processing"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            className="relative overflow-hidden rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/50 to-cyan-50/50 p-6 text-center shadow-card sm:p-9"
          >
            <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-brand-200/30 blur-3xl" />
            <motion.div
              className="relative"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            >
              <ProcessingVisual toolId={tool.id} />
              <p className="text-[10px] font-bold uppercase tracking-[.2em] text-brand-700">Working on it</p>
              <h2 className="mt-1.5 font-display text-xl font-extrabold text-navy-900">Processing your file</h2>
              <div className="mx-auto mt-6 max-w-sm">
              <div className="h-2.5 overflow-hidden rounded-full bg-brand-100">
                <motion.div
                  className="h-full rounded-full bg-brand-gradient"
                  animate={{ width: `${progress.percent}%` }}
                  transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            <p aria-live="polite" className="mt-2 flex justify-between text-[11px] font-medium text-navy-500">
                <span>{progress.stage}</span><span>{Math.round(progress.percent)}%</span>
              </p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {stage === 'success' && result && (
          <motion.div
            key="success"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative overflow-hidden rounded-2xl border border-brand-200 bg-gradient-to-br from-brand-50 via-white to-emerald-50/70 p-5 shadow-card sm:p-7"
          >
            <div className="pointer-events-none absolute -right-8 -top-10 h-40 w-40 rounded-full bg-brand-200/30 blur-3xl" />
            <div className="relative mb-5 flex flex-col items-center gap-3 rounded-2xl border border-brand-100 bg-white/80 px-5 py-6 text-center shadow-soft sm:flex-row sm:text-left">
              <div className="relative grid h-14 w-14 shrink-0 place-items-center">
                <motion.span
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: [0.7, 1.15, 1], opacity: [0, 0.5, 0] }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="absolute inset-0 rounded-2xl bg-brand-200"
                />
                <motion.span
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.08 }}
                  className="relative grid h-12 w-12 place-items-center rounded-2xl bg-brand-gradient text-white shadow-glow"
                >
                  <CheckCircle2 className="h-7 w-7" />
                </motion.span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[.18em] text-brand-700">All done</p>
                <h2 className="mt-1 font-display text-xl font-extrabold text-navy-900">
                  {showsDocumentInfo
                    ? 'Document details are ready'
                    : compressionDidNotReduce
                      ? 'No size reduction was possible'
                      : optimizationDidNotReduce
                        ? 'No optimization was possible'
                      : 'Your file is ready'}
                </h2>
                <p className="mt-1 text-sm text-navy-500">
                  {showsDocumentInfo
                    ? 'Here are the properties we could read from your PDF.'
                    : compressionDidNotReduce
                      ? 'Compression could not reduce this PDF. FolioUp kept your original instead of returning a larger file.'
                      : optimizationDidNotReduce
                        ? 'Rewriting did not reduce this PDF, so the original is ready to download.'
                      : `${tool.outputLabel} created successfully.`}
                </p>
              </div>
              {!showsDocumentInfo && <motion.div
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.35 }}
                className="hidden items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700 sm:inline-flex"
              >
                <FileText className="h-4 w-4" />
                {formatSize(result.outputSize)}
              </motion.div>}
            </div>

            {showsDocumentInfo && result.meta && (
              <dl aria-label="Document properties" className="relative mb-5 grid grid-cols-1 gap-2 rounded-xl border border-brand-100 bg-white/80 p-3.5 sm:grid-cols-2">
                {Object.entries(result.meta).map(([key, value]) => (
                  <div key={key} className="min-w-0 rounded-lg bg-brand-50/60 px-3 py-2.5">
                    <dt className="text-[11px] font-medium text-navy-500">{documentInfoLabels[key] ?? key}</dt>
                    <dd className="mt-0.5 break-words text-sm font-semibold text-navy-900">{formatDocumentInfo(key, value)}</dd>
                  </div>
                ))}
              </dl>
            )}

            {!showsDocumentInfo && <div className="mb-5 flex items-center gap-3 rounded-xl border border-brand-100 bg-white/80 p-3.5">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient-soft text-brand-700">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-navy-900">{result.outputName}</p>
                <p className="mt-0.5 text-xs text-navy-500">
                  {compressionDidNotReduce || optimizationDidNotReduce
                    ? 'Original PDF · no size reduction'
                    : tool.outputLabel} · {formatSize(result.outputSize)}
                </p>
              </div>
              <CheckCircle2 className="h-5 w-5 shrink-0 text-brand-600" />
            </div>}

            {tool.id === 'compress' && result.meta?.originalSize && (
              <div className="mb-5 rounded-xl border border-brand-100 bg-white p-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="text-center">
                    <p className="text-xs text-navy-400">Original</p>
                    <p className="text-lg font-bold text-navy-900">{formatKilobytes(Number(result.meta.originalSize))}</p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-brand-400" />
                  <div className="text-center">
                    <p className="text-xs text-navy-400">Output</p>
                    <p className="text-lg font-bold text-navy-900">{formatKilobytes(result.outputSize)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-navy-400">Change</p>
                    <p className={`text-lg font-bold ${savedRatio > 0 ? 'text-success-600' : 'text-navy-700'}`}>
                      {sizeReductionBytes > 0
                        ? `${formatKilobytes(sizeReductionBytes)} smaller`
                        : formatKilobytes(0)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {['compress-image', 'convert-image'].includes(tool.id) && result.meta?.originalSize !== undefined && (
              <div className="mb-5 grid grid-cols-3 gap-2 rounded-xl border border-brand-100 bg-white p-3 sm:p-4">
                <div>
                  <p className="text-[11px] text-navy-400">Original images</p>
                  <p className="mt-1 text-sm font-bold text-navy-900">{formatKilobytes(Number(result.meta.originalSize))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-navy-400">{tool.id === 'convert-image' ? 'Output images' : 'Compressed images'}</p>
                  <p className="mt-1 text-sm font-bold text-navy-900">{formatKilobytes(Number(result.meta.compressedSize))}</p>
                </div>
                <div>
                  <p className="text-[11px] text-navy-400">Size change</p>
                  <p className={`mt-1 text-sm font-bold ${imageSizeReduction > 0 ? 'text-success-600' : 'text-navy-700'}`}>
                    {imageSizeReduction > 0
                      ? `${Math.round((imageSizeReduction / Number(result.meta.originalSize)) * 100)}% smaller`
                      : 'No size reduction'}
                  </p>
                </div>
                <p className="col-span-3 text-[10px] text-navy-400">Image data size, before ZIP packaging.</p>
              </div>
            )}

            {tool.id === 'resize-image' && resizedImageSize !== undefined && (
              <div className="mb-5 grid grid-cols-2 gap-3 rounded-xl border border-brand-100 bg-white p-4">
                <div>
                  <p className="text-[11px] text-navy-400">Images resized</p>
                  <p className="mt-1 text-base font-bold text-navy-900">{result.meta?.images}</p>
                </div>
                <div>
                  <p className="text-[11px] text-navy-400">Output dimensions</p>
                  <p className="mt-1 text-base font-bold text-navy-900">
                    {result.meta?.dimensions ?? 'Aspect ratio preserved'}
                  </p>
                </div>
                <p className="col-span-2 text-[10px] text-navy-400">Multiple-image output includes files with their individual dimensions.</p>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {result.outputSize > 0 && (
                <Button onClick={handleDownload} size="lg" className="flex-1">
                  <Download className="h-5 w-5" />
                  {compressionDidNotReduce || optimizationDidNotReduce
                    ? 'Download original'
                    : `Download ${result.outputName}`}
                </Button>
              )}
              <Button variant="secondary" size="lg" onClick={handleReset}>
                <RotateCcw className="h-4 w-4" />
                Process another
              </Button>
            </div>
          </motion.div>
        )}

        {stage === 'error' && (
          <motion.div
            key="error"
            role="alert"
            variants={stageVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="rounded-2xl border border-error-200 bg-error-50/50 p-8 shadow-card text-center"
          >
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-error-100 mb-3">
              <AlertCircle className="h-7 w-7 text-error-600" />
            </div>
            <h2 className="text-lg font-semibold text-navy-900">Processing did not finish</h2>
            <p className="mt-1.5 text-sm text-navy-600 max-w-md mx-auto">{error}</p>
            <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={handleProcess} size="md">
                <RotateCcw className="h-4 w-4" />
                Try again
              </Button>
              <Button variant="secondary" size="md" onClick={handleReset}>
                Start over
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

function PlannedTool({
  tool,
  Icon,
}: {
  tool: { name: string; description: string; longDescription: string; engine: string };
  Icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="animate-fade-scale mx-auto max-w-2xl py-10 text-center">
      <Link to="/all-tools" className="inline-flex items-center gap-1.5 text-sm text-navy-500 hover:text-brand-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        All tools
      </Link>
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-navy-100 mb-4">
        <Icon className="h-8 w-8 text-navy-400" />
      </div>
      <Badge color="neutral" className="mb-3">Coming soon</Badge>
      <h1 className="font-display text-2xl font-extrabold text-navy-900">{tool.name}</h1>
      <p className="mt-2 text-sm text-navy-500">{tool.longDescription}</p>
      <p className="mt-4 text-xs text-navy-400">Planned engine: {tool.engine}</p>
      <div className="mt-8">
        <LinkButton to="/all-tools" variant="secondary" size="lg">
          Browse available tools
          <ArrowRight className="h-4 w-4" />
        </LinkButton>
      </div>
    </div>
  );
}
