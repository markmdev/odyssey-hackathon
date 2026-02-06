import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memory Palace',
  description: 'Learn anything by walking through a vivid AI-generated memory palace',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-surface text-gray-300 antialiased min-h-screen font-body">
        {children}
      </body>
    </html>
  );
}
