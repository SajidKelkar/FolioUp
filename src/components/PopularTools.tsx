import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Flame } from 'lucide-react';
import { tools, getToolIcon } from '@/lib/tools';
import { Badge } from '@/components/ui/Button';

const popularSlugs = ['compress-image', 'resize-image', 'convert-image', 'merge-pdf', 'compress-pdf', 'images-to-pdf'];

export default function PopularTools() {
  const popular = popularSlugs
    .map((slug) => tools.find((t) => t.slug === slug))
    .filter(Boolean)
    .filter((t) => t!.status === 'active') as typeof tools;

  return (
    <section className="relative py-10 sm:py-12">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-warning-100 text-warning-600">
            <Flame className="h-4 w-4" />
          </span>
          <div>
            <h2 className="font-display text-xl font-extrabold tracking-tight text-navy-900">
              Quick picks
            </h2>
            <p className="text-xs text-navy-500">Handy tools for everyday image and PDF tasks</p>
          </div>
        </div>
        <Link
          to="/all-tools"
          className="group hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-brand-600 hover:text-brand-700"
        >
          Browse all
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {popular.map((tool, i) => {
          const Icon = getToolIcon(tool.iconName);
          return (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            >
              <Link
                to={`/${tool.slug}`}
                className="group relative flex h-full min-h-[168px] flex-col overflow-hidden rounded-2xl border border-navy-100 bg-white/75 p-5 shadow-[0_6px_24px_-20px_rgba(15,23,42,.35)] backdrop-blur transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-300 hover:bg-white hover:shadow-card-hover motion-reduce:transform-none sm:min-h-[176px]"
              >
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(120%_80%_at_50%_0%,rgba(13,148,136,0.10),transparent_70%)]" />
                <span className="absolute top-0 left-0 h-[2px] w-0 bg-brand-gradient transition-all duration-500 group-hover:w-full" />
                <div className="relative flex items-start justify-between">
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient-soft transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
                    <Icon className="h-5 w-5 text-brand-600" />
                  </span>
                  {tool.badge && <Badge color="brand">{tool.badge}</Badge>}
                </div>
                <h3 className="relative mt-3 text-sm font-semibold text-navy-900">{tool.name}</h3>
                <p className="relative mt-1 flex-1 text-xs leading-relaxed text-navy-500 line-clamp-2">{tool.description}</p>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
