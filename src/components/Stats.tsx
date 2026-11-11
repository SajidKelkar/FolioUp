import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { ShieldCheck, Zap, FileText, Globe } from 'lucide-react';
import { tools } from '@/lib/tools';

const stats = [
  { icon: FileText, value: tools.filter((tool) => tool.status === 'active').length, suffix: '', label: 'tools ready to use' },
  { icon: ShieldCheck, value: 0, suffix: '', label: 'file processing', special: 'On-device' },
  { icon: Zap, value: 0, suffix: '', label: 'for available tools', special: 'Free' },
  { icon: Globe, value: 0, suffix: '', label: 'needed to get started', special: 'No signup' },
];

function CountUp({ to, suffix = '' }: { to: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion();
  const [val, setVal] = useState(0);

  useEffect(() => {
    if (!inView || reduce) {
      setVal(to);
      return;
    }
    let raf = 0;
    let lastUpdate = 0;
    const start = performance.now();
    const duration = 1400;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const nextValue = Math.round(eased * to);
      if (now - lastUpdate >= 50 || t === 1) {
        setVal(nextValue);
        lastUpdate = now;
      }
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView, to, reduce]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

export default function Stats() {
  return (
    <section className="relative py-6 sm:py-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: [0.22, 1, 0.36, 1] }}
            className="group relative overflow-hidden rounded-2xl border border-navy-100/80 bg-white/70 p-4 shadow-[0_6px_24px_-20px_rgba(15,23,42,.35)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-card sm:p-5"
          >
            <div className="relative flex items-center gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-gradient-soft text-brand-700 transition-transform group-hover:scale-105">
                <s.icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className={`font-display font-extrabold leading-tight text-navy-900 ${s.special ? 'text-base sm:text-lg' : 'text-2xl sm:text-3xl'}`}>
                  {s.special ?? <CountUp to={s.value} suffix={s.suffix} />}
                </p>
                <p className="mt-1 text-xs text-navy-500 truncate">{s.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
