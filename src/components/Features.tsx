import { motion } from 'framer-motion';
import { Gauge, Shield, Sparkles, Heart, Globe, Layers } from 'lucide-react';
import { FadeUp, Stagger, StaggerItem } from '@/components/animations/Primitives';

const features = [
  {
    icon: Gauge,
    title: 'Work at your own pace',
    description: 'Available tools run on your device, so there is no file upload queue to wait through.',
    color: 'text-warning-600',
    bg: 'bg-warning-50',
    ring: 'group-hover:ring-warning-200',
  },
  {
    icon: Shield,
    title: 'Your files stay yours',
    description: 'Your selected files are processed in your browser and are not sent to FolioUp.',
    color: 'text-success-600',
    bg: 'bg-success-50',
    ring: 'group-hover:ring-success-200',
  },
  {
    icon: Sparkles,
    title: 'Clear, focused controls',
    description: 'Choose a task, set the options you need, and save the result without extra steps.',
    color: 'text-brand-600',
    bg: 'bg-brand-50',
    ring: 'group-hover:ring-brand-200',
  },
  {
    icon: Layers,
    title: 'PDF and image essentials',
    description: 'Compress, resize, convert, and organize common files from one toolbox.',
    color: 'text-accent-600',
    bg: 'bg-accent-50',
    ring: 'group-hover:ring-accent-200',
  },
  {
    icon: Globe,
    title: 'Ready in your browser',
    description: 'Use FolioUp on a phone, tablet, or computer. There is nothing to install.',
    color: 'text-navy-600',
    bg: 'bg-navy-50',
    ring: 'group-hover:ring-navy-200',
  },
  {
    icon: Heart,
    title: 'No account needed',
    description: 'Open a tool and get started—no registration, email, or workspace required.',
    color: 'text-error-600',
    bg: 'bg-error-50',
    ring: 'group-hover:ring-error-200',
  },
];

export default function Features() {
  return (
    <section id="features" className="relative overflow-hidden border-y border-navy-100/80 bg-white/45 py-20 sm:py-24">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(45,212,191,.08),transparent_52%)]" />
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand-700">A better way to handle files</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              The everyday file toolkit
            </h2>
            <p className="mt-4 leading-7 text-navy-600">
              Useful tools, clear steps, and local processing—so small file jobs stay simple.
            </p>
          </div>
        </FadeUp>

        <Stagger className="relative mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 sm:gap-5">
          {features.map((f) => (
            <StaggerItem key={f.title}>
              <div className="group h-full rounded-2xl border border-navy-100/80 bg-white/80 p-6 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl ${f.bg} ${f.color} ring-2 ring-transparent ${f.ring} transition-all duration-300 group-hover:scale-110 group-hover:-rotate-3`}>
                  <motion.span
                    whileHover={{ scale: 1.15 }}
                    className="block"
                  >
                    <f.icon className="h-5 w-5" />
                  </motion.span>
                </div>
                <h3 className="mt-4 text-lg font-semibold text-navy-900">{f.title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed">{f.description}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
