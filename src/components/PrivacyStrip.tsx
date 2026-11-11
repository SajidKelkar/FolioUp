import { ShieldCheck, HardDrive, EyeOff } from 'lucide-react';
import { FadeUp, Stagger, StaggerItem } from '@/components/animations/Primitives';

const items = [
  {
    icon: HardDrive,
    title: 'Processed on your device',
    body: 'Available tools work in your browser. Your files are not uploaded to FolioUp.',
  },
  {
    icon: EyeOff,
    title: 'No account or upload queue',
    body: 'Open a tool and select a file from your device—there is no sign-in or upload step.',
  },
  {
    icon: ShieldCheck,
    title: 'You stay in control',
    body: 'Choose what to process and download. Your original files remain on your device.',
  },
];

export default function PrivacyStrip() {
  return (
    <section id="privacy" className="relative overflow-hidden py-16 sm:py-20">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_100%_50%,rgba(45,212,191,.08),transparent_48%)]" />
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <FadeUp>
          <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand-700">Private by default</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-extrabold tracking-tight text-navy-900">
            Your files stay on your device
          </h2>
        </FadeUp>
        <Stagger className="relative mt-8 grid gap-4 sm:grid-cols-3">
          {items.map((item) => (
            <StaggerItem key={item.title}>
              <div className="h-full rounded-2xl border border-navy-100/80 bg-white/75 p-5 shadow-[0_8px_28px_-24px_rgba(15,23,42,.35)] transition-[transform,border-color,box-shadow] duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-card">
                <item.icon className="h-5 w-5 text-brand-700" />
                <h3 className="mt-3 font-semibold text-navy-900">{item.title}</h3>
                <p className="mt-2 text-sm text-navy-500 leading-relaxed">{item.body}</p>
              </div>
            </StaggerItem>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
