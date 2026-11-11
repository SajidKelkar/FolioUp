import { lazy, Suspense, useLayoutEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { motion, MotionConfig, useReducedMotion } from 'framer-motion';
import { ThemeProvider } from '@/lib/theme';
import Background from '@/components/Background';
import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Stats from '@/components/Stats';
import PopularTools from '@/components/PopularTools';
import Categories from '@/components/Categories';
import Features from '@/components/Features';
import HowItWorks from '@/components/HowItWorks';
import PrivacyStrip from '@/components/PrivacyStrip';
import FAQ from '@/components/FAQ';
import Footer from '@/components/Footer';

const AllTools = lazy(() => import('@/pages/AllTools'));
const ToolPage = lazy(() => import('@/components/tools/ToolPage'));
const PrivacyPage = lazy(() => import('@/pages/Legal').then((module) => ({ default: module.PrivacyPage })));
const TermsPage = lazy(() => import('@/pages/Legal').then((module) => ({ default: module.TermsPage })));
const SecurityPage = lazy(() => import('@/pages/Legal').then((module) => ({ default: module.SecurityPage })));
const ContactPage = lazy(() => import('@/pages/Legal').then((module) => ({ default: module.ContactPage })));

function RouteScrollManager() {
  const { pathname, hash } = useLocation();

  useLayoutEffect(() => {
    if (hash) {
      document.getElementById(hash.slice(1))?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return null;
}

function HomePage() {
  return (
    <>
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <Hero />
        <Stats />
        <PopularTools />
        <Categories />
      </div>
      <Features />
      <HowItWorks />
      <PrivacyStrip />
      <FAQ />
    </>
  );
}

function AppLayout() {
  const location = useLocation();
  const reduceMotion = useReducedMotion();

  return (
    <>
      <RouteScrollManager />
      <div className="min-h-screen flex flex-col">
        <Background />
        <Header />
        <div className="flex-1 pt-16">
          <motion.div
            key={location.pathname}
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: reduceMotion ? 0 : 0.24, ease: [0.22, 1, 0.36, 1] }}
          >
          <Suspense
            fallback={
              <div role="status" className="mx-auto flex min-h-[50vh] max-w-6xl items-center justify-center px-5 text-sm font-medium text-navy-500">
                Loading FolioUp…
              </div>
            }
          >
            <Routes location={location}>
              <Route path="/" element={<HomePage />} />
              <Route
                path="/all-tools"
                element={
                  <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
                    <AllTools />
                  </div>
                }
              />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/security" element={<SecurityPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route
                path="/:slug"
                element={
                  <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
                    <ToolPage />
                  </div>
                }
              />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          </motion.div>
        </div>
        {location.pathname === '/' && <Footer />}
      </div>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <AppLayout />
      </BrowserRouter>
      </MotionConfig>
    </ThemeProvider>
  );
}
