import {
  ArrowUpRight,
  FileOutput,
  Images,
  Image as ImageCategory,
  LayoutGrid,
  Minimize2,
  PenLine,
  ScanText,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { categoryLabels, categoryOrder, tools, type ToolCategory } from '@/lib/tools';
import { Stagger, StaggerItem } from '@/components/animations/Primitives';

const categoryIcons: Record<ToolCategory, typeof LayoutGrid> = {
  organize: LayoutGrid,
  images: ImageCategory,
  optimize: Minimize2,
  'convert-to': Images,
  'convert-from': FileOutput,
  edit: PenLine,
  security: ShieldCheck,
  ocr: ScanText,
  utilities: Wrench,
};

const categoryAccents: Record<ToolCategory, string> = {
  organize: 'bg-violet-50 text-violet-600 group-hover:bg-violet-100',
  images: 'bg-rose-50 text-rose-700 group-hover:bg-rose-100',
  optimize: 'bg-brand-50 text-brand-700 group-hover:bg-brand-100',
  'convert-to': 'bg-cyan-50 text-cyan-700 group-hover:bg-cyan-100',
  'convert-from': 'bg-sky-50 text-sky-700 group-hover:bg-sky-100',
  edit: 'bg-amber-50 text-amber-700 group-hover:bg-amber-100',
  security: 'bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100',
  ocr: 'bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100',
  utilities: 'bg-rose-50 text-rose-700 group-hover:bg-rose-100',
};

export default function Categories() {
  const availableCategories = categoryOrder.filter((cat) =>
    tools.some((tool) => tool.category === cat && tool.status === 'active'),
  );

  return (
    <section className="relative py-10 sm:py-14" aria-labelledby="category-heading">
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.18em] text-brand-700">A tool for every task</p>
          <h2 id="category-heading" className="mt-1 font-display text-xl font-extrabold tracking-tight text-navy-900 sm:text-2xl">
            Start with a category
          </h2>
          <p className="mt-1 max-w-xl text-sm leading-6 text-navy-500">Go straight to image tools, PDF essentials, and more ways to work with your files.</p>
        </div>
        <Link to="/all-tools" className="group hidden items-center gap-1 text-sm font-semibold text-brand-700 hover:text-brand-800 sm:inline-flex">
          Explore all <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      </div>

      <Stagger className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {availableCategories.map((cat) => {
          const count = tools.filter((tool) => tool.category === cat && tool.status === 'active').length;
          const Icon = categoryIcons[cat];
          return (
            <StaggerItem key={cat} className="h-full">
              <Link
                to={`/all-tools?cat=${cat}`}
                className="group relative block h-full overflow-hidden rounded-2xl border border-navy-100 bg-white/85 p-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card sm:p-5"
              >
                <span className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-brand-gradient opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-20" />
                <div className="relative flex items-start justify-between gap-2">
                  <span className={`grid h-10 w-10 place-items-center rounded-xl transition-colors ${categoryAccents[cat]}`}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <ArrowUpRight className="h-4 w-4 text-navy-300 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-600" />
                </div>
                <h3 className="relative mt-4 text-sm font-bold text-navy-900 sm:text-[15px]">{categoryLabels[cat]}</h3>
                <p className="relative mt-1 text-xs text-navy-500">{count} available {count === 1 ? 'tool' : 'tools'}</p>
              </Link>
            </StaggerItem>
          );
        })}
      </Stagger>
      <Link to="/all-tools" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700 sm:hidden">
        Browse all tools <ArrowUpRight className="h-4 w-4" />
      </Link>
    </section>
  );
}
