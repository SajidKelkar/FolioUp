import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  ArrowLeftRight,
  ArrowRight,
  Crop,
  FileImage,
  FileText,
  Layers,
  Minimize2,
  RotateCw,
  Scissors,
  Scaling,
  Search,
  Shield,
  X,
  Zap,
} from 'lucide-react';
import { getToolIcon, searchTools, tools } from '@/lib/tools';

export default function Hero() {
  const [query, setQuery] = useState('');
  const activeToolCount = tools.filter((tool) => tool.status === 'active').length;
  const quickSearches = ['Merge PDF', 'Compress PDF', 'Compress image'];

  const searchResults = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q === '') return [];
    return searchTools(q).filter((tool) => tool.status === 'active').slice(0, 5);
  }, [query]);

  return (
    <section id="top" className="relative isolate overflow-visible pb-12 pt-8 sm:pb-20 sm:pt-14">
      <div className="relative grid items-center gap-9 lg:grid-cols-[1.03fr_0.97fr] lg:gap-10">
        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-brand-200/80 bg-white/85 px-3.5 py-2 text-xs font-semibold text-brand-800 shadow-soft backdrop-blur"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            {activeToolCount} free tools <span className="text-brand-300">·</span> Files stay on your device
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="mt-6 max-w-2xl font-display text-[clamp(2.2rem,8vw,3.8rem)] font-extrabold leading-[1.02] tracking-[-.045em] text-navy-950 sm:text-6xl lg:text-[4.25rem]"
          >
            Your files.
            <br />
            <span className="font-semibold text-brand-700">Ready for more.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 max-w-lg text-base leading-7 text-navy-600 sm:text-lg sm:leading-8"
          >
            Compress, resize, convert, and organize files in a few clicks. Free tools for your everyday PDFs and images.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24, ease: [0.22, 1, 0.36, 1] }}
            className="relative mt-8 max-w-xl"
          >
            <div aria-hidden="true" className="absolute -inset-1 rounded-[1.4rem] bg-brand-gradient opacity-15 blur-lg" />
            <div className="relative rounded-[1.25rem] border border-navy-200/80 bg-white p-2 shadow-card transition-shadow focus-within:border-brand-300 focus-within:shadow-card-hover">
              <Search className="absolute left-5 top-[1.45rem] h-5 w-5 text-navy-400" aria-hidden="true" />
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search file tools"
                aria-controls="hero-tool-results"
                aria-expanded={query.trim().length > 0}
                placeholder="What do you need to do with your file?"
                className="w-full rounded-[.95rem] bg-navy-50/70 py-4 pl-11 pr-12 text-sm text-navy-900 outline-none transition-colors placeholder:text-navy-400 focus:bg-white focus:ring-2 focus:ring-brand-100"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear tool search"
                  className="absolute right-5 top-[1.25rem] grid h-8 w-8 place-items-center rounded-lg text-navy-400 transition-colors hover:bg-navy-100 hover:text-navy-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <AnimatePresence>
                {query.trim() && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    id="hero-tool-results"
                    role="list"
                    aria-label="Matching tools"
                    className="absolute left-0 right-0 top-full z-20 mt-2 overflow-hidden rounded-2xl border border-navy-100 bg-white shadow-card"
                  >
                    {searchResults.map((tool) => {
                      const Icon = getToolIcon(tool.iconName);
                      return (
                        <Link
                          key={tool.id}
                          to={`/${tool.slug}`}
                          role="listitem"
                          className="flex items-center gap-3 border-b border-navy-50 px-4 py-3 transition-colors last:border-b-0 hover:bg-brand-50/60"
                          onClick={() => setQuery('')}
                        >
                          <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-brand-gradient-soft">
                            <Icon className="h-4 w-4 text-brand-600" />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-sm font-semibold text-navy-900">{tool.name}</p>
                            <p className="truncate text-xs text-navy-500">{tool.description}</p>
                          </div>
                          <ArrowRight className="h-4 w-4 text-navy-300 transition-transform group-hover:translate-x-0.5" />
                        </Link>
                      );
                    })}
                    {searchResults.length === 0 && (
                      <p role="status" className="px-4 py-5 text-sm text-navy-500">
                        No available tools match “{query}”. Try a different search or browse all tools.
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
              {!query && (
                <div className="flex flex-wrap items-center gap-2 px-2 pb-2 pt-3">
                  <span className="mr-1 text-[11px] font-medium text-navy-400">Try</span>
                  {quickSearches.map((search) => (
                    <button
                      key={search}
                      type="button"
                      onClick={() => setQuery(search)}
                      className="rounded-full border border-navy-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-navy-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {search}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center"
          >
            <Link
              to="/all-tools"
              className="group inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-brand-gradient px-6 py-3.5 text-sm font-semibold text-white shadow-glow transition-all hover:-translate-y-0.5 hover:shadow-lg"
            >
              Explore all tools
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <a
              href="#how"
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-navy-200 bg-white/80 px-6 py-3.5 text-sm font-semibold text-navy-700 transition-all hover:border-brand-200 hover:bg-white"
            >
              How it works
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-navy-200/70 pt-5 text-xs text-navy-500"
          >
            <span className="inline-flex items-center gap-1.5">
              <Shield className="h-4 w-4 text-success-500" />
              Files stay on your device
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Zap className="h-4 w-4 text-warning-500" />
              No account needed
            </span>
            <span className="inline-flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-accent-500" />
              {activeToolCount} tools ready to use
            </span>
          </motion.div>
        </div>

        <OrbitingTools />
      </div>
    </section>
  );
}

const orbitalTools = [
  { label: 'Merge PDF', slug: 'merge-pdf', icon: Layers, tone: 'text-rose-600', x: 50, y: 0 },
  { label: 'Compress image', slug: 'compress-image', icon: Minimize2, tone: 'text-brand-700', x: 85, y: 15 },
  { label: 'Resize image', slug: 'resize-image', icon: Scaling, tone: 'text-sky-700', x: 100, y: 50 },
  { label: 'Convert image', slug: 'convert-image', icon: ArrowLeftRight, tone: 'text-violet-700', x: 85, y: 85 },
  { label: 'Split PDF', slug: 'split-pdf', icon: Scissors, tone: 'text-orange-600', x: 50, y: 100 },
  { label: 'Rotate PDF', slug: 'rotate-pdf', icon: RotateCw, tone: 'text-blue-700', x: 15, y: 85 },
  { label: 'Crop PDF', slug: 'crop-pdf', icon: Crop, tone: 'text-indigo-700', x: 0, y: 50 },
  { label: 'Images to PDF', slug: 'images-to-pdf', icon: FileImage, tone: 'text-emerald-700', x: 15, y: 15 },
] as const;

function OrbitingTools() {
  const reduceMotion = useReducedMotion();
  const orbitTransition = { duration: 54, ease: 'linear' as const, repeat: Infinity };
  const spinSettings = useMemo(
    () =>
      orbitalTools.map(() => ({
        duration: 7 + Math.random() * 12,
        direction: Math.random() < 0.5 ? -1 : 1,
        delay: -Math.random() * 12,
      })),
    [],
  );

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: reduceMotion ? 0 : 0.7, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      className="relative mx-auto w-full max-w-[570px]"
    >
      <div className="relative grid aspect-[1/0.94] place-items-center">
        <div aria-hidden="true" className="absolute h-[88%] w-[88%] rounded-full border border-brand-300/10" />
        <motion.div
          aria-hidden="true"
          animate={reduceMotion ? undefined : { rotate: 360 }}
          transition={reduceMotion ? undefined : orbitTransition}
          className="absolute h-[88%] w-[88%] rounded-full border border-dashed border-brand-400/15"
        >
          <span className="absolute left-[14%] top-[13%] h-2.5 w-2.5 rounded-full border-2 border-white bg-brand-600 shadow-[0_0_16px_rgba(13,148,136,.5)]" />
        </motion.div>

        <div
          role="img"
          aria-label="FolioUp logo drawing itself in a continuous animation"
          className="relative z-[1] grid h-[38%] w-[38%] place-items-center sm:h-[42%] sm:w-[42%]"
        >
          <motion.div
            aria-hidden="true"
            animate={reduceMotion ? undefined : { scale: [0.82, 1.08, 0.82], opacity: [0.08, 0.25, 0.08] }}
            transition={reduceMotion ? undefined : { duration: 4.4, ease: 'easeInOut', repeat: Infinity }}
            className="absolute inset-[2%] rounded-full bg-[radial-gradient(circle,rgba(45,212,191,.34),rgba(6,182,212,.08)_48%,transparent_72%)] blur-xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-[14%] rounded-full border border-brand-400/15"
          />
          {!reduceMotion && (
            <>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: 360 }}
                transition={{ duration: 9, ease: 'linear', repeat: Infinity }}
                className="pointer-events-none absolute inset-[9%]"
              >
                <span className="absolute left-1/2 top-0 h-2 w-2 -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_14px_rgba(34,211,238,.8)]" />
              </motion.span>
              <motion.span
                aria-hidden="true"
                animate={{ rotate: -360 }}
                transition={{ duration: 13, ease: 'linear', repeat: Infinity }}
                className="pointer-events-none absolute inset-[4%]"
              >
                <span className="absolute bottom-[13%] right-[4%] h-1.5 w-1.5 rounded-full bg-brand-500 shadow-[0_0_12px_rgba(20,184,166,.8)]" />
              </motion.span>
              <motion.span
                aria-hidden="true"
                animate={{ opacity: [0.15, 0.85, 0.15], scale: [0.7, 1.25, 0.7] }}
                transition={{ duration: 2.2, ease: 'easeInOut', repeat: Infinity, delay: 0.6 }}
                className="pointer-events-none absolute right-[15%] top-[20%] h-1.5 w-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,.8)]"
              />
            </>
          )}
          <svg
            viewBox="0 0 64 64"
            fill="none"
            aria-hidden="true"
            className={`relative h-full w-full drop-shadow-[0_14px_22px_rgba(15,118,110,.18)] ${reduceMotion ? '' : 'folio-logo-float'}`}
          >
            <defs>
              <linearGradient id="folioHeroLogoGradient" x1="8" y1="8" x2="56" y2="56">
                <stop stopColor="#0d9488" />
                <stop offset="1" stopColor="#06b6d4" />
              </linearGradient>
              <linearGradient id="folioHeroLogoShine" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
                <stop offset=".48" stopColor="#ffffff" stopOpacity=".9" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M22 14h14l12 12v22a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"
              stroke="url(#folioHeroLogoGradient)"
              strokeWidth="3.5"
              strokeLinejoin="round"
              pathLength="1"
              className={reduceMotion ? '' : 'folio-logo-draw'}
            />
            <path
              d="M36 14v9a3 3 0 0 0 3 3h9"
              stroke="url(#folioHeroLogoGradient)"
              strokeWidth="3.5"
              strokeLinejoin="round"
              pathLength="1"
              className={reduceMotion ? '' : 'folio-logo-draw folio-logo-fold'}
            />
            <path
              d="M25 37h12M25 44h8"
              stroke="url(#folioHeroLogoGradient)"
              strokeWidth="3"
              strokeLinecap="round"
              pathLength="1"
              className={reduceMotion ? '' : 'folio-logo-draw folio-logo-lines'}
            />
            <circle cx="44" cy="44" r="9" fill="#0f172a" />
            <path
              d="M40.5 44.5l2.5 2.5 4.5-5"
              stroke="url(#folioHeroLogoGradient)"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="1"
              className={reduceMotion ? '' : 'folio-logo-draw folio-logo-check'}
            />
            {!reduceMotion && (
              <motion.path
                d="M22 14h14l12 12v22a3 3 0 0 1-3 3H22a3 3 0 0 1-3-3V17a3 3 0 0 1 3-3z"
                fill="none"
                stroke="url(#folioHeroLogoShine)"
                strokeWidth="2"
                strokeLinecap="round"
                pathLength="1"
                animate={{ strokeDasharray: ['0.02 1', '0.2 1', '0.02 1'], strokeDashoffset: [0, -1, -2] }}
                transition={{ duration: 3.8, ease: 'linear', repeat: Infinity, repeatDelay: 0.4 }}
              />
            )}
          </svg>
        </div>
        <div role="group" aria-label="Popular file tools orbiting FolioUp" className="absolute inset-0 z-[3]">
          <div className="absolute left-1/2 top-1/2 aspect-square w-[88%] -translate-x-1/2 -translate-y-1/2">
            <motion.div
              animate={reduceMotion ? undefined : { rotate: 360 }}
              transition={reduceMotion ? undefined : orbitTransition}
              className="absolute inset-0"
            >
              {orbitalTools.map((tool, index) => (
                <div
                  key={tool.slug}
                  className="absolute left-1/2 top-1/2"
                  style={{ left: `${tool.x}%`, top: `${tool.y}%` }}
                >
                  <Link
                    to={`/${tool.slug}`}
                    aria-label={`Open ${tool.label}`}
                    title={tool.label}
                    className="group grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-navy-600 shadow-[0_4px_18px_-8px_rgba(15,23,42,.28)] ring-1 ring-white/80 backdrop-blur-sm transition-[background-color,box-shadow,color,ring-color] hover:bg-white hover:text-brand-700 hover:ring-brand-200 hover:shadow-[0_8px_24px_-8px_rgba(15,23,42,.3)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:h-11 sm:w-11"
                  >
                    <span
                      style={
                        reduceMotion
                          ? undefined
                          : {
                              animation: `folio-tool-spin ${spinSettings[index].duration}s linear ${spinSettings[index].delay}s infinite ${spinSettings[index].direction < 0 ? 'reverse' : 'normal'}`,
                            }
                      }
                      className={tool.tone}
                    >
                      <tool.icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" aria-hidden="true" />
                    </span>
                  </Link>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
      <p className="sr-only">An animated FolioUp logo is surrounded by eight orbiting tool icons. Choose an icon to open that tool. Files are processed in your browser.</p>
    </motion.div>
  );
}
