import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Command, Search, X } from 'lucide-react';
import { categoryLabels, getToolIcon, searchTools } from '@/lib/tools';

export default function ToolLauncher() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(
    () => searchTools(query).filter((tool) => tool.status === 'active').slice(0, 7),
    [query],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
      if (event.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const moveSelection = (direction: -1 | 1) => {
    if (results.length === 0) return;
    setActiveIndex((index) => (index + direction + results.length) % results.length);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group inline-flex items-center gap-2 rounded-xl border border-navy-200/80 bg-white/70 px-3 py-2.5 text-sm font-medium text-navy-600 shadow-sm transition-all hover:border-brand-300 hover:bg-white hover:text-navy-900"
        aria-haspopup="dialog"
        aria-label="Find a PDF tool"
      >
        <Search className="h-4 w-4 text-navy-400 transition-colors group-hover:text-brand-600" />
        <span className="hidden lg:inline">Find a tool</span>
        <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded-md border border-navy-200 bg-navy-50 px-1.5 py-0.5 text-[10px] font-semibold text-navy-400">
          <Command className="h-2.5 w-2.5" /> K
        </kbd>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-[60] flex items-start justify-center bg-navy-950/35 px-4 pt-[12vh] backdrop-blur-sm sm:pt-[15vh]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) setOpen(false);
            }}
          >
            <motion.section
              role="dialog"
              aria-modal="true"
              aria-labelledby="tool-launcher-title"
              initial={{ opacity: 0, y: 14, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.99 }}
              transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
              className="w-full max-w-xl overflow-hidden rounded-3xl border border-white/80 bg-white shadow-[0_32px_100px_-24px_rgba(2,6,23,.45)]"
            >
              <div className="flex items-center gap-3 border-b border-navy-100 px-4 sm:px-5">
                <Search className="h-5 w-5 shrink-0 text-brand-600" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setActiveIndex(0);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === 'ArrowDown') {
                      event.preventDefault();
                      moveSelection(1);
                    } else if (event.key === 'ArrowUp') {
                      event.preventDefault();
                      moveSelection(-1);
                    } else if (event.key === 'Enter' && results[activeIndex]) {
                      navigate(`/${results[activeIndex].slug}`);
                      setOpen(false);
                    }
                  }}
                  placeholder="Search merge, compress, rotate…"
                  className="h-16 min-w-0 flex-1 bg-transparent text-sm text-navy-900 outline-none placeholder:text-navy-400"
                  aria-label="Search file tools"
                  aria-controls="tool-launcher-results"
                  aria-activedescendant={results[activeIndex] ? `tool-result-${results[activeIndex].id}` : undefined}
                  autoComplete="off"
                />
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg p-2 text-navy-400 transition-colors hover:bg-navy-50 hover:text-navy-700"
                  aria-label="Close tool finder"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center justify-between px-5 pb-2 pt-4">
                <h2 id="tool-launcher-title" className="text-[11px] font-bold uppercase tracking-[.16em] text-navy-400">
                  {query ? 'Matching tools' : 'Quick access'}
                </h2>
                <span className="text-[11px] text-navy-400">{results.length} ready</span>
              </div>
              <div id="tool-launcher-results" role="listbox" className="max-h-[min(56vh,420px)] overflow-y-auto px-2 pb-2">
                {results.length > 0 ? results.map((tool, index) => {
                  const Icon = getToolIcon(tool.iconName);
                  return (
                    <Link
                      key={tool.id}
                      id={`tool-result-${tool.id}`}
                      role="option"
                      aria-selected={activeIndex === index}
                      to={`/${tool.slug}`}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => setOpen(false)}
                      className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-colors ${activeIndex === index ? 'bg-brand-50' : 'hover:bg-navy-50'}`}
                    >
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors ${activeIndex === index ? 'bg-brand-gradient text-white shadow-glow' : 'bg-navy-50 text-brand-600 group-hover:bg-white'}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-navy-900">{tool.name}</span>
                        <span className="block truncate text-xs text-navy-500">{tool.description}</span>
                      </span>
                      <span className="hidden items-center gap-1 text-[10px] font-medium text-navy-400 sm:flex">
                        {categoryLabels[tool.category]}
                      </span>
                      <ArrowRight className={`h-4 w-4 shrink-0 transition-all ${activeIndex === index ? 'translate-x-0 text-brand-600 opacity-100' : '-translate-x-1 text-navy-300 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                    </Link>
                  );
                }) : (
                  <div className="px-4 py-12 text-center">
                    <p className="text-sm font-semibold text-navy-700">No matching tools yet</p>
                    <p className="mt-1 text-xs text-navy-400">Try a different search or browse all tools.</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between border-t border-navy-100 bg-navy-50/70 px-4 py-3 text-[10px] text-navy-400 sm:px-5">
                <span>Use ↑ ↓ to choose, Enter to open</span>
                <Link to="/all-tools" onClick={() => setOpen(false)} className="font-semibold text-brand-700 hover:text-brand-800">
                  Browse all tools
                </Link>
              </div>
            </motion.section>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
