import { useCallback, useState, useRef, type DragEvent } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { UploadCloud, FileWarning } from 'lucide-react';

interface DropZoneProps {
  onFiles: (files: File[]) => void;
  accept: string[];
  acceptLabel: string;
  multiple: boolean;
  maxSizeMB: number;
  compact?: boolean;
}

export default function DropZone({
  onFiles,
  accept,
  acceptLabel,
  multiple,
  maxSizeMB,
  compact = false,
}: DropZoneProps) {
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  const validateAndAdd = useCallback(
    (fileList: FileList | null) => {
      if (!fileList || fileList.length === 0) return;
      setError(null);
      const incoming = Array.from(fileList);
      const valid: File[] = [];
      const maxBytes = maxSizeMB * 1024 * 1024;

      for (const file of incoming) {
        const name = file.name.toLowerCase();
        const isAccepted = accept.some((type) => {
          if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1));
          if (type === 'application/pdf') return file.type === type || name.endsWith('.pdf');
          if (type === 'image/jpeg') return file.type === type || name.endsWith('.jpg') || name.endsWith('.jpeg');
          if (type === 'image/png') return file.type === type || name.endsWith('.png');
          if (type === 'image/webp') return file.type === type || name.endsWith('.webp');
          if (type === 'text/plain') return file.type === type || name.endsWith('.txt');
          return file.type === type;
        });

        if (!isAccepted) {
          setError(`"${file.name}" is not a supported file type.`);
          continue;
        }
        if (file.size > maxBytes) {
          setError(`"${file.name}" exceeds the ${maxSizeMB} MB limit.`);
          continue;
        }
        valid.push(file);
      }
      if (valid.length > 0) onFiles(multiple ? valid : [valid[0]]);
    },
    [accept, multiple, maxSizeMB, onFiles],
  );

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragging(false);
    validateAndAdd(e.dataTransfer.files);
  };

  return (
    <div>
      <motion.div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={(event) => {
          if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) return;
          setDragging(false);
        }}
        onDrop={onDrop}
        whileHover={reduceMotion ? undefined : { y: -2, scale: 1.005 }}
        whileTap={reduceMotion ? undefined : { scale: 0.995 }}
        className={`group relative grid cursor-pointer place-items-center overflow-hidden rounded-[1.75rem] border-2 border-dashed shadow-soft transition-all duration-300 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-200 ${
          compact ? 'min-h-[112px] p-4 sm:min-h-[112px]' : 'min-h-[280px] p-7 sm:min-h-[330px] sm:p-10'
        } ${
          dragging
            ? 'border-brand-500 bg-brand-50 shadow-glow'
            : 'border-brand-200 bg-gradient-to-br from-white via-brand-50/50 to-cyan-50/60 hover:border-brand-400 hover:shadow-card'
        }`}
      >
        {!compact && <div className="pointer-events-none absolute inset-3 rounded-[1.25rem] border border-dashed border-brand-100/80" />}
        {!compact && <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-brand-200/30 blur-3xl transition-opacity duration-500 group-hover:opacity-100" />}
        <input
          ref={inputRef}
          type="file"
          accept={accept.join(',')}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
          const input = e.currentTarget;
          validateAndAdd(input.files);
          input.value = '';
        }}
        />
        <div className={`relative z-10 max-w-sm text-center ${compact ? 'flex items-center gap-3 sm:gap-4' : ''}`}>
          <motion.div
            animate={reduceMotion || !dragging ? undefined : { y: -4, scale: 1.08, rotate: -4 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className={`inline-flex shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
              compact ? 'h-10 w-10' : 'mx-auto h-14 w-14 sm:h-16 sm:w-16'
            } ${
              dragging ? 'bg-brand-gradient text-white shadow-glow' : 'border border-brand-100 bg-white text-brand-600 shadow-card'
            }`}
          >
            <UploadCloud className={compact ? 'h-5 w-5' : 'h-7 w-7 sm:h-8 sm:w-8'} />
          </motion.div>
          <div>
            <p className={`${compact ? '' : 'mt-4'} text-base font-bold tracking-tight text-navy-900 sm:text-lg`}>
              {dragging ? 'Drop your files here' : compact ? 'Add another file' : 'Drag and drop your files'}
            </p>
            <p className="mt-1 text-sm text-navy-500">
              or <span className="font-semibold text-brand-700 underline decoration-brand-300 underline-offset-4">{acceptLabel.toLowerCase()}</span>
              {!compact && <span className="ml-2 text-xs text-navy-400">{multiple ? `Up to ${maxSizeMB} MB per file` : `Max ${maxSizeMB} MB`}</span>}
            </p>
            {!compact && (
              <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-[11px] font-medium text-navy-500">
                {multiple ? 'Multiple files allowed' : 'Single file'}
              </p>
            )}
          </div>
        </div>
      </motion.div>

      {error && (
        <div role="alert" className="mt-3 flex items-center gap-2 rounded-lg bg-error-50 border border-error-200 px-4 py-2.5 text-sm text-error-700">
          <FileWarning className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
    </div>
  );
}
