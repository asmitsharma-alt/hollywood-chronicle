import type { Metadata } from 'next';
import { Playfair_Display, Lora, Cinzel, Courier_Prime } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-newsreader',
  style: ['normal', 'italic'],
  display: 'swap',
});

const cinzel = Cinzel({
  subsets: ['latin'],
  variable: '--font-cinzel',
  display: 'swap',
});

const courier = Courier_Prime({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'THE HOLLYWOOD CHRONICLE — The Daily Pop Culture & Cinema Broadsheet',
  description: 'The authoritative daily dispatch on motion pictures, television, streaming, and entertainment culture. Verified by AI, printed for the broadside.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${playfair.variable} ${lora.variable} ${cinzel.variable} ${courier.variable}`}
    >
      <body className="min-h-screen bg-[#fbf9f4] text-[#141210] selection:bg-[#c59b27]/30 selection:text-black">
        {children}
      </body>
    </html>
  );
}
