import { FileText, X, GripVertical } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { DragEvent } from 'react';

interface FileItem {
  id: string;
  file: File;
  pageCount?: number;
}

interface FileListProps {
  items: FileItem[];
  onRemove: (id: string) => void;
  onReorder?: (from: number, to: number) => void;
  showDragHandle?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileList({ items, onRemove, onReorder, showDragHandle }: FileListProps) {
  const reduceMotion = useReducedMotion();
  if (items.length === 0) return null;

  return (
    <motion.div layout className="space-y-2">
      <AnimatePresence initial={false}>
      {items.map((item, index) => (
        <motion.div
          key={item.id}
          layout={!reduceMotion}
          initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.99 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        >
        <div
          draggable={showDragHandle && !!onReorder}
          onDragStart={(e) => {
            if (showDragHandle && onReorder) {
              e.dataTransfer.setData('text/plain', String(index));
              e.dataTransfer.effectAllowed = 'move';
            }
          }}
          onDragOver={(e) => {
            if (showDragHandle && onReorder) e.preventDefault();
          }}
          onDrop={(e: DragEvent<HTMLDivElement>) => {
            if (!showDragHandle || !onReorder) return;
            e.preventDefault();
            const from = parseInt(e.dataTransfer.getData('text/plain'), 10);
            if (!isNaN(from)) onReorder(from, index);
          }}
          className="group flex items-center gap-3 rounded-xl border border-navy-100 bg-white p-3.5 transition-[border-color,box-shadow,background-color] duration-200 hover:border-brand-200 hover:bg-brand-50/20 hover:shadow-soft"
        >
          {showDragHandle && (
            <GripVertical className="h-5 w-5 text-navy-300 cursor-grab active:cursor-grabbing" />
          )}
          <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-100">
            <FileText className="h-5 w-5 text-brand-600" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-navy-900">{item.file.name}</p>
            <p className="text-xs text-navy-400">
              {formatSize(item.file.size)}
              {item.pageCount ? ` · ${item.pageCount} page${item.pageCount === 1 ? '' : 's'}` : ''}
            </p>
          </div>
          {showDragHandle && (
            <span className="text-xs text-navy-400 hidden sm:inline">#{index + 1}</span>
          )}
          <button
            onClick={() => onRemove(item.id)}
            className="rounded-lg p-1.5 text-navy-400 hover:text-error-600 hover:bg-error-50 transition-colors"
            aria-label={`Remove ${item.file.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        </motion.div>
      ))}
      </AnimatePresence>
    </motion.div>
  );
}
