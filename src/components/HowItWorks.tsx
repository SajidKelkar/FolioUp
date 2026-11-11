import { Upload, Settings2, Download } from 'lucide-react';
import { FadeUp } from '@/components/animations/Primitives';

const steps = [
  {
    icon: Upload,
    title: 'Add your files',
    description: 'Select supported files from your device to get started.',
  },
  {
    icon: Settings2,
    title: 'Set your options',
    description: 'Choose pages, quality, or output format to suit the task.',
  },
  {
    icon: Download,
    title: 'Get your result',
    description: 'Download finished files or review details for information tools. No sign-in required.',
  },
];

export default function HowItWorks() {
  return (
    <section id="how" className="relative py-20 sm:py-24">
      <div className="mx-auto max-w-7xl px-5 sm:px-8">
        <FadeUp>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand-700">Simple from start to finish</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              Choose. Set up. Save.
            </h2>
          </div>
        </FadeUp>

        <div className="relative mt-12 grid grid-cols-1 gap-8 md:grid-cols-3 md:gap-6">
          <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-px">
            <div className="absolute inset-0 bg-gradient-to-r from-brand-200 via-accent-200 to-brand-200" />
          </div>

          {steps.map((step, i) => (
            <FadeUp key={step.title} delay={i * 0.15}>
              <div className="relative text-center">
                <div className="group relative inline-flex h-24 w-24 items-center justify-center rounded-2xl border border-navy-100 bg-white/85 shadow-card backdrop-blur transition-transform hover:-translate-y-1">
                  <div className="absolute inset-0 rounded-2xl bg-brand-gradient-soft" />
                  {/* Pulse ring */}
                  <span className="absolute inset-0 rounded-2xl border border-brand-300/50 animate-pulse-ring opacity-0 group-hover:opacity-100" />
                  <step.icon className="relative h-9 w-9 text-brand-600 transition-transform group-hover:scale-110" />
                  <span className="absolute -top-2 -right-2 h-7 w-7 rounded-full bg-brand-gradient text-white text-xs font-bold grid place-items-center shadow-glow">
                    {i + 1}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-navy-900">{step.title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed max-w-xs mx-auto">{step.description}</p>
              </div>
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}
