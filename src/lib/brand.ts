export const brand = {
  name: 'FolioUp',
  tagline: 'Your everyday file toolkit.',
  description:
    'Compress, resize, convert, and organize files with free browser-based tools. No account required, and your files stay on your device.',
  domain: 'folioup.app',
  email: 'hello@folioup.app',
  favicon: '/favicon.svg',
  logo: {
    mark: '/favicon.svg',
  },
  colors: {
    navy: '#0f172a',
    brandStart: '#6d28d9',
    brandMid: '#4f46e5',
    brandEnd: '#2563eb',
  },
  social: {
    twitter: 'https://twitter.com/folioup',
    github: 'https://github.com/folioup',
  },
  retention:
    'Available tools run in your browser. Files stay on your device unless a future server-side tool clearly asks you to upload them. Browser memory is released when you leave the page or start over.',
} as const;
