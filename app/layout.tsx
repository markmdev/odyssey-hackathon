import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Memory Palace',
  description: 'Train your memory with the Method of Loci',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0a0a0f] text-gray-200 antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
