import { Check } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ToolConfigOption } from '@/lib/tools';

interface ConfigPanelProps {
  options: ToolConfigOption[];
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export default function ConfigPanel({ options, values, onChange }: ConfigPanelProps) {
  if (options.length === 0) return null;

  return (
    <div className="space-y-4">
      {options.map((option, index) => {
        const isVisible = !option.visibleWhen ||
          option.visibleWhen.values.includes(values[option.visibleWhen.id] ?? '');
        const value = values[option.id] ?? String(option.default);
        const inputId = `tool-option-${option.id}`;

        return (
          <AnimatePresence key={option.id} initial={false}>
          {isVisible && <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, delay: Math.min(index * 0.035, 0.14), ease: [0.22, 1, 0.36, 1] }}
          >
            {option.type === 'select' ? (
              <p id={inputId} className="block text-[13px] font-semibold tracking-wide text-navy-700">
                {option.label}
              </p>
            ) : (
              <label htmlFor={inputId} className="block text-[13px] font-semibold tracking-wide text-navy-700">
                {option.label}
              </label>
            )}
            {option.help && <p className="mt-1 max-w-2xl text-xs leading-relaxed text-navy-500">{option.help}</p>}

            <div className="mt-2">
              {option.type === 'select' && (
                <div role="radiogroup" aria-labelledby={inputId} className="mt-3 space-y-2">
                  {option.options?.map((item) => {
                    const selected = item.value === value;
                    const [title, detail] = item.label.split(' — ', 2);
                    const itemId = `${inputId}-${item.value}`;

                    return (
                      <label key={item.value} htmlFor={itemId} className="block cursor-pointer">
                        <input
                          id={itemId}
                          type="radio"
                          name={inputId}
                          value={item.value}
                          checked={selected}
                          onChange={() => onChange(option.id, item.value)}
                          className="peer sr-only"
                        />
                        <span
                          className={`flex min-h-12 items-center justify-between gap-3 rounded-xl border px-4 py-2.5 transition-[border-color,background-color,box-shadow] duration-200 peer-focus-visible:ring-4 peer-focus-visible:ring-brand-100 ${
                            selected
                              ? 'border-brand-300 bg-brand-50/70 shadow-sm'
                              : 'border-navy-200 bg-white hover:border-brand-200 hover:bg-brand-50/20'
                          }`}
                        >
                          <span className="min-w-0 text-left">
                            <span className={`block text-sm font-semibold ${selected ? 'text-brand-800' : 'text-navy-800'}`}>
                              {title}
                            </span>
                            {detail && (
                              <span className="mt-0.5 block text-xs leading-relaxed text-navy-500">
                                {detail}
                              </span>
                            )}
                          </span>
                          <span
                            aria-hidden="true"
                            className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border transition-colors duration-150 ${
                              selected
                                ? 'border-brand-600 bg-brand-600 text-white'
                                : 'border-navy-300 bg-white text-transparent'
                            }`}
                          >
                            <Check className="h-3 w-3" />
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}

              {option.type === 'input' && (
                <input
                  id={inputId}
                  type="text"
                  value={value}
                  onChange={(event) => onChange(option.id, event.target.value)}
                  className="min-h-12 w-full rounded-xl border border-navy-200 bg-white px-4 py-3 text-sm text-navy-900 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.18)] outline-none transition-[border-color,box-shadow,background-color] duration-200 placeholder:text-navy-400 hover:border-brand-300 focus:border-brand-500 focus:ring-4 focus:ring-brand-100/70"
                  placeholder={String(option.default)}
                />
              )}

              {option.type === 'range' && (
                <div className="flex items-center gap-3 rounded-xl border border-navy-200 bg-white px-4 py-2.5 shadow-[0_2px_8px_-4px_rgba(15,23,42,0.18)] transition-colors duration-200 focus-within:border-brand-300">
                  <input
                    id={inputId}
                    type="range"
                    min={option.min}
                    max={option.max}
                    step={option.step}
                    value={value}
                    onChange={(event) => onChange(option.id, event.target.value)}
                    className="folio-range h-2 flex-1 cursor-pointer"
                  />
                  <output
                    htmlFor={inputId}
                    aria-live="polite"
                    className="min-w-12 rounded-lg bg-brand-50 px-2.5 py-1.5 text-right text-sm font-semibold tabular-nums text-brand-800"
                  >
                    {value}%
                  </output>
                </div>
              )}

              {option.type === 'toggle' && (
                <button
                  id={inputId}
                  type="button"
                  role="switch"
                  aria-checked={value === 'true'}
                  aria-label={option.label}
                  onClick={() => onChange(option.id, value === 'true' ? 'false' : 'true')}
                  className={`relative h-7 w-12 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-100 ${
                    value === 'true' ? 'bg-brand-600' : 'bg-navy-200'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow-sm transition-transform duration-200 ${
                      value === 'true' ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              )}
            </div>
          </motion.div>}
          </AnimatePresence>
        );
      })}
    </div>
  );
}
