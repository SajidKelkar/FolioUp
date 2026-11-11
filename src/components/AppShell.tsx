import { useState, type ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import ToolsSidebar from '@/components/ToolsSidebar';
import { PanelLeftClose } from 'lucide-react';

interface AppShellProps {
  children: ReactNode;
  showSidebar?: boolean;
}

export default function AppShell({ children, showSidebar = true }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="relative mx-auto flex w-full max-w-[1500px] items-start gap-0 px-0">
      {/* Tools sidebar (left) */}
      {showSidebar && <ToolsSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Work area (right) */}
      <div className="relative flex-1 min-w-0">
        {showSidebar && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden sticky top-20 z-30 ml-4 mt-4 inline-flex items-center gap-2 rounded-xl border border-navy-200 bg-white/80 backdrop-blur px-4 py-2.5 text-sm font-semibold text-navy-700 shadow-soft hover:border-brand-300 hover:text-brand-700 transition-all"
          >
            <PanelLeftClose className="h-4 w-4" />
            Tools
          </button>
        )}
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="px-5 sm:px-8 lg:px-10 py-6 sm:py-8"
          >
            {children}
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
