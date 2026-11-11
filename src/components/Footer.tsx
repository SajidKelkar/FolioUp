import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { brand } from '@/lib/brand';
import { tools, categoryLabels, categoryOrder } from '@/lib/tools';
import Logo from '@/components/Logo';

export default function Footer() {
  const activeTools = tools.filter((tool) => tool.status === 'active');
  const reduceMotion = useReducedMotion();

  return (
    <motion.footer
      initial={reduceMotion ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="border-t border-brand-100 bg-gradient-to-b from-white via-brand-50/60 to-cyan-50/70 text-navy-700"
    >
      <div className="mx-auto max-w-[1500px] px-5 sm:px-8">
        <div className="grid grid-cols-1 gap-10 py-12 sm:py-14 lg:grid-cols-5">
          <div className="lg:col-span-1">
            <Link to="/" className="inline-flex items-center gap-2.5">
              <Logo
                markClassName="h-9 w-9"
                textClassName="text-xl font-display font-extrabold text-navy-900"
              />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-navy-500">
              {brand.tagline}
            </p>
            <Link
              to="/all-tools"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl border border-brand-200 bg-white px-4 py-2.5 text-sm font-semibold text-brand-800 shadow-sm transition-colors hover:border-brand-300 hover:bg-brand-50"
            >
              Start using FolioUp
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {categoryOrder.slice(0, 4).map((category) => {
            const categoryTools = activeTools.filter((tool) => tool.category === category);
            if (categoryTools.length === 0) return null;

            return (
              <nav key={category} aria-label={categoryLabels[category]}>
                <h2 className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                  {categoryLabels[category]}
                </h2>
                <ul className="mt-3 space-y-2">
                  {categoryTools.map((tool) => (
                    <li key={tool.id}>
                      <Link
                        to={`/${tool.slug}`}
                        className="text-sm text-navy-600 transition-colors hover:text-brand-700"
                      >
                        {tool.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            );
          })}
        </div>

        <div className="flex flex-col items-center justify-between gap-3 border-t border-brand-100 py-6 sm:flex-row">
          <p className="text-xs text-navy-500">
            © {new Date().getFullYear()} {brand.name}. All rights reserved.
          </p>
          <nav aria-label="Legal and contact links" className="flex items-center gap-5 text-xs text-navy-500">
            <Link to="/privacy" className="transition-colors hover:text-brand-700">Privacy</Link>
            <Link to="/terms" className="transition-colors hover:text-brand-700">Terms</Link>
            <Link to="/security" className="transition-colors hover:text-brand-700">Security</Link>
            <Link to="/contact" className="transition-colors hover:text-brand-700">Contact</Link>
          </nav>
        </div>
      </div>
    </motion.footer>
  );
}
