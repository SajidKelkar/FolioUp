import { motion, useReducedMotion } from 'framer-motion';
import {
  Archive, ArrowLeftRight, Crop, FileImage, FileText, GitCompare, Image as ImageIcon,
  Layers, RotateCw, ScanText, Scaling, ShieldCheck, Type,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface FadeUpProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export function FadeUp({ children, delay = 0, className = '' }: FadeUpProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.36, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

interface StaggerProps {
  children: ReactNode;
  className?: string;
}

export function Stagger({ children, className = '' }: StaggerProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.035 } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className = '' }: FadeUpProps) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 10 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.32, ease: [0.22, 1, 0.36, 1] } },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Tool-specific processing animations
export function ProcessingVisual({ toolId }: { toolId: string }) {
  const reduce = useReducedMotion();

  const animations: Record<string, ReactNode> = {
    compress: <CompressAnim />,
    'compress-image': <CompressImageAnim />,
    'resize-image': <ResizeImageAnim />,
    'convert-image': <ConvertImageAnim />,
    merge: <MergeAnim />,
    split: <SplitAnim />,
    rotate: <RotateAnim />,
    'jpg-to-pdf': <ImageToPdfAnim />,
    'png-to-pdf': <ImageToPdfAnim />,
    'images-to-pdf': <ImageToPdfAnim />,
    'pdf-to-jpg': <PdfToImageAnim />,
    'pdf-to-png': <PdfToImageAnim />,
    'pdf-to-zip': <ArchiveAnim />,
    'pdf-to-text': <ExtractTextAnim />,
    'pdf-to-html': <ExtractTextAnim />,
    'pdf-to-word': <ExtractTextAnim />,
    crop: <CropAnim />,
    compare: <CompareAnim />,
    'page-count': <PageScanAnim />,
    metadata: <PageScanAnim />,
    'page-numbers': <NumberAnim />,
    watermark: <WatermarkAnim />,
    headers: <TextStampAnim />,
    'add-text': <TextStampAnim />,
    'remove-metadata': <PrivacyAnim />,
    optimize: <OptimizeAnim />,
    flatten: <FlattenAnim />,
    'organize-pages': <PageOrderAnim />,
    duplicate: <PageOrderAnim />,
    'delete-pages': <PageOrderAnim />,
    extract: <PageOrderAnim />,
    reverse: <PageOrderAnim />,
    'insert-blank': <PageOrderAnim />,
    'edit-pdf': <ImageToPdfAnim />,
    sign: <ImageToPdfAnim />,
  };

  if (reduce) {
    const StaticIcon: Record<string, typeof FileText> = {
      'compress-image': ImageIcon,
      'resize-image': Scaling,
      'convert-image': ArrowLeftRight,
      'pdf-to-jpg': FileImage,
      'pdf-to-png': FileImage,
      'pdf-to-text': ScanText,
      'pdf-to-html': ScanText,
      'pdf-to-word': ScanText,
      crop: Crop,
      compare: GitCompare,
      'pdf-to-zip': Archive,
      'page-count': FileText,
      metadata: FileText,
      'remove-metadata': ShieldCheck,
      'add-text': Type,
      'edit-pdf': ImageIcon,
      sign: ImageIcon,
      rotate: RotateCw,
      flatten: Layers,
    };
    const Icon = StaticIcon[toolId] ?? FileText;
    return (
      <div className="grid h-40 place-items-center py-8" aria-hidden="true">
        <Icon className="h-12 w-12 text-brand-500" strokeWidth={1.5} />
      </div>
    );
  }

  return (
    <div className="grid place-items-center py-8">
      {animations[toolId] ?? <DefaultAnim />}
    </div>
  );
}

function DocIcon({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} fill="none">
      <path
        d="M12 4h12l8 8v22a2 2 0 0 1-2 2H12a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M24 4v8h8" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
      <path d="M16 22h8M16 28h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function CompressAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center [perspective:700px]">
      <motion.div
        className="relative h-28 w-24 [transform-style:preserve-3d]"
        animate={{ rotateY: [-12, 8, -12], rotateX: [7, 1, 7], scaleY: [1, 0.72, 1] }}
        transition={{ duration: 2.6, repeat: Infinity, ease: 'easeInOut' }}
      >
        {[0, 1, 2, 3].map((layer) => (
          <div
            key={layer}
            className={`absolute inset-0 rounded-xl border bg-white shadow-card ${layer === 3 ? 'border-brand-300 text-brand-500' : 'border-brand-100 text-brand-300'}`}
            style={{ transform: `translateZ(${-layer * 5}px) translateY(${layer * 4}px)` }}
          >
            {layer === 3 && <DocIcon className="h-full w-full p-2" />}
          </div>
        ))}
      </motion.div>
      <motion.div
        className="absolute bottom-1 flex items-center gap-2 rounded-full border border-brand-100 bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-brand-700 shadow-soft"
        animate={{ y: [0, -3, 0], opacity: [0.72, 1, 0.72] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="grid h-6 w-6 place-items-center rounded-full bg-brand-gradient text-white"><span className="text-base leading-none">↧</span></span>
        Compressing pages
      </motion.div>
    </div>
  );
}

function PhotoCard({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl border border-brand-200 bg-gradient-to-br from-amber-50 via-rose-50 to-sky-100 shadow-soft ${className}`}>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-emerald-100/70 [clip-path:polygon(0_100%,35%_18%,55%_58%,73%_5%,100%_100%)]" />
      <span className="absolute right-2 top-2 h-3 w-3 rounded-full bg-amber-300" />
    </div>
  );
}

function CompressImageAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <motion.div
        className="relative"
        animate={{ scale: [1, 0.82, 0.82, 1], y: [0, 0, 0, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: [0.4, 0, 0.2, 1] }}
      >
        <PhotoCard className="h-24 w-32" />
        <motion.span
          className="absolute -right-2 -top-2 rounded-full bg-brand-600 px-2 py-1 text-[9px] font-bold text-white shadow-soft"
          animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          −42%
        </motion.span>
      </motion.div>
      <div className="absolute bottom-1 flex items-center gap-2">
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-brand-100">
          <motion.div
            className="h-full rounded-full bg-brand-gradient"
            animate={{ width: ['20%', '82%', '82%', '20%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>
        <span className="text-[10px] font-semibold text-navy-500">Smaller file</span>
      </div>
    </div>
  );
}

function ResizeImageAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <motion.div
        className="relative"
        animate={{ scale: [0.72, 1, 1, 0.72] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PhotoCard className="h-24 w-32" />
        {[[0, 0], [1, 0], [0, 1], [1, 1]].map(([right, bottom], index) => (
          <motion.span
            key={index}
            className={`absolute ${right ? '-right-1.5' : '-left-1.5'} ${bottom ? '-bottom-1.5' : '-top-1.5'} h-3 w-3 rounded-sm border-2 border-white bg-brand-600 shadow-sm`}
          />
        ))}
      </motion.div>
      <span className="absolute bottom-1 rounded-full border border-brand-100 bg-white px-3 py-1 text-[10px] font-semibold text-brand-700 shadow-soft">
        Fit to dimensions
      </span>
    </div>
  );
}

function ConvertImageAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-3">
      <motion.div
        className="grid h-20 w-20 place-items-center rounded-xl border border-brand-100 bg-white shadow-soft"
        animate={{ x: [0, 8, 8, 0], rotate: [0, 0, 0, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PhotoCard className="h-11 w-14" />
        <span className="mt-1 text-[9px] font-bold uppercase text-navy-500">JPG</span>
      </motion.div>
      <motion.div
        animate={{ x: [0, -4, -4, 0], opacity: [0.5, 1, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="text-brand-600"
      >
        <ArrowLeftRight className="h-5 w-5" />
      </motion.div>
      <motion.div
        className="grid h-20 w-20 place-items-center rounded-xl border border-brand-100 bg-white shadow-soft"
        animate={{ x: [0, -8, -8, 0], scale: [0.94, 1, 1, 0.94] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PhotoCard className="h-11 w-14" />
        <span className="mt-1 text-[9px] font-bold uppercase text-brand-700">WEBP</span>
      </motion.div>
    </div>
  );
}

function PdfToImageAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-3">
      <motion.div
        className="grid h-24 w-16 place-items-center rounded-lg border border-brand-200 bg-white shadow-soft"
        animate={{ rotateY: [0, -12, -12, 0], x: [0, 4, 4, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <FileText className="h-8 w-8 text-brand-500" />
        <span className="mt-1 text-[9px] font-bold text-navy-500">PDF</span>
      </motion.div>
      <motion.div
        animate={{ x: [0, 5, 5, 0], opacity: [0.5, 1, 1, 0.5] }}
        transition={{ duration: 2.2, repeat: Infinity }}
        className="text-brand-600"
      >
        <ArrowLeftRight className="h-5 w-5" />
      </motion.div>
      <div className="grid grid-cols-2 gap-1">
        {[0, 1, 2, 3].map((item) => (
          <motion.div
            key={item}
            initial={{ opacity: 0.35, scale: 0.8 }}
            animate={{ opacity: [0.45, 1, 1], scale: [0.84, 1, 1] }}
            transition={{ duration: 1.4, delay: item * 0.14, repeat: Infinity, repeatDelay: 0.8 }}
          >
            <PhotoCard className="h-8 w-9" />
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function CropAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <PhotoCard className="h-24 w-32" />
      <motion.div
        className="absolute h-16 w-24 border-2 border-dashed border-brand-600"
        animate={{ width: [112, 82, 82, 112], height: [76, 54, 54, 76] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      />
      <Crop className="absolute bottom-1 right-7 h-5 w-5 text-brand-600" />
    </div>
  );
}

function ExtractTextAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-4">
      <div className="flex h-24 w-16 flex-col gap-2 rounded-lg border border-brand-100 bg-white p-3 shadow-soft">
        {[0, 1, 2, 3].map((item) => <span key={item} className="h-1 w-full rounded bg-navy-100" />)}
      </div>
      <motion.span
        className="absolute left-12 right-12 h-0.5 bg-brand-500 shadow-[0_0_10px_rgba(13,148,136,.7)]"
        animate={{ y: [-32, 32, -32], opacity: [0, 1, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <div className="flex flex-col gap-2">
        {[0, 1, 2].map((item) => (
          <motion.span
            key={item}
            className="h-1.5 rounded bg-brand-200"
            animate={{ width: [24, 54, 54], opacity: [0.4, 1, 1] }}
            transition={{ duration: 1.8, delay: item * 0.16, repeat: Infinity, repeatDelay: 0.4 }}
          />
        ))}
      </div>
    </div>
  );
}

function CompareAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-3">
      {[0, 1].map((item) => (
        <div key={item} className="flex h-24 w-16 flex-col gap-2 rounded-lg border border-brand-100 bg-white p-3 shadow-soft">
          <GitCompare className={`h-4 w-4 ${item ? 'text-accent-500' : 'text-brand-600'}`} />
          {[0, 1, 2].map((line) => (
            <motion.span
              key={line}
              className={`h-1 rounded ${line === 1 && item ? 'bg-amber-300' : 'bg-navy-100'}`}
              animate={line === 1 ? { opacity: [0.4, 1, 0.4] } : undefined}
              transition={{ duration: 1.5, repeat: Infinity, delay: item * 0.2 }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function ArchiveAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-2">
      {[0, 1, 2].map((item) => (
        <motion.div
          key={item}
          className="grid h-16 w-12 place-items-center rounded-lg border border-brand-100 bg-white text-brand-500 shadow-soft"
          animate={{ y: [0, -8, 0], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 1.6, delay: item * 0.18, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ImageIcon className="h-5 w-5" />
        </motion.div>
      ))}
      <div className="absolute bottom-1 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold text-brand-700">Packing files</div>
    </div>
  );
}

function PageScanAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <div className="flex h-24 w-20 flex-col gap-2 rounded-lg border border-brand-100 bg-white p-3 shadow-soft">
        <FileText className="h-5 w-5 text-brand-500" />
        {[0, 1, 2].map((item) => <span key={item} className="h-1 w-full rounded bg-navy-100" />)}
      </div>
      <motion.span
        className="absolute h-24 w-20 rounded-lg border-2 border-brand-400"
        animate={{ scale: [0.92, 1.08, 0.92], opacity: [0.35, 1, 0.35] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

function TextStampAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <div className="flex h-24 w-20 flex-col gap-2 rounded-lg border border-brand-100 bg-white p-3 shadow-soft">
        {[0, 1, 2].map((item) => <span key={item} className="h-1 w-full rounded bg-navy-100" />)}
      </div>
      <motion.span
        className="absolute rounded-md border border-brand-300 bg-brand-50 px-2 py-1 text-[10px] font-bold text-brand-700"
        animate={{ x: [18, 0, 0, 18], y: [14, 14, 0, 14], opacity: [0, 1, 1, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        YOUR TEXT
      </motion.span>
    </div>
  );
}

function PrivacyAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <FileText className="h-20 w-16 text-brand-300" strokeWidth={1.4} />
      <motion.div
        className="absolute flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 text-emerald-700"
        animate={{ scale: [0.8, 1, 1, 0.8], y: [0, -5, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <ShieldCheck className="h-5 w-5" />
      </motion.div>
    </div>
  );
}

function OptimizeAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      {[0, 1, 2].map((item) => (
        <motion.div
          key={item}
          className="absolute h-20 w-16 rounded-lg border border-brand-200 bg-white shadow-soft"
          animate={{ y: [12 - item * 3, -12 + item * 3, 12 - item * 3], opacity: [0.4, 1, 0.4], scale: [0.92, 1, 0.92] }}
          transition={{ duration: 1.8, delay: item * 0.12, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
      <span className="absolute bottom-1 rounded-full bg-brand-50 px-3 py-1 text-[10px] font-semibold text-brand-700">Optimizing pages</span>
    </div>
  );
}

function FlattenAnim() {
  return (
    <div className="relative grid h-40 w-56 place-items-center">
      <motion.div
        className="relative h-24 w-20 rounded-lg border border-brand-200 bg-white shadow-soft"
        animate={{ scaleY: [1, 0.78, 1], rotateX: [0, 20, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <Layers className="absolute inset-0 m-auto h-9 w-9 text-brand-500" />
      </motion.div>
    </div>
  );
}

function PageOrderAnim() {
  return (
    <div className="relative flex h-40 w-56 items-center justify-center gap-2">
      {[0, 1, 2].map((item) => (
        <motion.div
          key={item}
          className="grid h-20 w-14 place-items-center rounded-lg border border-brand-100 bg-white text-brand-500 shadow-soft"
          animate={{ x: [0, (1 - item) * 9, (1 - item) * 9, 0], y: [0, item === 1 ? -5 : 0, item === 1 ? -5 : 0, 0] }}
          transition={{ duration: 2.2, delay: item * 0.08, repeat: Infinity, ease: 'easeInOut' }}
        >
          <FileText className="h-6 w-6" />
          <span className="text-[9px] font-bold">{item + 1}</span>
        </motion.div>
      ))}
    </div>
  );
}

function MergeAnim() {
  return (
    <div className="relative h-24 w-48">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute top-0 text-brand-400"
          style={{ left: `${i * 30}px` }}
          animate={{ x: [0, 60 - i * 30, 60 - i * 30, 0], opacity: [0.5, 1, 1, 0.5] }}
          transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.2, ease: 'easeInOut' }}
        >
          <DocIcon className="h-16 w-16" />
        </motion.div>
      ))}
      <motion.div
        className="absolute right-0 top-2 text-navy-700"
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <DocIcon className="h-20 w-20" />
      </motion.div>
    </div>
  );
}

function SplitAnim() {
  return (
    <div className="relative h-24 w-56">
      <motion.div
        className="absolute left-1/2 top-0 -translate-x-1/2 text-brand-400"
        animate={{ x: [0, -40, 40, 0], opacity: [1, 0.3, 0.3, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <DocIcon className="h-20 w-20" />
      </motion.div>
    </div>
  );
}

function RotateAnim() {
  return (
    <motion.div
      className="text-brand-400"
      animate={{ rotate: [0, 90, 180, 270, 360] }}
      transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
    >
      <DocIcon className="h-20 w-20" />
    </motion.div>
  );
}

function ImageToPdfAnim() {
  return (
    <div className="relative h-24 w-56">
      <motion.div
        className="absolute left-0 top-2 h-16 w-16 rounded-lg bg-accent-200"
        animate={{ x: [0, 80, 80, 0], opacity: [1, 0.5, 0.5, 1] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute right-0 top-0 text-navy-700"
        animate={{ opacity: [0, 0, 1, 1, 0] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <DocIcon className="h-20 w-20" />
      </motion.div>
    </div>
  );
}

function NumberAnim() {
  return (
    <div className="relative h-24 w-32">
      <div className="absolute inset-0 text-brand-300">
        <DocIcon className="h-full w-full" />
      </div>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="absolute bottom-2 right-2 text-xs font-bold text-brand-600"
          animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, delay: i * 0.6 }}
        >
          {i + 1}
        </motion.div>
      ))}
    </div>
  );
}

function WatermarkAnim() {
  return (
    <div className="relative h-24 w-32">
      <div className="absolute inset-0 text-brand-300">
        <DocIcon className="h-full w-full" />
      </div>
      <motion.div
        className="absolute inset-0 grid place-items-center"
        animate={{ opacity: [0, 0.3, 0.3, 0], scale: [0.8, 1.2, 1.2, 0.8] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        <span className="text-[10px] font-bold text-brand-600 -rotate-45">WATERMARK</span>
      </motion.div>
    </div>
  );
}

function DefaultAnim() {
  return (
    <div className="flex h-40 items-center gap-2" aria-label="Processing file">
      {[0, 1, 2].map((item) => (
        <motion.span
          key={item}
          className="h-2 w-2 rounded-full bg-brand-500"
          animate={{ y: [0, -7, 0], opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.72, delay: item * 0.12, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}
