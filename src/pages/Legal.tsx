import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { brand } from '@/lib/brand';

function Shell({ title, children }: { title: string; children: ReactNode }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.article
      initial={reduceMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="mx-auto max-w-3xl px-5 sm:px-8 py-10 sm:py-14"
    >
      <p className="text-sm font-semibold uppercase tracking-wider text-brand-600">FolioUp</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-navy-900">{title}</h1>
      <div className="mt-8 space-y-4 text-sm leading-relaxed text-navy-600">{children}</div>
      <p className="mt-10 text-xs text-navy-400">
        FolioUp is a provisional product name pending domain and trademark checks.
      </p>
    </motion.article>
  );
}

export function PrivacyPage() {
  return (
    <Shell title="Privacy policy">
      <p>
        FolioUp is a tool-first website. You do not need an account for the tools that currently
        work.
      </p>
      <p>
        <strong className="text-navy-800">Browser tools:</strong> files are processed locally in
        your browser with libraries such as pdf-lib and PDF.js. They are not uploaded to FolioUp
        servers. We cannot see the contents of those files. Copies remain in browser memory until
        you leave the page, refresh, or start over — there is no guaranteed “instant remote delete”
        because nothing was stored remotely.
      </p>
      <p>
        <strong className="text-navy-800">What we do not do:</strong> we do not use your documents
        to train models, and we do not share file contents with third parties.
      </p>
      <p>
        <strong className="text-navy-800">Future server tools:</strong> office conversion, OCR, and
        encryption are marked Coming soon. If a tool later needs a server, it will say so on that
        page, keep files private, set an explicit retention window, and delete objects on expiry.
        Those guarantees are not in place until that pipeline exists.
      </p>
      <p>
        Analytics, if added later, will be documented here. Contact{' '}
        <a className="text-brand-700 underline" href={`mailto:${brand.email}`}>
          {brand.email}
        </a>
        .
      </p>
    </Shell>
  );
}

export function TermsPage() {
  return (
    <Shell title="Terms of use">
      <p>
        FolioUp is provided as-is for personal and business document tasks you are authorized to
        perform. You are responsible for the files you process and for complying with copyright and
        privacy law.
      </p>
      <p>
        Compression, conversion, and rendering are best-effort. Lossy compression can remove
        selectable text. We do not promise perfect layout preservation or that every file will get
        smaller.
      </p>
      <p>
        Do not use FolioUp to access encrypted documents without authorization, crack passwords, or
        hide evidence. Redaction tools, when shipped, must actually remove content — painting a
        black box is not enough, and that feature is not available yet.
      </p>
      <p>
        Tools listed as Coming soon are not functional. Do not rely on them for production work.
      </p>
    </Shell>
  );
}

export function SecurityPage() {
  return (
    <Shell title="Security">
      <p>This release is a browser-first MVP:</p>
      <ul className="list-disc pl-5 space-y-2">
        <li>No account system and no workspace dashboard.</li>
        <li>Client-side validation of type, size, and PDF magic bytes (%PDF).</li>
        <li>Password-protected PDFs are rejected rather than silently opened.</li>
        <li>No public object storage for user files, because files are not uploaded.</li>
        <li>Native engines (qpdf, Ghostscript, LibreOffice, Tesseract) are not installed yet.</li>
      </ul>
      <p>
        When server processing is introduced it will use private object keys, short-lived
        downloads, resource limits, and isolated workers. That architecture is documented in the
        project README and is not claimed as live.
      </p>
      <Link to="/privacy" className="text-brand-700 font-semibold">
        Read the privacy policy
      </Link>
    </Shell>
  );
}

export function ContactPage() {
  return (
    <Shell title="Contact">
      <p>
        Questions about FolioUp, privacy, or a tool that failed on your file:{' '}
        <a className="text-brand-700 underline" href={`mailto:${brand.email}`}>
          {brand.email}
        </a>
        .
      </p>
      <p>
        Please do not email confidential documents unless we have agreed a secure channel. For
        browser tools, processing never leaves your machine.
      </p>
    </Shell>
  );
}
