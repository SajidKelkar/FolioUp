import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Heart, Menu, X } from 'lucide-react';
import Logo from '@/components/Logo';

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [liked, setLiked] = useState(false);
  const location = useLocation();
  const reduceMotion = useReducedMotion();
  const onToolsPage = location.pathname !== '/' && !['/privacy', '/terms', '/security', '/contact'].includes(location.pathname);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!mobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false);
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [mobileOpen]);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 border-b transition-[background-color,border-color,box-shadow] duration-200 ${
        scrolled
          ? 'border-navy-100/90 bg-white/95 shadow-[0_6px_24px_-18px_rgba(15,23,42,.35)] backdrop-blur-xl'
          : 'border-navy-100/60 bg-white/80 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link
            to="/"
            aria-label="FolioUp home"
            className="flex items-center rounded-xl transition-transform hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-4"
          >
            <Logo />
          </Link>

          <nav aria-label="Main navigation" className="hidden items-center gap-1 rounded-2xl border border-navy-100/70 bg-white/75 p-1 shadow-[0_2px_10px_-7px_rgba(15,23,42,.3)] md:flex">
            <Link
              to="/all-tools"
              aria-current={onToolsPage ? 'page' : undefined}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 ${onToolsPage ? 'bg-brand-50 text-brand-800 shadow-sm' : 'text-navy-600 hover:bg-navy-50 hover:text-brand-800'}`}
            >
              Tools
            </Link>
            <a
              href="/#features"
              className="rounded-xl px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Why FolioUp
            </a>
            <a
              href="/#how"
              className="rounded-xl px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              How it works
            </a>
            <a
              href="/#faq"
              className="rounded-xl px-4 py-2 text-sm font-medium text-navy-600 transition-colors hover:bg-navy-50 hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              FAQ
            </a>
          </nav>

          <div className="hidden items-center md:flex">
            <button
              type="button"
              onClick={() => setLiked((current) => !current)}
              aria-pressed={liked}
              aria-label={liked ? 'You like FolioUp. 1,000+ likes' : 'Like FolioUp. 1,000+ likes'}
              title="1,000+ likes"
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
                liked
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-navy-100 bg-white/80 text-navy-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>1,000+ likes</span>
            </button>
          </div>
          <div className="flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setLiked((current) => !current)}
              aria-pressed={liked}
              aria-label={liked ? 'You like FolioUp. 1,000+ likes' : 'Like FolioUp. 1,000+ likes'}
              title="1,000+ likes"
              className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-2.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 ${
                liked
                  ? 'border-rose-200 bg-rose-50 text-rose-700'
                  : 'border-navy-200/80 bg-white/80 text-navy-600 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700'
              }`}
            >
              <Heart className={`h-4 w-4 ${liked ? 'fill-current' : ''}`} aria-hidden="true" />
              <span>1,000+</span>
            </button>
            <button
              type="button"
              className="rounded-xl border border-navy-200/80 bg-white/80 p-2.5 text-navy-700 shadow-sm transition-[background-color,border-color,color,box-shadow] hover:border-brand-300 hover:bg-brand-50/60 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-navigation"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
      {mobileOpen && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          id="mobile-navigation"
          className="border-t border-navy-100/80 bg-white/95 shadow-[0_16px_30px_-24px_rgba(15,23,42,.4)] backdrop-blur-xl md:hidden"
        >
          <nav aria-label="Mobile navigation" className="mx-auto max-w-6xl space-y-1 px-5 py-4 sm:px-8">
            <Link
              to="/all-tools"
              aria-current={onToolsPage ? 'page' : undefined}
              className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${onToolsPage ? 'bg-brand-50 text-brand-800' : 'text-navy-700 hover:bg-navy-50'}`}
            >
              Tools
            </Link>
            <a href="/#features" className="block rounded-xl px-4 py-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50">
              Why FolioUp
            </a>
            <a href="/#how" className="block rounded-xl px-4 py-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50">
              How it works
            </a>
            <a href="/#faq" className="block rounded-xl px-4 py-3 text-sm font-medium text-navy-700 transition-colors hover:bg-navy-50">
              FAQ
            </a>
          </nav>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  );
}
