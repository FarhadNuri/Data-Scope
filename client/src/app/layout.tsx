import type { Metadata } from 'next';
import './globals.css';
import { Providers } from './providers';

export const metadata: Metadata = {
  title: 'DataScope',
  description: 'DataScope internal data exploration portal',
};

// Immediate client script to apply dark mode before initial paint to prevent theme flash
const themeScript = `
  (function() {
    try {
      var saved = localStorage.getItem('datascope_theme');
      var isDark = saved === 'dark' || ((saved === 'system' || !saved) && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
