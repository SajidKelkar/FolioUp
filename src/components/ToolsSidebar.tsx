import { useState, useMemo, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronRight, ChevronDown, Lock, X, Star, Sparkles } from 'lucide-react';
import {
  tools,
  categoryLabels,
  categoryOrder,
  getToolIcon,
  type Tool,
  type ToolCategory,
} from '@/lib/tools';

interface ToolsSidebarProps {
  open: boolean;
  onClose: () => void;
}

const FAV_KEY = 'folioup-favorites';

export default function ToolsSidebar({ open, onClose }: ToolsSidebarProps) {
  const [query, setQuery] = useState('');
  const [favorites, setFavorites] = useState<string[]>([]);
  const location = useLocation();

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      // ignore
    }
  }, []);

  const toggleFav = (id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id];
      try {
        localStorage.setItem(FAV_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (q === '') return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.shortName.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q),
    );
  }, [query]);

  const grouped = useMemo(() => {
    const map = new Map<ToolCategory, Tool[]>();
    for (const cat of categoryOrder) {
      const items = filtered.filter((t) => t.category === cat);
      if (items.length > 0) map.set(cat, items);
    }
    return map;
  }, [filtered]);

  const favTools = useMemo(
    () => favorites.map((id) => tools.find((t) => t.id === id)).filter(Boolean) as Tool[],
    [favorites],
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-navy-950/40 backdrop-blur-sm lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Mobile slide-in panel (left) */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 38 }}
            className="fixed lg:hidden top-0 left-0 z-50 h-screen w-[300px] shrink-0 border-r border-navy-200 bg-white/90 backdrop-blur-xl flex flex-col"
          >
            <SidebarContent
              query={query}
              setQuery={setQuery}
              grouped={grouped}
              activePath={location.pathname}
              onClose={onClose}
              favorites={favorites}
              favTools={favTools}
              onToggleFav={toggleFav}
            />
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop persistent sidebar (left) */}
      <aside className="hidden lg:flex sticky top-16 h-[calc(100vh-4rem)] w-[300px] shrink-0 border-r border-navy-200 bg-white/70 backdrop-blur-xl flex-col">
        <SidebarContent
          query={query}
          setQuery={setQuery}
          grouped={grouped}
          activePath={location.pathname}
          onClose={onClose}
          favorites={favorites}
          favTools={favTools}
          onToggleFav={toggleFav}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  query: string;
  setQuery: (q: string) => void;
  grouped: Map<ToolCategory, Tool[]>;
  activePath: string;
  onClose: () => void;
  favorites: string[];
  favTools: Tool[];
  onToggleFav: (id: string) => void;
}

function SidebarContent({
  query,
  setQuery,
  grouped,
  activePath,
  onClose,
  favorites,
  favTools,
  onToggleFav,
}: SidebarContentProps) {
  const [collapsed, setCollapsed] = useState<Set<ToolCategory>>(new Set());

  const toggleCat = (cat: ToolCategory) => {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  return (
    <>
      <div className="p-4 border-b border-navy-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-navy-700">All tools</h2>
          <button
            onClick={onClose}
            className="lg:hidden rounded-lg p-1.5 text-navy-400 hover:bg-navy-100 hover:text-navy-700"
            aria-label="Close tools panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-navy-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools…"
            className="w-full rounded-xl border border-navy-200 bg-white py-2.5 pl-9 pr-3 text-sm text-navy-900 focus:border-brand-400 focus:ring-2 focus:ring-brand-100 outline-none transition-all"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4 tools-scroll">
        {/* Favorites section */}
        {query === '' && favTools.length > 0 && (
          <div className="mb-5">
            <p className="px-3 mb-1.5 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-600">
              <Star className="h-3 w-3 fill-current" />
              Favorites
            </p>
            <ul className="space-y-0.5">
              {favTools.map((tool) => (
                <ToolRow
                  key={tool.id}
                  tool={tool}
                  isActive={activePath === `/${tool.slug}`}
                  onClose={onClose}
                  isFav={true}
                  onToggleFav={onToggleFav}
                />
              ))}
            </ul>
          </div>
        )}

        {grouped.size === 0 ? (
          <p className="px-3 py-8 text-center text-sm text-navy-400">
            No tools match "{query}".
          </p>
        ) : (
          Array.from(grouped.entries()).map(([cat, items]) => {
            const isCollapsed = collapsed.has(cat) && query === '';
            return (
              <div key={cat} className="mb-4">
                <button
                  onClick={() => toggleCat(cat)}
                  className="w-full px-3 mb-1.5 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-navy-400 hover:text-navy-600 transition-colors"
                >
                  <span>{categoryLabels[cat]}</span>
                  <span className="flex items-center gap-1.5">
                    <span className="rounded-full bg-navy-100 px-1.5 py-0.5 text-[10px] font-semibold text-navy-500">
                      {items.length}
                    </span>
                    <ChevronDown
                      className={`h-3.5 w-3.5 transition-transform duration-300 ${
                        isCollapsed ? '-rotate-90' : ''
                      }`}
                    />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.ul
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                      className="space-y-0.5 overflow-hidden"
                    >
                      {items.map((tool) => (
                        <ToolRow
                          key={tool.id}
                          tool={tool}
                          isActive={activePath === `/${tool.slug}`}
                          onClose={onClose}
                          isFav={favorites.includes(tool.id)}
                          onToggleFav={onToggleFav}
                        />
                      ))}
                    </motion.ul>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        )}
      </nav>

      <div className="p-4 border-t border-navy-200">
        <div className="rounded-xl bg-brand-gradient-soft p-3 mb-3 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-brand-600 shrink-0 mt-0.5" />
          <p className="text-[11px] text-navy-600 leading-relaxed">
            Tap the star on a tool to pin it to your favorites for quick access.
          </p>
        </div>
        <Link
          to="/"
          className="block rounded-xl bg-navy-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-navy-800 transition-colors"
        >
          Back to home
        </Link>
      </div>
    </>
  );
}

function ToolRow({
  tool,
  isActive,
  onClose,
  isFav,
  onToggleFav,
}: {
  tool: Tool;
  isActive: boolean;
  onClose: () => void;
  isFav: boolean;
  onToggleFav: (id: string) => void;
}) {
  const Icon = getToolIcon(tool.iconName);
  const isPlanned = tool.status === 'planned';
  return (
    <li>
      <Link
        to={isPlanned ? '#' : `/${tool.slug}`}
        onClick={(e) => {
          if (isPlanned) e.preventDefault();
          onClose();
        }}
        className={`group relative flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
          isActive
            ? 'bg-brand-gradient-soft text-brand-700'
            : isPlanned
              ? 'text-navy-400 cursor-not-allowed'
              : 'text-navy-700 hover:bg-navy-50 hover:text-navy-900'
        }`}
      >
        {isActive && (
          <motion.span
            layoutId="sidebar-active"
            className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-1 rounded-r-full bg-brand-gradient"
          />
        )}
        <span
          className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all ${
            isActive
              ? 'bg-brand-gradient text-white'
              : isPlanned
                ? 'bg-navy-100 text-navy-400'
                : 'bg-navy-50 text-brand-600 group-hover:bg-brand-100 group-hover:scale-105'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <span className="flex-1 min-w-0">
          <span className="block truncate text-sm font-semibold">{tool.name}</span>
        </span>
        {isPlanned ? (
          <Lock className="h-3.5 w-3.5 text-navy-300" />
        ) : (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFav(tool.id);
            }}
            className={`shrink-0 rounded-md p-1 transition-all ${
              isFav
                ? 'text-amber-400 opacity-100'
                : 'text-navy-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'
            }`}
            aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`h-3.5 w-3.5 ${isFav ? 'fill-current' : ''}`} />
          </button>
        )}
        {!isPlanned && (
          <ChevronRight
            className={`h-4 w-4 shrink-0 transition-all ${
              isActive
                ? 'text-brand-500 opacity-100'
                : 'text-navy-300 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0'
            }`}
          />
        )}
      </Link>
    </li>
  );
}
