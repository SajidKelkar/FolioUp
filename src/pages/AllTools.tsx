import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Search, ArrowRight, Lock } from 'lucide-react';
import {
  tools,
  categoryLabels,
  categoryOrder,
  getToolIcon,
  searchTools,
  type ToolCategory,
} from '@/lib/tools';
import { Badge } from '@/components/ui/Button';

export default function AllTools() {
  const [params, setParams] = useSearchParams();
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const initialCat = params.get('cat');
  const [query, setQuery] = useState('');
  const [showPlanned, setShowPlanned] = useState(false);
  const [activeCat, setActiveCat] = useState<ToolCategory | 'all'>(
    initialCat && categoryOrder.includes(initialCat as ToolCategory)
      ? (initialCat as ToolCategory)
      : 'all',
  );

  useEffect(() => {
    const selectedCategory =
      initialCat && categoryOrder.includes(initialCat as ToolCategory)
        ? (initialCat as ToolCategory)
        : 'all';
    setActiveCat(selectedCategory);
    if (
      selectedCategory !== 'all' &&
      !tools.some((tool) => tool.category === selectedCategory && tool.status === 'active')
    ) {
      setShowPlanned(true);
    }
  }, [initialCat]);

  useEffect(() => {
    if (categoryScrollRef.current) categoryScrollRef.current.scrollLeft = 0;
  }, []);

  const visibleCategories = categoryOrder.filter(
    (category) => showPlanned || tools.some((tool) => tool.category === category && tool.status === 'active'),
  );

  const filtered = useMemo(() => {
    return searchTools(query).filter(
      (t) => (showPlanned || t.status === 'active') && (activeCat === 'all' || t.category === activeCat),
    );
  }, [query, activeCat, showPlanned]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, typeof tools>();
    for (const cat of categoryOrder) {
      const items = filtered.filter((t) => t.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-5xl"
    >
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3 sm:mb-7">
        <div>
          <p className="mb-1.5 text-[11px] font-bold uppercase tracking-[.18em] text-brand-700">Your file workspace</p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
            All tools<span className="text-brand-600">.</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-navy-500">
            Find a tool for your documents and images.
          </p>
        </div>
        <div className="rounded-xl border border-brand-100 bg-white/80 px-3.5 py-2 text-xs font-semibold text-navy-600 shadow-sm">
          <span className="text-brand-700">{tools.filter((t) => t.status === 'active').length}</span> ready to use
        </div>
      </header>

      <section className="mb-6 rounded-2xl border border-navy-100 bg-white/75 p-3 shadow-soft backdrop-blur sm:p-4">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-navy-400" />
          <input
            aria-label="Search all file tools"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools by name or task..."
            className="w-full rounded-xl border border-navy-100 bg-navy-50/70 py-3 pl-10 pr-4 text-sm text-navy-900 outline-none transition-all placeholder:text-navy-400 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-50"
          />
        </div>

      <div ref={categoryScrollRef} className="category-scroll mt-3 flex gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
        <button
          type="button"
          aria-pressed={activeCat === 'all'}
          onClick={() => {
            setActiveCat('all');
            setParams((current) => {
              current.delete('cat');
              return current;
            });
          }}
          className={`relative shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
            activeCat === 'all' ? 'text-white' : 'border border-navy-100 bg-white text-navy-600 hover:border-brand-200 hover:text-navy-900'
          }`}
        >
          {activeCat === 'all' && (
            <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
          )}
          <span className="relative">All categories</span>
        </button>
        {visibleCategories.map((cat) => (
          <button
            key={cat}
            type="button"
            aria-pressed={activeCat === cat}
            onClick={() => {
              setActiveCat(cat);
              setParams((current) => {
                current.set('cat', cat);
                return current;
              });
            }}
            className={`relative shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors ${
              activeCat === cat ? 'text-white' : 'border border-navy-100 bg-white text-navy-600 hover:border-brand-200 hover:text-navy-900'
            }`}
          >
            {activeCat === cat && (
              <motion.span layoutId="cat-pill" className="absolute inset-0 rounded-full bg-brand-gradient shadow-glow" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
            )}
            <span className="relative">{categoryLabels[cat]}</span>
          </button>
        ))}
      </div>
      </section>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-navy-500" aria-live="polite">
          <span className="font-semibold text-navy-800">{filtered.length}</span>{' '}
          {showPlanned ? 'tools' : 'available tools'}
        </p>
        <button
          type="button"
          aria-pressed={showPlanned}
          onClick={() => setShowPlanned((value) => !value)}
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition-colors ${showPlanned ? 'border-brand-200 bg-brand-50 text-brand-700' : 'border-navy-200 bg-white/80 text-navy-600 hover:border-brand-200'}`}
        >
          <Lock className="h-3.5 w-3.5" />
          {showPlanned ? 'Hide upcoming tools' : `Show ${tools.filter((t) => t.status === 'planned').length} upcoming tools`}
        </button>
      </div>

      {filtered.length === 0 ? (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border border-dashed border-navy-200 bg-white/60 px-5 py-12 text-center"
        >
          <p className="text-sm font-semibold text-navy-700">No tools found</p>
          <p className="mt-1 text-xs text-navy-500">Try a different search or category.</p>
        </motion.div>
      ) : (
        <motion.div className="space-y-8">
          <AnimatePresence mode="sync" initial={false}>
          {Array.from(grouped.entries()).map(([cat, items]) => (
            <motion.section
              key={cat}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="rounded-2xl border border-navy-100/80 bg-white/45 p-3.5 sm:p-5"
            >
              <div className="mb-3.5 flex items-center justify-between gap-3">
                <h2 className="text-xs font-bold uppercase tracking-[.12em] text-navy-700 sm:text-sm">
                  {categoryLabels[cat]}
                </h2>
                <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-semibold text-navy-400">
                  {items.length}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <AnimatePresence mode="sync" initial={false}>
                {items.map((tool, index) => {
                  const Icon = getToolIcon(tool.iconName);
                  const isPlanned = tool.status === 'planned';
                  return (
                    <motion.div
                      key={tool.id}
                      layout={!reduceMotion}
                      initial={reduceMotion ? false : { opacity: 0, y: 8, scale: 0.99 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={reduceMotion ? undefined : { opacity: 0, y: -4, scale: 0.99 }}
                      transition={{ duration: 0.24, delay: reduceMotion ? 0 : Math.min(index * 0.015, 0.12), ease: [0.22, 1, 0.36, 1] }}
                      className="min-w-0"
                    >
                      <Link
                        to={`/${tool.slug}`}
                        className={`group relative flex h-full min-h-[150px] flex-col overflow-hidden rounded-xl border bg-white p-4 transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 sm:min-h-[160px] ${
                          isPlanned
                            ? 'border-dashed border-navy-200 hover:border-navy-300'
                            : 'border-navy-100 hover:border-brand-200 hover:shadow-card'
                        }`}
                      >
                        <span className="absolute inset-x-0 top-0 h-0.5 origin-left scale-x-0 bg-brand-gradient transition-transform duration-300 group-hover:scale-x-100" />
                        <div className="flex items-center justify-between gap-2">
                          <span className={`inline-flex h-9 w-9 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105 ${
                            isPlanned ? 'bg-navy-100 text-navy-400' : 'bg-brand-gradient-soft text-brand-600'
                          }`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          {tool.badge && <Badge color="brand">{tool.badge}</Badge>}
                          {isPlanned && (
                            <Badge color="neutral">
                              <Lock className="mr-1 h-2.5 w-2.5" />
                              Soon
                            </Badge>
                          )}
                        </div>
                        <h3 className={`mt-3 text-sm font-bold ${isPlanned ? 'text-navy-500' : 'text-navy-900'}`}>
                          {tool.name}
                        </h3>
                        <p className="mt-1 flex-1 text-xs leading-relaxed text-navy-500 line-clamp-2">
                          {tool.description}
                        </p>
                        {!isPlanned && (
                          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-brand-700">
                            Open tool
                            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
}
