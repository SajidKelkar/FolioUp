import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { FadeUp } from '@/components/animations/Primitives';

const faqs = [
  {
    q: 'Do I need to create an account?',
    a: 'No account is needed. Choose a tool, select a file from your device, then download your result.',
  },
  {
    q: 'Are my files safe?',
    a: 'Available tools process files in your browser; files are not uploaded to FolioUp. Each tool page shows its supported formats and limits.',
  },
  {
    q: 'How much does it cost?',
    a: 'The available tools are free to use. No account or payment details are required.',
  },
  {
    q: 'What file types are supported?',
    a: 'PDF, JPEG, PNG, and WebP are supported across different tools. The exact accepted formats are listed on each tool page.',
  },
  {
    q: 'Is there a file size limit?',
    a: 'Limits vary by tool and are shown beside its file picker. For larger files, processing time depends on your device and browser.',
  },
  {
    q: 'Do tools work on mobile?',
    a: 'Yes. FolioUp works in modern mobile and desktop browsers. Some large files may process more smoothly on a computer.',
  },
  {
    q: 'Why are some tools marked "coming soon"?',
    a: 'A tool is marked as coming soon when its complete workflow is not ready yet. Available tools can be opened and used now.',
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="border-y border-navy-100/70 bg-white/45 py-20 sm:py-24">
      <div className="mx-auto max-w-3xl px-5 sm:px-8">
        <FadeUp>
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-[.16em] text-brand-700">Good to know</p>
            <h2 className="mt-3 font-display text-3xl font-extrabold tracking-tight text-navy-900 sm:text-4xl">
              Common questions
            </h2>
          </div>
        </FadeUp>

        <div className="space-y-3">
          {faqs.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={faq.q}
                className={`overflow-hidden rounded-2xl border bg-white/80 backdrop-blur transition-[border-color,box-shadow] ${
                  isOpen ? 'border-brand-200 shadow-soft' : 'border-navy-100'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-500"
                >
                  <span className={`text-sm font-semibold transition-colors ${isOpen ? 'text-brand-700' : 'text-navy-900'}`}>
                    {faq.q}
                  </span>
                  <span
                    className={`shrink-0 grid h-7 w-7 place-items-center rounded-full transition-all duration-300 ${
                      isOpen ? 'bg-brand-gradient text-white rotate-180' : 'bg-navy-50 text-navy-400'
                    }`}
                  >
                    <ChevronDown className="h-4 w-4" />
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <p className="px-5 pb-4 text-sm text-navy-600 leading-relaxed">{faq.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
